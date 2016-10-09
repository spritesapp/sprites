using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace Ifly.Utils.Aggregation
{
    /// <summary>
    /// Represents RSS feed.
    /// </summary>
    public static class RssFeed
    {
        /// <summary>
        /// Returns a task which retrieves latest RSS items for a given URL.
        /// </summary>
        /// <param name="URL">RSS feed URL.</param>
        /// <param name="cacheFor">Cache duration.</param>
        /// <returns>A task which retrieves latest items for a given URL.</returns>
        public static async Task<IEnumerable<RssFeedItem>> GetItemsAsync(string url, TimeSpan? cacheFor = null)
        {
            string xml = string.Empty;
            IEnumerable<RssFeedItem> ret = null;

            if (!WebSource.TryGetFromCache(url, cacheFor, out ret))
            {
                using (var client = new WebSource.SpecializedWebClient())
                    xml = await client.DownloadStringTaskAsync(url);

                WebSource.AddToCache(url, cacheFor, ret = ParseItems(xml));
            }

            if (ret == null)
                ret = Enumerable.Empty<RssFeedItem>();

            return ret;
        }

        /// <summary>
        /// Returns latest RSS items for a given URL.
        /// </summary>
        /// <param name="URL">RSS feed URL.</param>
        /// <param name="cacheFor">Cache duration.</param>
        /// <returns>Latest items for a given URL.</returns>
        public static IEnumerable<RssFeedItem> GetItems(string url, TimeSpan? cacheFor = null)
        {
            string xml = string.Empty;
            IEnumerable<RssFeedItem> ret = null;

            if (!WebSource.TryGetFromCache(url, cacheFor, out ret))
            {
                try
                {
                    using (var client = new WebSource.SpecializedWebClient())
                        xml = client.DownloadString(url);

                    WebSource.AddToCache(url, cacheFor, ret = ParseItems(xml));
                }
                catch (System.Net.WebException) { WebSource.AddToCache(url, cacheFor, new List<RssFeedItem>()); }
            }

            if (ret == null)
                ret = Enumerable.Empty<RssFeedItem>();

            return ret;
        }

        /// <summary>
        /// Parses RSS items from XML.
        /// </summary>
        /// <param name="xml">XML string.</param>
        /// <returns>RSS items.</returns>
        private static List<RssFeedItem> ParseItems(string xml)
        {
            int max = 20;
            XDocument doc = null;
            var ret = new List<RssFeedItem>();
            
            if (!string.IsNullOrWhiteSpace(xml))
            {
                doc = XDocument.Parse(xml);

                foreach (var node in doc.Descendants("item"))
                {
                    ret.Add(new RssFeedItem()
                    {
                        Title = node.Descendants("title").First().Value,
                        Url = node.Descendants("link").First().Value
                    });

                    if (ret.Count == max)
                        break;
                }
            }

            return ret;
        }
    }
}
