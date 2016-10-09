using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Net;

namespace Ifly.Utils.Social
{
    /// <summary>
    /// Represents a popularity estimator.
    /// </summary>
    public abstract class PopularityEstimator
    {
        #region Properties

        /// <summary>
        /// Gets all estimators.
        /// </summary>
        private static ConcurrentBag<PopularityEstimator> AllEstimators = null;

        #endregion

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static PopularityEstimator()
        {
            AllEstimators = new ConcurrentBag<PopularityEstimator>();

            AllEstimators.Add(new FacebookPopularityEstimator());
            //AllEstimators.Add(new TwitterPopularityEstimator());
            AllEstimators.Add(new GooglePlusPopularityEstimator());
            AllEstimators.Add(new LinkedInPopularityEstimator());
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        protected PopularityEstimator() { }

        /// <summary>
        /// Estimates the local popularity of the given URL and returns the value representing it.
        /// </summary>
        /// <param name="url">URL to score.</param>
        /// <returns>URL score.</returns>
        public abstract long Score(string url);

        /// <summary>
        /// Downloads the contents of the given URL.
        /// </summary>
        /// <param name="url">URL.</param>
        /// <returns>Contents.</returns>
        protected string DownloadString(string url)
        {
            string ret = string.Empty;

            if (!string.IsNullOrEmpty(url))
            {
                try
                {
                    using (WebClient client = new WebClient())
                        ret = client.DownloadString(new Uri(url.IndexOf("://") < 0 ? string.Format("http://{0}", url) : url, UriKind.Absolute));
                }
                catch (WebException) { }
            }

            return ret;
        }

        /// <summary>
        /// Creates the new web request object for a given URL.
        /// </summary>
        /// <param name="url">URL to request.</param>
        /// <returns>Web request object.</returns>
        public static HttpWebRequest CreateRequest(string url)
        {
            HttpWebRequest ret = null;

            if (!string.IsNullOrEmpty(url))
            {
                try
                {
                    ret = WebRequest.Create(new Uri(url.IndexOf("://") < 0 ? string.Format("http://{0}", url) : url, UriKind.Absolute)) as HttpWebRequest;
                }
                catch (UriFormatException) { }
                catch (NotSupportedException) { }
                catch (System.Security.SecurityException) { }

                if (ret != null)
                {
                    ret.UserAgent = "Visualize/1.0";
                    ret.Timeout = 5000;
                }
            }

            return ret;
        }

        /// <summary>
        /// Reads all bytes from the given stream.
        /// </summary>
        /// <param name="input">Input stream.</param>
        /// <returns>All bytes read from the given stream.</returns>
        public static byte[] ReadFromStream(Stream input)
        {
            int read = 0;
            byte[] ret = new byte[] { };
            byte[] buffer = new byte[16 * 1024];

            using (MemoryStream ms = new MemoryStream())
            {
                while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
                    ms.Write(buffer, 0, read);

                ret = ms.ToArray();
            }

            return ret;
        }

        #region Static methods

        /// <summary>
        /// Returns all available estimators.
        /// </summary>
        /// <returns>All available estimators.</returns>
        public static IEnumerable<PopularityEstimator> GetAllEstimators()
        {
            return AllEstimators;
        }

        #endregion
    }
}