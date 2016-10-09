using System;
using System.Linq;
using System.Web.Mvc;

namespace Ifly.Web.Common.Filters
{
    /// <summary>
    /// Verifies that only administrators are allowed to execute the given controller/action.
    /// </summary>
    public class AdministratorsOnlyAttribute : ActionFilterAttribute
    {
        /// <summary>
        /// Called by ASP.NET framework before action method executes.
        /// </summary>
        /// <param name="filterContext">Action executing context.</param>
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            var ua = filterContext.HttpContext.Request.Headers["User-Agent"];

            if (!IsAdministrator(Ifly.ApplicationContext.Current.User))
                filterContext.Result = new HttpStatusCodeResult(System.Net.HttpStatusCode.Forbidden);

            base.OnActionExecuting(filterContext);
        }

        /// <summary>
        /// Returns value indicating whether the given user is administrator.
        /// </summary>
        /// <param name="user">User.</param>
        /// <returns>Value indicating whether the given user is administrator.</returns>
        private bool IsAdministrator(User user)
        {
            var result = false;
            var admins = System.Configuration.ConfigurationManager.AppSettings["AppAdmins"];

            if (user != null && !string.IsNullOrWhiteSpace(user.Name))
            {
                var name = user.Name.Trim().ToLowerInvariant();
                if (!string.IsNullOrWhiteSpace(admins))
                {
                    result = admins.Split(',').Any(s => string.Compare(name, s.Trim(), StringComparison.InvariantCultureIgnoreCase) == 0);
                }
            }

            return result;
        }
    }
}