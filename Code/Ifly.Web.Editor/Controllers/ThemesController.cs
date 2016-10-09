using Ifly.Layout;
using System.IO;
using System.Text;
using System.Web.Mvc;

namespace Ifly.Web.Editor.Controllers
{
    /// <summary>
    /// Represents themes controller.
    /// </summary>
    [AllowAnonymous]
    public class ThemesController : Controller
    {
        /// <summary>
        /// Returns the contents of a GitHub themes bundle.
        /// </summary>
        /// <returns>Action result.</returns>
        public ActionResult GetGitHubBundleContents()
        {
            return GetBundleContents(ThemeSource.GitHub.GetBundleStream());
        }

        /// <summary>
        /// Returns the contents of a GitHub themes bundle.
        /// </summary>
        /// <returns>Action result.</returns>
        public ActionResult GetUserBundleContents()
        {
            return GetBundleContents(ThemeSource.User.GetBundleStream());
        }

        /// <summary>
        /// Returns the contents of a themes bundle.
        /// </summary>
        /// <param name="bundleStream">Bundle stream.</param>
        /// <returns>Action result.</returns>
        private ActionResult GetBundleContents(Stream bundleStream)
        {
            ActionResult ret = null;
            byte[] bundleData = null;

            if (bundleStream != null)
            {
                using (bundleStream)
                {
                    using (StreamReader reader = new StreamReader(bundleStream))
                        bundleData = Encoding.UTF8.GetBytes(reader.ReadToEnd());
                }

                ret = new FileContentResult(bundleData, "text/css");
            }
            else
                ret = Content(string.Empty, "text/css");

            return ret;
        }
    }
}
