using Ifly.QueueService;
using System;
using System.Linq;
using System.Diagnostics;
using System.Reflection;
using System.Web.Mvc;

namespace Ifly.Web.Common.Filters
{
    /// <summary>
    /// Represents a filter that logs all exceptions in MVC context.
    /// </summary>
    public class LogErrorAttribute : IExceptionFilter
    {
        /// <summary>
        /// Occurs when exception is thrown.
        /// </summary>
        /// <param name="context">Action context.</param>
        public void OnException(ExceptionContext context)
        {
            LogErrorAttribute.Log(context.Exception);
        }

        /// <summary>
        /// Logs the given exception.
        /// </summary>
        /// <param name="exception">Exception.</param>
        public static void Log(Exception exception)
        {
            Logging.Logger.OnError(exception).Handle((signature, text) =>
            {
                MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                {
                    Id = System.Guid.NewGuid().ToString(),
                    Subject = string.Format("Server error ({0})", signature),
                    Body = text
                }});
            });
        }
    }
}