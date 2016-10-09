using Ifly.Media;
using System.Collections.Generic;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Routing;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents media controller.
    /// </summary>
    public class MediaController : ApiController, IConfigurableServiceController
    {
        /// <summary>
        /// Gets service priority.
        /// </summary>
        public int Priority
        {
            get { return 10; }
        }

        /// <summary>
        /// Returns all media that belong to the given user.
        /// </summary>
        [HttpGet]
        public IEnumerable<MediaItem> GetAllUserMedia()
        {
            return new MediaItemManager().GetItems();
        }

        /// <summary>
        /// Configures the service.
        /// </summary>
        /// <param name="config">HTTP configuration.</param>
        public void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "GetAllUserMedia",
                routeTemplate: "api/media/all",
                defaults: new { controller = "Media", action = "GetAllUserMedia" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Get) }
            );
        }
    }
}
