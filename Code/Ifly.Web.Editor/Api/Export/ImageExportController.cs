using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.IO;
using Ifly.QueueService;

namespace Ifly.Web.Editor.Api.Export
{
    /// <summary>
    /// Represents an export key.
    /// </summary>
    public class ExportKey
    {
        /// <summary>
        /// Gets or sets the presentation Id.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the correlation Id.
        /// </summary>
        public string CorrelationId { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the key was created.
        /// </summary>
        public DateTime Created { get; set; }

        /// <summary>
        /// Gets or sets image export format.
        /// </summary>
        public Models.ImageExportFormat Format { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="format">Export format.</param>
        public ExportKey(int presentationId) : this(presentationId, Models.ImageExportFormat.JPG) {}

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="format">Export format.</param>
        public ExportKey(int presentationId, Models.ImageExportFormat format)
        {
            PresentationId = presentationId;
            CorrelationId = Guid.NewGuid().ToString();
            Created = DateTime.UtcNow;
            Format = format;
        }

        /// <summary>
        /// Returns a string representation of the current object.
        /// </summary>
        /// <returns>A string representation of the current object.</returns>
        public override string ToString()
        {
            return string.Format("{0},{1},{2},{3}", Created.Ticks.ToString(), PresentationId, CorrelationId, Format);
        }

        /// <summary>
        /// Tries to parse the given key.
        /// </summary>
        /// <param name="input">Input string.</param>
        /// <param name="result">Result.</param>
        /// <returns>Value indicating whether key was parsed.</returns>
        public static bool TryParse(string input, out ExportKey result)
        {
            bool ret = false;
            long created = 0;
            int presentationId = -1;
            string[] components = null;
            Guid correlationId = Guid.Empty;
            Models.ImageExportFormat format = Models.ImageExportFormat.JPG;

            result = null;

            if (string.IsNullOrWhiteSpace(input) || string.Compare(input, "null", true) == 0)
            {
                ret = true;

                result = new ExportKey(-1, Models.ImageExportFormat.JPG)
                {
                    CorrelationId = string.Empty,
                    Created = DateTime.MinValue
                };
            }
            else
            {
                components = input.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
                if (components != null && components.Length > 3)
                {
                    if (long.TryParse(components[0], out created) && int.TryParse(components[1], out presentationId) &&
                        Guid.TryParse(components[2], out correlationId) && Enum.TryParse<Models.ImageExportFormat>(components[3], out format))
                    {
                        ret = true;
                        result = new ExportKey(presentationId, format)
                        {
                            CorrelationId = correlationId.ToString(),
                            Created = new DateTime(created, DateTimeKind.Utc)
                        };
                    }
                }
            }

            return ret;
        }
    }

    /// <summary>
    /// Represents image export controller.
    /// </summary>
    public class ImageExportController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 7; }
        }

