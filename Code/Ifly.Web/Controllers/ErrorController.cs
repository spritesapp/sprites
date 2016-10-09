using System.Web.Mvc;

namespace Ifly.Web.Editor.Controllers
{
    /// <summary>
    /// Represents error handling controller.
    /// </summary>
    [AllowAnonymous]
    public class ErrorController : Controller
    {
        /// <summary>
        /// Returns details about the given error.
        /// </summary>
        /// <param name="id">Status code.</param>
        /// <returns>Action result.</returns>
        public ActionResult Details(int id)
        {
            return View(id.ToString(), id);
        }

        /// <summary>
        /// Called after the action method is invoked.
        /// </summary>
        /// <param name="filterContext">Filter context.</param>
        protected override void OnActionExecuted(ActionExecutedContext filterContext)
        {
            int id = -1;

            if (filterContext.RouteData.Values.ContainsKey("id") && filterContext.RouteData.Values["id"] != null &&
                int.TryParse(filterContext.RouteData.Values["id"].ToString(), out id))
            {
                filterContext.HttpContext.Response.StatusCode = id;
            }

            base.OnActionExecuted(filterContext);
        }
    }
}