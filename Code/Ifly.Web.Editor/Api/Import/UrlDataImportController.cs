using System.Net;
using System.Threading.Tasks;
using System.Web.Http;

namespace Ifly.Web.Editor.Api.Import
{
    /// <summary>
    /// Represents URL data import controller.
    /// </summary>
    public class UrlDataImportController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 6; }
        }

        /// <summary>
        /// Imports data from the given URL.
        /// </summary>
        /// <param name="url">URL.</param>
        /// <returns>Import result.</returns>
        [HttpPost]
        public async Task<string> DownloadData(string url)
        {
            string ret = string.Empty;

            if (!string.IsNullOrEmpty(url))
            {
                using (var client = new WebClient())
                {
                    client.Headers[HttpRequestHeader.ContentType] = "application/json";
                    client.Headers[HttpRequestHeader.UserAgent] = "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.114 Safari/537.36";

                    try
                    {
                        ret = await client.DownloadStringTaskAsync(url);
                    }
                    catch (WebException) { }
                }
            }

            return (ret ?? string.Empty).Trim();
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "DownloadArbitraryJson",
                routeTemplate: "api/import/url/download",
                defaults: new { controller = "UrlDataImport", action = "DownloadData" }
            );
        }
    }
}