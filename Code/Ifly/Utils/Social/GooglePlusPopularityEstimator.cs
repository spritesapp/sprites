using System.Net;
using System.Text.RegularExpressions;

namespace Ifly.Utils.Social
{
    /// <summary>
    /// Represents a Google Plus popularity estimator.
    /// </summary>
    public class GooglePlusPopularityEstimator : PopularityEstimator
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public GooglePlusPopularityEstimator() { }

        /// <summary>
        /// Estimates the local popularity of the given URL and returns the value representing it.
        /// </summary>
        /// <param name="url">URL to score.</param>
        /// <returns>URL score.</returns>
        public override long Score(string url)
        {
            long ret = 0;
            Match m = null;
            byte[] bytes = null;
            string output = string.Empty;
            HttpWebRequest request = null;
            string postData = string.Empty;
            string postDataFormat = "[{{\"method\": \"pos.plusones.get\",\"id\":\"p\",\"params\":{{\"nolog\":true,\"id\":\"{0}\",\"source\":\"widget\",\"userId\":\"@viewer\",\"groupId\":\"@self\"}},\"jsonrpc\":\"2.0\",\"key\":\"p\",\"apiVersion\":\"v1\"}}]";

            if (!string.IsNullOrEmpty(url))
            {
                request = CreateRequest("https://clients6.google.com/rpc?key=AIzaSyCKSbrvQasunBoV16zDH9R33D88CeLr9gQ");

                request.Method = "POST";
                request.ContentType = "application/json";

                postData = string.Format(postDataFormat, url.Replace("\"", "\\\""));
                bytes = System.Text.Encoding.ASCII.GetBytes(postData);

                request.ContentLength = bytes.Length;

                request.GetRequestStream().Write(bytes, 0, bytes.Length);

                try
                {
                    using (WebResponse response = request.GetResponse())
                    {
                        output = System.Text.Encoding.UTF8.GetString(ReadFromStream(response.GetResponseStream()));
                        m = Regex.Match(output, "\"count\":\\s*([0-9]+)", RegexOptions.IgnoreCase);

                        if (m != null && m.Success && m.Groups.Count > 1)
                            long.TryParse(m.Groups[1].Value, out ret);
                    }
                }
                catch (WebException) { }
            }

            return ret;
        }
    }
}