using Ifly.QueueService;
using Ifly.Web.Editor.Models;
using System;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Http.Routing;

namespace Ifly.Web.Editor.Api.Sessions
{
    /// <summary>
    /// Represents session controller.
    /// </summary>
    public class SessionsController : ApiController, IConfigurableServiceController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public int Priority
        {
            get { return 0; }
        }

        /// <summary>
        /// Creates new session.
        /// </summary>
        /// <param name="settings">Initialization settings.</param>
        /// <returns>Session Id.</returns>
        [HttpPut]
        public string CreateSession([FromBody]SessionInitializationModel settings)
        {
            string ret = string.Empty;
            
            if (settings != null)
            {
                if (!string.IsNullOrEmpty(settings.CurrentSessionId) && SessionManager.ContainsSession(settings.CurrentSessionId))
                    ret = SessionManager.MapSession(settings.CurrentSessionId, settings.ClientId);
                else
                    ret = SessionManager.NewSession(settings.ClientId);
            }

            return ret;
        }

        /// <summary>
        /// Ensures that the given session is valid.
        /// </summary>
        /// <param name="instanceId">Application instance Id.</param>
        /// <returns>Action result.</returns>
        [HttpGet]
        public HttpResponseMessage EnsureSession(string instanceId)
        {
            if (System.Web.HttpContext.Current.User == null || String.CompareOrdinal(Ifly.ApplicationContext.Current.InstanceId, instanceId) != 0)
                throw new HttpResponseException(Request.CreateErrorResponse(HttpStatusCode.Forbidden, "Current session or app instance is gone."));

            return new HttpResponseMessage(System.Net.HttpStatusCode.OK);
        }

        /// <summary>
        /// Sends feedback.
        /// </summary>
        /// <param name="feedback">Feedback.</param>
        [HttpPost]
        public void SendFeedback([FromBody]FeedbackModel feedback)
        {
            string name = string.Empty;
            string email = string.Empty;

            if (feedback != null && !string.IsNullOrWhiteSpace(feedback.Text))
            {
                name = !string.IsNullOrWhiteSpace(feedback.Name) ? feedback.Name : "Anonymous";
                email = !string.IsNullOrWhiteSpace(feedback.Email) ? feedback.Email : "-";

                MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                {
                    Id = Guid.NewGuid().ToString(),
                    Subject = string.Format("Howdy! {0} & Pavel (Sprites)", name),
                    Body = string.Format("{0}\n\n--\n\"{1}\" <{2}> #{3}", 
                            HttpUtility.HtmlDecode(feedback.Text),
                            name, 
                            email,
                            Ifly.ApplicationContext.Current != null &&
                            Ifly.ApplicationContext.Current.User != null ?
                            Ifly.ApplicationContext.Current.User.Id :
                            -1
                        )
                }});
            }
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "CreateSession",
                routeTemplate: "api/sessions/new",
                defaults: new { controller = "Sessions", action = "CreateSession" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Put) }
            );

            config.Routes.MapHttpRoute(
                name: "EnsureSession",
                routeTemplate: "api/sessions/ensure",
                defaults: new { controller = "Sessions", action = "EnsureSession" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Get) }
            );

            config.Routes.MapHttpRoute(
                name: "SendFeedback",
                routeTemplate: "api/sessions/feedback",
                defaults: new { controller = "Sessions", action = "SendFeedback" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Post) }
            );
        }
    }
}