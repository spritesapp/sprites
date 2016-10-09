using System.Web.Mvc;

namespace Ifly.Web.Controllers
{
    /// <summary>
    /// Represents legal controller.
    /// </summary>
    public class LegalController : Controller
    {
        /// <summary>
        /// Serves "Terms of service" document.
        /// </summary>
        /// <returns>Action result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult TermsOfService()
        {
            return GetPdfContent("tos");
        }

        /// <summary>
        /// Serves "Terms of service" document.
        /// </summary>
        /// <returns>Action result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult PrivacyPolicy()
        {
            return GetPdfContent("privacy");
        }

        /// <summary>
        /// Returns PDF content.
        /// </summary>
        /// <param name="file">File name.</param>
        /// <returns>Content.</returns>
        private ActionResult GetPdfContent(string file)
        {
            return File(string.Format("/Assets/legal/{0}.pdf", file), "application/pdf");
        }

    }
}
