using System.Net.Mime;
using System.Web.Mvc;

namespace Ifly.Web.Editor.Controllers
{
    /// <summary>
    /// Represents video export utils controller.
    /// </summary>
    [AllowAnonymous]
    public class VideoExportUtilsController : Controller
    {
        /// <summary>
        /// Downloads exported video.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Result.</returns>
        public ActionResult DownloadExportedVideo(string key)
        {
            byte[] fileData = {};
            ActionResult ret = null;
            Api.Export.ExportKey exportKey = null;
            string fullPhysicalPath = string.Empty;
            ContentDisposition contentDisposition = null;

            if (Api.Export.ExportKey.TryParse(key, out exportKey))
            {
                fullPhysicalPath = System.Web.HttpContext.Current.Server.MapPath(string.Format("~/App_Data/Exports/{0}/{1}.mp4",
                        exportKey.PresentationId, exportKey.ToString()));
            }

            if (System.IO.File.Exists(fullPhysicalPath))
            {
                fileData = System.IO.File.ReadAllBytes(fullPhysicalPath);
                System.IO.File.Delete(fullPhysicalPath);
            }

            contentDisposition = new System.Net.Mime.ContentDisposition()
            {
                FileName = "video.mp4",
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
