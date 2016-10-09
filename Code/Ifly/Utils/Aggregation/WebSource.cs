using System;
using System.Collections.Concurrent;
using System.Net;

namespace Ifly.Utils.Aggregation
{
    /// <summary>
    /// Represents a web source.
    /// </summary>
    public static class WebSource
    {
        /// <summary>
        /// Represents specialized web client.
        /// </summary>
        public sealed class SpecializedWebClient : WebClient
        {
            /// <summary>
            /// Returns initialized web request.
            /// </summary>
            /// <param name="address">Address.</param>
            /// <returns>Web request.</returns>
            protected override WebRequest GetWebRequest(Uri address)
            {
                var ret = base.GetWebRequest(address) as HttpWebRequest;

                ret.UserAgent = "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; Trident/6.0)";
                ret.Timeout = 5000;

                return ret;
            }
        }

        /// <summary>
        /// Gets the standard cache duration.
        /// </summary>
        public static readonly TimeSpan StandardCacheDuration = TimeSpan.FromHours(1);

        /// <summary>
        /// Gets or sets the collection of cached tweets.
        /// </summary>
        private static readonly ConcurrentDictionary<string, Tuple<DateTime, object>> _cache;

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static WebSource()
        {
            _cache = new ConcurrentDictionary<string, Tuple<DateTime, object>>();
        }

        /// <summary>
        /// Tries to retrieve item from cache.
        /// </summary>
        /// <typeparam name="T">Item value type.</typeparam>
        /// <param name="key">Key.</param>
        /// <param name="cacheFor">Cache duration.</param>
        /// <param name="result">Result.</param>
        /// <returns>Value indicating whether item was retrieved from cache.</returns>
        public static bool TryGetFromCache<T>(string key, TimeSpan? cacheFor, out T result)
        {
            bool ret = cacheFor.HasValue;
            Tuple<DateTime, object> value = null;

            result = default(T);

            if (ret)
            {
                ret = _cache.TryGetValue((key ?? string.Empty).ToLowerInvariant(), out value);

                if (ret)
                {
                    if (ret = DateTime.UtcNow.Subtract(cacheFor.Value) < value.Item1)
                        result = (T)value.Item2;
                }
            }

            return ret;
        }

        /// <summary>
        /// Adds the given item to the cache.
        /// </summary>
        /// <typeparam name="T">Item value type.</typeparam>
        /// <param name="key">Key.</param>
        /// <param name="cacheFor">Cache duration.</param>
        /// <param name="result">Result.</param>
        /// <returns>Value indicating whether item was inserted into the cache.</returns>
        public static bool AddToCache<T>(string key, TimeSpan? cacheFor, T result)
        {
            bool ret = cacheFor.HasValue;
            var value = new Tuple<DateTime, object>(DateTime.UtcNow, result);

            if (ret)
                _cache.AddOrUpdate((key ?? string.Empty).ToLowerInvariant(), value, (k, e) => value);

            return ret;
        }
    }
}
