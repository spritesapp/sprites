using Ifly.Storage.Services;
using System.Net;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Web.Http;
using System.Web.Http.Routing;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents a help topic controller.
    /// </summary>
    public class HelpTopicController :
        DataApiController<HelpTopic, IHelpTopicService>,
        IConfigurableServiceController
    {
        /// <summary>
        /// Gets service priority.
        /// </summary>
        public int Priority
        {
            get { return 11; }
        }

        /// <summary>
        /// Returns details on a given help topic.
        /// </summary>
        /// <param name="id">Topic Id or reference key.</param>
        /// <returns>Help topic details.</returns>
        [HttpGet]
        public HelpTopic Details(string id)
        {
            HelpTopic ret = Regex.IsMatch(id, "[0-9]+") ?
                base.Service.Read(int.Parse(id)) :
                base.Service.ReadByReferenceKey(id);

            if (ret == null)
                throw new HttpResponseException(HttpStatusCode.NotFound);

            return ret;
        }

        /// <summary>
        /// Searches among all help topics by the given search term.
        /// </summary>
        /// <param name="term">Search term.</param>
        /// <param name="offset">Zero-based offset of the matching record.</param>
        /// <returns>Matching help topics.</returns>
        [HttpGet]
        public HelpTopicSearchResultSet Search(string term, int? offset = null)
        {
            return base.Service.Search(term, offset ?? 0);
        }

        /// <summary>
        /// Changes the score of a given topic in favor of it being helpful.
        /// </summary>
        /// <param name="id">Help topic Id.</param>
        /// <returns>Updated score.</returns>
        [HttpPost]
        public HelpTopicScore VoteHelpful(int id)
        {
            return base.Service.VoteHelpful(id);
        }

        /// <summary>
        /// Changes the score of a given topic in favor of it being unhelpful.
        /// </summary>
        /// <param name="id">Help topic Id.</param>
        /// <returns>Updated score.</returns>
        [HttpPost]
        public HelpTopicScore VoteUnhelpful(int id)
        {
            return base.Service.VoteUnhelpful(id);
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "HelpTopicSearch",
                routeTemplate: "api/help/search",
                defaults: new { controller = "HelpTopic", action = "Search" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Get) }
            );

            config.Routes.MapHttpRoute(
                name: "HelpTopicDetails",
                routeTemplate: "api/help/{id}",
                defaults: new { controller = "HelpTopic", action = "Details" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Get) }
            );

            config.Routes.MapHttpRoute(
                name: "HelpTopicVoteHelpful",
                routeTemplate: "api/help/{id}/vote/helpful",
                defaults: new { controller = "HelpTopic", action = "VoteHelpful" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Post) }
            );

            config.Routes.MapHttpRoute(
                name: "HelpTopicVoteUnhelpful",
                routeTemplate: "api/help/{id}/vote/unhelpful",
                defaults: new { controller = "HelpTopic", action = "VoteUnhelpful" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Post) }
            );
        }
    }
}
