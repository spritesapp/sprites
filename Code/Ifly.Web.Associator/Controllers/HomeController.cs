using System.Web.Mvc;

namespace Ifly.Web.Associator.Controllers
{
    /// <summary>
    /// Represents a home controller.
    /// </summary>
    public class HomeController : Controller
    {
        /// <summary>
        /// Throws a test exception.
        /// </summary>
        /// <returns>Action result.</returns>
        public ActionResult Throw()
        {
            throw new System.Exception("You've asked for it...");
        }

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
