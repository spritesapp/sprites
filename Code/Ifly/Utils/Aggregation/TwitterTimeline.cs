using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Ifly.Utils.Aggregation
{
    /// <summary>
    /// Represents Twitter timeline.
    /// </summary>
    public static class TwitterTimeline
    {
        /// <summary>
        /// Returns a task which retrieves latest tweets for a given user.
        /// </summary>
        /// <param name="username">User name.</param>
        /// <param name="cacheFor">Cache duration.</param>
        /// <returns>A task which retrieves latest tweets for a given user.</returns>
        public static async Task<IEnumerable<string>> GetTweetsAsync(string username, TimeSpan? cacheFor = null)
        {
            string html = string.Empty;
            IEnumerable<string> ret = null;

            if (!WebSource.TryGetFromCache(username, cacheFor, out ret))
            {
                using (var client = new WebSource.SpecializedWebClient())
                    html = await client.DownloadStringTaskAsync(string.Format("https://mobile.twitter.com/{0}", username));

                WebSource.AddToCache(username, cacheFor, ret = ParseTweets(html));
            }

            if (ret == null)
                ret = Enumerable.Empty<string>();

            return ret;
        }

        /// <summary>
        /// Returns latest tweets for a given user.
        /// </summary>
        /// <param name="username">User name.</param>
        /// <param name="cacheFor">Cache duration.</param>
        /// <returns>Latest tweets for a given user.</returns>
        public static IEnumerable<string> GetTweets(string username, TimeSpan? cacheFor = null)
        {
            string html = string.Empty;
            IEnumerable<string> ret = null;

            if (!WebSource.TryGetFromCache(username, cacheFor, out ret))
            {
                try
                {
                    using (var client = new WebSource.SpecializedWebClient())
                        html = client.DownloadString(string.Format("https://mobile.twitter.com/{0}", username));

                    WebSource.AddToCache(username, cacheFor, ret = ParseTweets(html));
                }
                catch (System.Net.WebException) { WebSource.AddToCache(username, cacheFor, new List<string>()); }
            }

            if (ret == null)
                ret = Enumerable.Empty<string>();

            return ret;
        }

        /// <summary>
        /// Parses tweets from HTML.
        /// </summary>
        /// <param name="html">HTML string.</param>
        /// <returns>Tweets.</returns>
        private static List<string> ParseTweets(string html)
        {
            string text = string.Empty;
            var ret = new List<string>();
            int max = 20, start = 0, end = 0;
            Func<string, IEnumerable<string>, int, int> seq = null;

            seq = (h, t, s) =>
            {
                int result = -1;

                if (t.Any())
                {
                    result = h.IndexOf(t.First(), s, StringComparison.OrdinalIgnoreCase);

                    if (result > 0)
                        result = seq(h, t.Skip(1), result);
                }
                else
                    result = s;

                return result;
            };

            if (!string.IsNullOrWhiteSpace(html))
            {
                foreach (var m in Regex.Matches(html, "class=\"tweet-text\"", RegexOptions.IgnoreCase).OfType<Match>())
                {
                    if ((start = seq(html, new string[] { "<div ", ">" }, m.Index + m.Length)) > 0)
                    {
                        start++;
                        end = seq(html, new string[] { "</div>" }, start);

                        if (end > start)
                        {
                            text = html.Substring(start, end - start);

                            text = Regex.Replace(text, "href=\"/", "href=\"https://twitter.com/", RegexOptions.IgnoreCase);
                            text = Regex.Replace(text, "href='/", "href='https://twitter.com/", RegexOptions.IgnoreCase);
                            text = Regex.Replace(text, @"\u00E2\u20AC\u00A6", "...");

                            ret.Add(text);

                            if (ret.Count == max)
                                break;
                        }
                    }
                }
            }

            return ret;
        }
    }
}
