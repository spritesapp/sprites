using Ifly.External.OAuth;
using System.Web.Mvc;

namespace Ifly.Web.Controllers
{
    /// <summary>
    /// Represents OAuth controller.
    /// </summary>
    [AllowAnonymous]
    public class OAuthController : Controller
    {
        /// <summary>
        /// Authorizes API access.
        /// </summary>
        /// <param name="provider">Provider.</param>
        /// <returns>Action result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Authorize(string provider)
        {
            OAuthClient client = OAuthClient.GetClient(provider);

            if (client != null)
                client.HandleRequest(this.Request.Url);

            return Content("<script>window.close();</script>", "text/html");
        }

        /// <summary>
        /// Ensures that there's a valid access token available for a given provider.
        /// </summary>
        /// <param name="provider">Provider.</param>
        /// <param name="userId">User Id.</param>
        /// <returns>Authorization result.</returns>
        [HttpPost]
        [AllowAnonymous]
        public ActionResult EnsureAuthorization(string provider, int userId)
        {
            OAuthAuthorizationResult result = null;
            OAuthClient client = OAuthClient.GetClient(provider);

            if (client != null)
                result = client.EnsureAuthorization(userId);

            return Json(result);
        }

        /// <summary>
        /// Checks whether the client is authorized.
        /// </summary>
        /// <param name="provider">Provider.</param>
        /// <param name="userId">User Id.</param>
        /// <returns>Authorization result.</returns>
        [HttpPost]
        [AllowAnonymous]
        public ActionResult CheckAuthorizationStatus(string provider, int userId)
        {
            OAuthAuthorizationResult result = null;
            OAuthClient client = OAuthClient.GetClient(provider);

            if (client != null)
                result = client.CheckAuthorizationStatus(userId);

            return Json(result);
        }
    }
}