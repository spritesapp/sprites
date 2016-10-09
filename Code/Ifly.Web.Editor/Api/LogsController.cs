using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Routing;
using Ifly.Logging;
using Ifly.Web.Editor.Models;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents logs controller.
    /// </summary>
    public class LogsController : ApiController, IConfigurableServiceController
    {
        /// <summary>
        /// Adds log messages.
        /// </summary>
        /// <param name="messages">Messages.</param>
        [HttpPost]
        public void Error([FromBody]string[] messages)
        {
            if (messages != null && messages.Length > 0)
            {
                foreach (string message in messages)
                {
                    Ifly.Logging.Logger.Current.Write(new Message(message, MessageLevel.Error));
                }
            }
        }

        /// <summary>
        /// Gets service priority.
        /// </summary>
        public int Priority
        {
            get { return 0; }
        }

        /// <summary>
        /// Configures the service.
        /// </summary>
        /// <param name="config">HTTP configuration.</param>
        public void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "PostExceptions",
                routeTemplate: "api/logs/error",
                defaults: new { controller = "Logs", action = "Error" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Post) }
            );
        }
    }
}
