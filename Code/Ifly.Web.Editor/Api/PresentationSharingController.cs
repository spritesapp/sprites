using Ifly.QueueService;
using Ifly.Web.Editor.Models;
using System;
using System.Collections.Generic;
using System.Web;
using System.Web.Http;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents presentation sharing controller.
    /// </summary>
    public class PresentationSharingController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 10; }
        }

        /// <summary>
        /// Returns all presentation sharing status for the current user.
        /// </summary>
        /// <returns>Presentation sharing status model.</returns>
        [HttpGet]
        public PresentationSharingAllModel GetSharingAll()
        {
            User currentUser = Ifly.ApplicationContext.Current.User;
            IDictionary<int, PresentationSharingStatus> statuses = null;
            PresentationSharingAllModel ret = new PresentationSharingAllModel();
            
            if (currentUser != null && currentUser.Id > 0)
            {
                using (var repo = Resolver.Resolve<Storage.Repositories.IPresentationSharingRepository>())
                    statuses = repo.GetSharingStatusByUser(currentUser.Id);

                if (statuses != null)
                {
                    foreach (PresentationSharingStatus status in statuses.Values)
                        ret.Status.Add(status);
                }
            }

            return ret;
        }

        /// <summary>
        /// Updates sharing.
        /// </summary>
        /// <param name="status">Status.</param>
        [HttpPost]
        public void UpdateSharing([FromBody]PresentationSharingStatus status)
        {
            Presentation p = null;
            PresentationSharingUpdateResult result = null;
            Dictionary<int, string> presentationTitles = new Dictionary<int, string>();

            if (status != null && status.PresentationId > 0)
            {
                using (var repo = Resolver.Resolve<Storage.Repositories.IPresentationSharingRepository>())
                    result = repo.UpdateSharingStatus(status);

                if (result != null && result.Added != null)
                {
                    foreach (PresentationSharing sharing in result.Added)
                    {
                        if (!presentationTitles.ContainsKey(sharing.PresentationId))
                        {
                            p = base.Service.Read(sharing.PresentationId);

                            if (p != null)
                                presentationTitles.Add(sharing.PresentationId, p.Title);
                        }

                        MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                        {
                            Id = Guid.NewGuid().ToString(),
                            Subject = Ifly.Resources.Frontpage.Email_PresentationSharing_Subject,
                            Body = new GenericMessageBody
                            (
                                new Tuple<string, string>("Recipient", sharing.UserInviteEmail), 
                                new Tuple<string, string>("Body", string.Format(Ifly.Resources.Frontpage.Email_PresentationSharing_Body, presentationTitles.ContainsKey(sharing.PresentationId) && !string.IsNullOrEmpty(presentationTitles[sharing.PresentationId]) ? 
                                    presentationTitles[sharing.PresentationId] : Ifly.Resources.Frontpage.Email_PresentationSharing_NoTitle, string.Format("{0}://{1}/confirm-sharing?email={2}&token={3}", 
                                        HttpContext.Current.Request.Url.Scheme, HttpContext.Current.Request.Url.Authority, HttpContext.Current.Server.UrlEncode(sharing.UserInviteEmail), sharing.UserInviteKey)))
                            ).ToString()
                        }});
                    }
                }
            }
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "GetSharingAll",
                routeTemplate: "api/sharing/all",
                defaults: new { controller = "PresentationSharing", action = "GetSharingAll" }
            );

            config.Routes.MapHttpRoute(
                name: "UpdateSharing",
                routeTemplate: "api/sharing/update",
                defaults: new { controller = "PresentationSharing", action = "UpdateSharing" }
            );
        }
    }
}