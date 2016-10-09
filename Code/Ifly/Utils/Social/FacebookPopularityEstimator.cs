using System.Text.RegularExpressions;

namespace Ifly.Utils.Social
{
    /// <summary>
    /// Represents a Facebook popularity estimator.
    /// </summary>
    public class FacebookPopularityEstimator : PopularityEstimator
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public FacebookPopularityEstimator() { }

        /// <summary>
        /// Estimates the local popularity of the given URL and returns the value representing it.
        /// </summary>
        /// <param name="url">URL to score.</param>
        /// <returns>URL score.</returns>
        public override long Score(string url)
        {
            long ret = 0;
            Match m = null;
            string content = string.Empty;
            string format = "https://api.facebook.com/method/fql.query?query=select%20total_count%20from%20link_stat%20where%20url='{0}'&format=json";
            
            if (!string.IsNullOrEmpty(url))
            {
                content = DownloadString(string.Format(format, System.Web.HttpUtility.UrlEncode(url)));
                m = Regex.Match(content, @":\s*([0-9]+)", RegexOptions.IgnoreCase);

                if (m != null && m.Success && m.Groups.Count > 1)
                    long.TryParse(m.Groups[1].Value, out ret);
            }

            return ret;
        }
    }
}