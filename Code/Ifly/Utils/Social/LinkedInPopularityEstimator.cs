using System.Text.RegularExpressions;

namespace Ifly.Utils.Social
{
    /// <summary>
    /// Represents a LinkedIn popularity estimator.
    /// </summary>
    public class LinkedInPopularityEstimator : PopularityEstimator
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public LinkedInPopularityEstimator() { }

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
            string format = "http://www.linkedin.com/countserv/count/share?url={0}";

            if (!string.IsNullOrEmpty(url))
            {
                content = DownloadString(string.Format(format, System.Web.HttpUtility.UrlEncode(url)));
                m = Regex.Match(content, "\"count\":\\s*([0-9]+)", RegexOptions.IgnoreCase);

                if (m != null && m.Success && m.Groups.Count > 1)
                    long.TryParse(m.Groups[1].Value, out ret);
            }

            return ret;
        }
    }
}