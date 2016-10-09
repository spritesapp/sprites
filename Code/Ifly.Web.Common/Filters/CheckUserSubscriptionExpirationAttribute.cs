using System.Web.Mvc;

namespace Ifly.Web.Common.Filters
{
    /// <summary>
    /// Checks whether the account of the current user has expired.
    /// </summary>
    public class CheckUserSubscriptionExpirationAttribute : ActionFilterAttribute
    {
        /// <summary>
        /// Called by ASP.NET framework before action method executes.
        /// </summary>
        /// <param name="filterContext">Action executing context.</param>
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            if (Ifly.ApplicationContext.Current.User != null && !Ifly.Utils.DemoPrincipal.IsDemo(Ifly.ApplicationContext.Current.User) &&
                (Ifly.ApplicationContext.Current.User.Subscription == null || Ifly.ApplicationContext.Current.User.Subscription.HasExpired) &&
                Ifly.Resolver.Resolve<Ifly.Payments.IPaymentProcessor>().IsEnabled())
            {
                filterContext.Result = new RedirectResult("/account?expired=1");
            }

            base.OnActionExecuting(filterContext);
        }
    }
}