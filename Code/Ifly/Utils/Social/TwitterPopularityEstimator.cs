using System.Text.RegularExpressions;

namespace Ifly.Utils.Social
{
    /// <summary>
    /// Represents a Twitter popularity estimator.
    /// </summary>
    public class TwitterPopularityEstimator : PopularityEstimator
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public TwitterPopularityEstimator() { }

        /// <summary>
        /// Estimates the local popularity of the given URL and returns the value representing it.
        /// </summary>
        /// <param name="url">URL to score.</param>
        /// <returns>URL score.</returns>
        public override long Score(string url)
        {
            long ret = 0;
            string content = string.Empty;
            string format = "http://search.twitter.com/search.json?q={0}&rpp=100&include_entities=false";

            if (!string.IsNullOrEmpty(url))
            {
                content = DownloadString(string.Format(format, System.Web.HttpUtility.UrlEncode(url)));

                // Up to 100 resuts, don't query pages (will be way too slow)
                ret = Regex.Matches(content, "\"text\":", RegexOptions.IgnoreCase).Count;
            }

            return ret;
        }
    }
}