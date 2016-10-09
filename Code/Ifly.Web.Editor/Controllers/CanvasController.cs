using System.Web.Mvc;

namespace Ifly.Web.Editor.Controllers
{
    /// <summary>
    /// Represents a canvas controller.
    /// </summary>
    [Authorize]
    public class CanvasController : Controller
    {
        /// <summary>
        /// Returns the result of a default action.
        /// </summary>
        /// <returns>Result.</returns>
        public ActionResult Index()
        {
            return View();
        }
    }
}