        /// <summary>
        /// Creates export task.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <returns>Response.</returns>
        [HttpPost]
        public Models.ImageExportResponseModel CreateImageExportTask(Models.ImageExportRequestModel request)
        {
            ExportKey exportKey = null;
            Models.ImageExportResponseModel ret = null;
            string extension = Enum.GetName(typeof(Models.ImageExportFormat), request.Format).ToLowerInvariant();
            string exportsPhysicalPath = string.Empty, presentationExportsPhysicalPath = string.Empty, fullPhysicalPath = string.Empty;

            if (request != null && request.PresentationId > 0 && request.Slide >= 0 && request.Width > 0)
            {
                exportKey = new ExportKey(request.PresentationId, request.Format);
                exportsPhysicalPath = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Exports");

                if (!Directory.Exists(exportsPhysicalPath))
                    Directory.CreateDirectory(exportsPhysicalPath);

                presentationExportsPhysicalPath =Path.Combine(exportsPhysicalPath, request.PresentationId.ToString());

                if (!Directory.Exists(presentationExportsPhysicalPath))
                    Directory.CreateDirectory(presentationExportsPhysicalPath);

                fullPhysicalPath = Path.Combine(presentationExportsPhysicalPath, string.Format("{0}.{1}", exportKey.ToString(), extension));

                if (!string.IsNullOrEmpty(System.Configuration.ConfigurationManager.AppSettings["ExportProviderUrl"]))
                    fullPhysicalPath = string.Format(@"C:\Apps\Ifly\Ifly.ExportProvider\App_Data\Exports\{0}.{1}", exportKey.ToString(), extension);

                ret = new Models.ImageExportResponseModel()
                {
                    Key = exportKey.ToString()
                };

                MessageQueueManager.Current.GetQueue(MessageQueueType.Export).AddMessages(new Message[] { new Message()
                {
                    Id = System.Guid.NewGuid().ToString(),
                    Body = new GenericMessageBody
                        (
                            new Tuple<string, string>("PresentationId", request.PresentationId.ToString()), 
                            new Tuple<string, string>("Slide", request.Slide.ToString()),
                            new Tuple<string, string>("TotalSlides", request.TotalSlides.ToString()),
                            new Tuple<string, string>("Width", request.Width.ToString()),
                            new Tuple<string, string>("OutputFile", fullPhysicalPath)
                        ).ToString()
                }});

                NotifyAboutImageExport(request.PresentationId, request.Slide);
            }

            return ret;
        }

        /// <summary>
        /// Queries image export status.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Image export status.</returns>
        [HttpGet]
        public Models.ImageExportStatusResponseModel GetImageExportStatus(string key)
        {
            bool completed = false;
            ExportKey exportKey = null;
            string extension = string.Empty;
            string extraData = string.Empty;
            string providerUrl = string.Empty;
            string fullPhysicalPath = string.Empty;
            Models.ImageExportStatusResponseModel ret = null;
            
            if (ExportKey.TryParse(key, out exportKey))
            {
                if (DateTime.UtcNow.Subtract(exportKey.Created).TotalSeconds >= 1000)
                {
                    ret = new Models.ImageExportStatusResponseModel()
                    {
                        Key = exportKey.ToString(),
                        Success = false
                    };
                }
                else
                {
                    extension = Enum.GetName(typeof(Models.ImageExportFormat), exportKey.Format).ToLowerInvariant();
                    providerUrl = System.Configuration.ConfigurationManager.AppSettings["ExportProviderUrl"];

                    if (!string.IsNullOrEmpty(providerUrl) && Ifly.Utils.WebResource.QueryStatus(string.Format("{0}/status?key={1}",
                        providerUrl.TrimEnd('/'), System.Web.HttpContext.Current.Server.UrlEncode(exportKey.ToString())), out extraData) == HttpStatusCode.OK)
                    {
                        completed = true;
                    }
                    else
                    {
                        fullPhysicalPath = System.Web.HttpContext.Current.Server.MapPath(string.Format("~/App_Data/Exports/{0}/{1}.{2}",
                            exportKey.PresentationId, exportKey.ToString(), extension));

                        if (File.Exists(fullPhysicalPath))
                            completed = true;
                    }

                    if (completed)
                    {
                        ret = new Models.ImageExportStatusResponseModel()
                        {
                            Key = exportKey.ToString(),
                            Success = true
                        };
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Notifies about image export.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="slide">Slide index.</param>
        private void NotifyAboutImageExport(int presentationId, int slide)
        {
            if (presentationId > 0)
            {
                MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                {
                    Id = Guid.NewGuid().ToString(),
                    Subject = string.Format("Image export ({0})", Guid.NewGuid()),
                    Body = string.Format("*** {0} <{1}, {2}> ***", PublishConfiguration.GetAbsoluteUri(Request.RequestUri, presentationId), presentationId, slide)
                }});
            }
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "CreateImageExportTask",
                routeTemplate: "api/export/image/create",
                defaults: new { controller = "ImageExport", action = "CreateImageExportTask" }
            );

            config.Routes.MapHttpRoute(
                name: "GetImageExportStatus",
                routeTemplate: "api/export/image/status",
                defaults: new { controller = "ImageExport", action = "GetImageExportStatus" }
            );
        }
    }
}
