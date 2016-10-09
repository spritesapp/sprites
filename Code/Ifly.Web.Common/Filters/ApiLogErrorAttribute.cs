using System.Web.Http.Filters;

namespace Ifly.Web.Common.Filters
{
    /// <summary>
    /// Represents a filter that logs all exceptions in Web API context.
    /// </summary>
    public class ApiLogErrorAttribute : ExceptionFilterAttribute
    {
        /// <summary>
        /// Occurs when exception is thrown.
        /// </summary>
        /// <param name="context">Action context.</param>
        public override void OnException(HttpActionExecutedContext context)
        {
            LogErrorAttribute.Log(context.Exception);
        }
    }
}