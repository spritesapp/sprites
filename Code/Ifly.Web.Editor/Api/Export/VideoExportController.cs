using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.IO;
using Ifly.QueueService;
using System.Threading.Tasks;
using System.Runtime.InteropServices;
using System.Threading;

namespace Ifly.Web.Editor.Api.Export
{
    /// <summary>
    /// Represents video export controller.
    /// </summary>
    public class VideoExportController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 8; }
        }

        /// <summary>
        /// Creates export task.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <returns>Response.</returns>
        [HttpPost]
        public Models.VideoExportResponseModel CreateVideoExportTask(Models.VideoExportRequestModel request)
        {
            ExportKey exportKey = null;
            string audioFile = string.Empty;
            Models.VideoExportResponseModel ret = null;
            string exportsPhysicalPath = string.Empty, presentationExportsPhysicalPath = string.Empty, fullPhysicalPath = string.Empty;

            if (request != null && request.PresentationId > 0 && request.Width > 0)
            {
                exportKey = new ExportKey(request.PresentationId);
                exportsPhysicalPath = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Exports");

                if (!Directory.Exists(exportsPhysicalPath))
                    Directory.CreateDirectory(exportsPhysicalPath);

                presentationExportsPhysicalPath = Path.Combine(exportsPhysicalPath, request.PresentationId.ToString());

                if (!Directory.Exists(presentationExportsPhysicalPath))
                    Directory.CreateDirectory(presentationExportsPhysicalPath);

                fullPhysicalPath = Path.Combine(presentationExportsPhysicalPath, string.Format("{0}.mp4", exportKey.ToString()));
                audioFile = !string.IsNullOrEmpty(request.Audio) ? Path.Combine(System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Uploads"), request.Audio) : string.Empty;

                if (!string.IsNullOrEmpty(System.Configuration.ConfigurationManager.AppSettings["ExportProviderUrl"]))
                {
                    fullPhysicalPath = string.Format(@"C:\Apps\Ifly\Ifly.ExportProvider\App_Data\Exports\{0}.mp4", exportKey.ToString());

                    if (!string.IsNullOrEmpty(audioFile))
                        audioFile = string.Format(@"C:\Apps\Ifly\Ifly.ExportProvider\App_Data\Uploads\{0}", System.IO.Path.GetFileName(audioFile));
                }

                ret = new Models.VideoExportResponseModel()
                {
                    Key = exportKey.ToString()
                };

                MessageQueueManager.Current.GetQueue(MessageQueueType.Export).AddMessages(new Message[] { new Message()
                {
                    Id = System.Guid.NewGuid().ToString(),
                    Body = new GenericMessageBody
                        (
                            new Tuple<string, string>("PresentationId", request.PresentationId.ToString()), 
                            new Tuple<string, string>("Width", request.Width.ToString()),
                            new Tuple<string, string>("OutputFile", fullPhysicalPath),
                            new Tuple<string, string>("AudioFile", audioFile)
                        ).ToString()
                }});

                NotifyAboutVideoExport(request.PresentationId);
            }

            return ret;
        }

        /// <summary>
        /// Queries video export status.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <param name="continuation">Continuation.</param>
        /// <param name="task">Current task.</param>
        /// <returns>Video export status.</returns>
        [HttpGet]
        public Models.VideoExportStatusResponseModel GetVideoExportStatus(string key, string continuation = null, string task = null)
        {
            bool completed = false;
            ExportKey exportKey = null;
            string extraData = string.Empty;
            string providerUrl = string.Empty;
            string fullPhysicalPath = string.Empty;
            Models.VideoExportStatusResponseModel ret = null;
            
            if (ExportKey.TryParse(key, out exportKey))
            {
                if (DateTime.UtcNow.Subtract(exportKey.Created).TotalSeconds >= 1000 && string.Compare(task ?? string.Empty, "publish", true) != 0)
                {
                    ret = new Models.VideoExportStatusResponseModel()
                    {
                        Key = exportKey.ToString(),
                        Success = false
                    };
                }
                else
                {
                    providerUrl = System.Configuration.ConfigurationManager.AppSettings["ExportProviderUrl"];

                    if (!string.IsNullOrEmpty(providerUrl) && Ifly.Utils.WebResource.QueryStatus(string.Format("{0}/status?key={1}",
                        providerUrl.TrimEnd('/'), System.Web.HttpContext.Current.Server.UrlEncode(exportKey.ToString())), out extraData) == HttpStatusCode.OK)
                    {
                        if (string.IsNullOrEmpty(continuation))
                            completed = true;
                        else
                        {
                            Ifly.Utils.WebResource.FireAndForget(string.Format("{0}/continue?key={1}&continuation={2}",
                                providerUrl.TrimEnd('/'), System.Web.HttpContext.Current.Server.UrlEncode(exportKey.ToString()),
                                System.Web.HttpContext.Current.Server.UrlEncode(continuation)));

                            ret = new Models.VideoExportStatusResponseModel()
                            {
                                Task = "publish"
                            };
                        }
                    }
                    else
                    {
                        fullPhysicalPath = System.Web.HttpContext.Current.Server.MapPath(string.Format("~/App_Data/Exports/{0}/{1}.mp4",
                            exportKey.PresentationId, exportKey.ToString()));

                        if (File.Exists(fullPhysicalPath))
                        {
                            if (string.IsNullOrEmpty(continuation))
                                completed = true;
                            else
                            {
                                Ifly.ServiceAdapter.VideoPublishBroker.CreateVideoPublishTask(fullPhysicalPath, continuation);

                                ret = new Models.VideoExportStatusResponseModel()
                                {
                                    Task = "publish"
                                };
                            }
                        }
                        else
                        {
                            if (!string.IsNullOrEmpty((extraData = Ifly.ServiceAdapter.VideoPublishBroker.GetVideoPublishStatus(fullPhysicalPath))))
                                completed = true;
                        }
                    }

                    if (completed)
                    {
                        ret = new Models.VideoExportStatusResponseModel()
                        {
                            Key = exportKey.ToString(),
                            ExtraData = extraData,
                            Success = true
                        };
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Removes the given audio file.
        /// </summary>
        /// <param name="name">File name.</param>
        [HttpPost]
        public void RemoveAudio(string name)
        {
            string fullPath = Path.Combine(System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Uploads"), name);

            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }

        /// <summary>
        /// Uploads the audio.
        /// </summary>
        /// <param name="id">Infographic Id.</param>
        /// <param name="current">Current file index.</param>
        /// <param name="total">Total files to be uploaded.</param>
        /// <param name="prev">Previous file name.</param>
        /// <returns>Audio file name.</returns>
        [HttpPost]
        public async Task<string> UploadAudio(int id, int current, int total, string prev)
        {
            string ret = null;
            bool uploaded = false;
            int maxSizeKb = 1024 * 10;
            string root = string.Empty;
            string format = string.Empty;
            MultipartFileData file = null;
            string fileName = string.Empty;
            string providerUrl = string.Empty;
            string targetFileName = string.Empty;
            string originalPhysicalPath = string.Empty;
            MultipartFormDataStreamProvider provider = null;

            if (id > 0)
            {
                if (!this.Request.Content.IsMimeMultipartContent())
                    throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);

                root = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Uploads");
                provider = new MultipartFormDataStreamProvider(root);

                await this.Request.Content.ReadAsMultipartAsync(provider);
                file = provider.FileData.FirstOrDefault();

                if (file != null)
                {
                    originalPhysicalPath = file.LocalFileName;

                    if (file.Headers.ContentType != null && !string.IsNullOrEmpty(file.Headers.ContentType.MediaType))
                        format = file.Headers.ContentType.MediaType.ToLowerInvariant().IndexOf("mp3") > 0 ? "mp3" : "wav";

                    if (string.Compare(format, "wav", true) == 0 && file.Headers.ContentDisposition != null && !string.IsNullOrEmpty(file.Headers.ContentDisposition.FileName))
                        format = file.Headers.ContentDisposition.FileName.IndexOf(".mp3", StringComparison.OrdinalIgnoreCase) >= 0 ? "mp3" : "wav";

                    if (File.Exists(originalPhysicalPath))
                    {
                        try
                        {
                            if ((new FileInfo(originalPhysicalPath).Length / 1024) > maxSizeKb)
                                File.Delete(originalPhysicalPath);
                            else
                            {
                                fileName = string.Format("{0}.{1}", Guid.NewGuid(), format);
                                targetFileName = Path.Combine(Path.GetDirectoryName(originalPhysicalPath), fileName);

                                if (File.Exists(targetFileName))
                                    File.Delete(targetFileName);

                                File.Move(originalPhysicalPath, targetFileName);

                                ret = fileName;

                                if (!string.IsNullOrWhiteSpace(prev))
                                {
                                    ret = Path.GetFileName(ServiceAdapter.AudioMixer.MixTracks(targetFileName, Path.Combine(root, prev),
                                        ServiceAdapter.AudioMixOutputLocation.SecondaryTrack));
                                }

                                if (current == total)
                                {
                                    providerUrl = System.Configuration.ConfigurationManager.AppSettings["ExportProviderUrl"];

                                    if (!string.IsNullOrEmpty(providerUrl))
                                    {
                                        uploaded = await UploadAudioFileToEncoderAsync(providerUrl, targetFileName);

                                        if (!uploaded)
                                            ret = string.Empty;

                                        File.Delete(targetFileName);
                                    }
                                }
                            }
                        }
                        catch (Exception)
                        {
                            if (File.Exists(originalPhysicalPath))
                                File.Delete(originalPhysicalPath);

                            throw;
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Uploads the audio file to the encoder.
        /// </summary>
        /// <param name="encoderBaseUrl">Encoder base URL.</param>
        /// <param name="filePath">File path.</param>
        /// <returns>Value indicating whether file has been uploaded.</returns>
        private async Task<bool> UploadAudioFileToEncoderAsync(string encoderBaseUrl, string filePath)
        {
            bool ret = false;
            HttpResponseMessage resp = null;
            string fileName = System.IO.Path.GetFileName(filePath);
            byte[] contents = System.IO.File.ReadAllBytes(filePath);
            Uri encoderUrl = new Uri(string.Format("{0}/upload", encoderBaseUrl.TrimEnd('/')));

            using (var m = new HttpRequestMessage(HttpMethod.Post, encoderUrl))
            {
                m.Headers.ExpectContinue = true;

                using (var c = new MultipartFormDataContent(string.Concat("----", Guid.NewGuid().ToString())))
                {
                    using (var bc = new ByteArrayContent(contents))
                    {
                        bc.Headers.Add("Content-Type", "application/octet-stream");
                        c.Add(bc, fileName, fileName);

                        m.Content = c;

                        using (var client = new HttpClient())
                        {
                            resp = await client.SendAsync(m, HttpCompletionOption.ResponseContentRead, CancellationToken.None);
                            ret = resp.StatusCode == HttpStatusCode.OK || resp.StatusCode == HttpStatusCode.Continue;
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Notifies about video export.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        private void NotifyAboutVideoExport(int presentationId)
        {
            if (presentationId > 0)
            {
                MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                {
                    Id = Guid.NewGuid().ToString(),
                    Subject = string.Format("Video export ({0})", Guid.NewGuid()),
                    Body = string.Format("*** {0} <{1}> ***", PublishConfiguration.GetAbsoluteUri(Request.RequestUri, presentationId), presentationId)
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
                name: "CreateVideoExportTask",
                routeTemplate: "api/export/video/create",
                defaults: new { controller = "VideoExport", action = "CreateVideoExportTask" }
            );

            config.Routes.MapHttpRoute(
                name: "GetVideoExportStatus",
                routeTemplate: "api/export/video/status",
                defaults: new { controller = "VideoExport", action = "GetVideoExportStatus" }
            );

            config.Routes.MapHttpRoute(
                name: "AddAudioToVideo",
                routeTemplate: "api/export/video/addaudio",
                defaults: new { controller = "VideoExport", action = "UploadAudio" }
            );

            config.Routes.MapHttpRoute(
                name: "RemoveAudioFile",
                routeTemplate: "api/export/video/removeaudio",
                defaults: new { controller = "VideoExport", action = "RemoveAudio" }
            );
        }
    }
}
