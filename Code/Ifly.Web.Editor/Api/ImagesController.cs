using System.Net;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Xml;
using System.Xml.Linq;
using System.Text;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents an image upload controller.
    /// </summary>
    public class ImagesController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 3; }
        }

        /// <summary>
        /// Uploads the image.
        /// </summary>
        /// <param name="id">Infographic Id.</param>
        /// <param name="slideId">Slide Id.</param>
        /// <param name="elementId">Element Id.</param>
        /// <returns>Image media item.</returns>
        [HttpPost]
        public async Task<Media.MediaItem> UploadImage(int? id, int? slideId, int? elementId)
        {
            string url = null;
            int maxSizeKb = 1024;
            Media.MediaItem ret = null;
            string root = string.Empty;
            string format = string.Empty;
            MultipartFileData file = null;
            string fileName = string.Empty;
            string uploadFileName = string.Empty;
            string targetFileName = string.Empty;
            string timeStampSuffix = string.Empty;
            string originalPhysicalPath = string.Empty;
            System.DateTime tdNow = System.DateTime.UtcNow;
            MultipartFormDataStreamProvider provider = null;
            
            if (!this.Request.Content.IsMimeMultipartContent())
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);

            root = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Uploads");
            provider = new MultipartFormDataStreamProvider(root);

            await this.Request.Content.ReadAsMultipartAsync(provider);
            file = provider.FileData.FirstOrDefault();

            if (file != null)
            {
                timeStampSuffix = (tdNow.Year + tdNow.Month + tdNow.Day +
                        tdNow.Hour + tdNow.Minute + tdNow.Second).ToString();

                if (file.Headers != null && file.Headers.ContentDisposition != null)
                    uploadFileName = (file.Headers.ContentDisposition.FileName ?? string.Empty).Trim('"').Trim();

                if (string.IsNullOrEmpty(uploadFileName))
                {
                    // This is not unique but short which is preferable.
                    uploadFileName = string.Format("Upload-{0}", timeStampSuffix);
                }

                uploadFileName = uploadFileName.Replace('\\', '/');

                if (uploadFileName.IndexOf('/') > 0)
                    uploadFileName = uploadFileName.Substring(uploadFileName.LastIndexOf('/') + 1);

                if (uploadFileName.IndexOf('.') > 0)
                    uploadFileName = uploadFileName.Substring(0, uploadFileName.LastIndexOf('.'));

                originalPhysicalPath = file.LocalFileName;

                if (File.Exists(originalPhysicalPath))
                {
                    if ((new FileInfo(originalPhysicalPath).Length / maxSizeKb) > maxSizeKb || string.IsNullOrEmpty((format = GetImageFormat(originalPhysicalPath))))
                        File.Delete(originalPhysicalPath);
                    else
                    {
                        fileName = string.Format("{0}.{1}", (id > 0 && slideId > 0 && elementId > 0 ? string.Format("{0}_{1}_{2}_{3}", id, slideId, elementId, timeStampSuffix) : System.Guid.NewGuid().ToString()), format);
                        uploadFileName = string.Format("{0}.{1}", uploadFileName.TrimEnd('.'), format);
                        targetFileName = Path.Combine(Path.GetDirectoryName(originalPhysicalPath), fileName);

                        if (File.Exists(targetFileName))
                            File.Delete(targetFileName);

                        File.Move(originalPhysicalPath, targetFileName);
                        url = string.Format("{0}://{1}/static/{2}", Request.RequestUri.Scheme, Request.RequestUri.Host, fileName);

                        ret = new Media.MediaItemManager().CreateItem(uploadFileName, url);
                    }
                }
            }
            
            return ret;
        }

        /// <summary>
        /// Uploads the presentation image.
        /// </summary>
        /// <param name="id">Infographic Id.</param>
        /// <returns>Image URL.</returns>
        [HttpPost]
        public async Task<string> UploadPresentationImage(int id)
        {
            string ret = null;
            int maxSizeKb = 1024;
            string root = string.Empty;
            string format = string.Empty;
            MultipartFileData file = null;
            string fileName = string.Empty;
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

                    if (File.Exists(originalPhysicalPath))
                    {
                        if ((new FileInfo(originalPhysicalPath).Length / maxSizeKb) > maxSizeKb || string.IsNullOrEmpty((format = GetImageFormat(originalPhysicalPath))))
                            File.Delete(originalPhysicalPath);
                        else
                        {
                            fileName = string.Format("{0}.{1}", id, format);
                            targetFileName = Path.Combine(Path.GetDirectoryName(originalPhysicalPath), fileName);

                            if (File.Exists(targetFileName))
                                File.Delete(targetFileName);

                            File.Move(originalPhysicalPath, targetFileName);
                            ret = string.Format("{0}://{1}/static/{2}", Request.RequestUri.Scheme, Request.RequestUri.Host, fileName);
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Determines the format of a given image.
        /// </summary>
        /// <param name="path">Image path.</param>
        /// <returns>Image format.</returns>
        private string GetImageFormat(string path)
        {
            XDocument doc = null;
            string ret = string.Empty;
            List<string> viewBox = new List<string>(new string[] { "0", "0" });
            System.Func<string, string> extractNumeric = (v) =>
            {
                var result = v;
                Match m = Regex.Match(result, "[0-9]+");

                if (m != null && m.Success)
                    result = m.Value.Trim();

                return result;
            };
            System.Action<string, System.Action<string>, string> readAttributeValue = (n, v, d) =>
                {
                    var attr = doc.Root.Attribute(n);

                    if (attr != null && !string.IsNullOrEmpty(attr.Value))
                        v(attr.Value);
                    else
                        v(d);
                };

            try
            {
                using (var stream = new FileStream(path, FileMode.Open))
                {
                    using (var reader = XmlReader.Create(stream))
                    {
                        while (reader.Read()) { }
                        ret = "svg";
                    }
                }
            }
            catch (System.Exception) { }

            if (string.Compare(ret, "svg", true) == 0)
            {
                try
                {
                    doc = XDocument.Load(path);

                    readAttributeValue("width", v => { viewBox.Add(extractNumeric(v)); }, "200");
                    readAttributeValue("height", v => { viewBox.Add(extractNumeric(v)); }, "200");

                    doc.Root.SetAttributeValue("width", null);
                    doc.Root.SetAttributeValue("height", null);
                    doc.Root.SetAttributeValue("viewBox", string.Join(" ", viewBox));
                    doc.Root.SetAttributeValue("preserveAspectRatio", "xMinYMin meet");

                    doc.Save(path);
                }
                catch (System.Exception) { }
            }

            if (string.IsNullOrEmpty(ret))
            {
                try
                {
                    using (var img = Image.FromFile(path))
                    {
                        if (img.RawFormat.Equals(ImageFormat.Jpeg))
                            ret = "jpg";
                        else if (img.RawFormat.Equals(ImageFormat.Png))
                            ret = "png";
                        else if (img.RawFormat.Equals(ImageFormat.Gif))
                            ret = "gif";
                        else if (img.RawFormat.Equals(ImageFormat.Bmp))
                            ret = "bmp";
                    }
                }
                catch (FileNotFoundException) { }
                catch (System.OutOfMemoryException) { }
            }

            return ret;
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "UploadImage",
                routeTemplate: "api/images/upload",
                defaults: new { controller = "Images", action = "UploadImage" }
            );

            config.Routes.MapHttpRoute(
                name: "UploadPresentationImage",
                routeTemplate: "api/presentations/{id}/images/upload",
                defaults: new { controller = "Images", action = "UploadPresentationImage" }
            );
        }
    }
}
