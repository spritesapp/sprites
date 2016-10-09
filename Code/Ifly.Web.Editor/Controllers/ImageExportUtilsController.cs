using System.Net.Mime;
using System.Web.Mvc;

namespace Ifly.Web.Editor.Controllers
{
    /// <summary>
    /// Represents image export utils controller.
    /// </summary>
    [AllowAnonymous]
    public class ImageExportUtilsController : Controller
    {
        /// <summary>
        /// Downloads exported image.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Result.</returns>
        public ActionResult DownloadExportedImage(string key)
        {
            byte[] fileData = {};
            ActionResult ret = null;
            string extension = string.Empty;
            Api.Export.ExportKey exportKey = null;
            string fullPhysicalPath = string.Empty;
            ContentDisposition contentDisposition = null;

            if (Api.Export.ExportKey.TryParse(key, out exportKey))
            {
                extension = System.Enum.GetName(typeof(Models.ImageExportFormat), exportKey.Format).ToLowerInvariant();

                fullPhysicalPath = System.Web.HttpContext.Current.Server.MapPath(string.Format("~/App_Data/Exports/{0}/{1}.{2}",
                        exportKey.PresentationId, exportKey.ToString(), extension));
            }

            if (System.IO.File.Exists(fullPhysicalPath))
            {
                fileData = ServiceAdapter.ImageToPdfComposer.TryCompose(fullPhysicalPath);

                if (fileData == null)
                {
                    fileData = System.IO.File.ReadAllBytes(fullPhysicalPath);
                    System.IO.File.Delete(fullPhysicalPath);
                }
            }

            contentDisposition = new System.Net.Mime.ContentDisposition()
            {
                FileName = string.Format("image.{0}", extension),
                Inline = false
            };

            Response.AppendHeader("Content-Disposition", contentDisposition.ToString());

            Response.Headers.Remove("Cache-Control");
            Response.Headers.Remove("Pragma");
            Response.Headers.Remove("Expires");

            ret = File(fileData, "application/octet-stream");

            return ret;
        }
    }
}
