using System;
using System.Net;

namespace Ifly.Utils
{
    /// <summary>
    /// Represents a web resource.
    /// </summary>
    public static class WebResource
    {
        /// <summary>
        /// Queries status of a given request.
        /// </summary>
        /// <param name="url">URL.</param>
        /// <param name="body">Response body.</param>
        /// <param name="encoding">Encoding.</param>
        /// <returns>Status.</returns>
        public static HttpStatusCode QueryStatus(string url, out string body, System.Text.Encoding encoding = null)
        {
            HttpStatusCode ret = HttpStatusCode.NotFound;
            var request = WebRequest.Create(url) as HttpWebRequest;

            body = null;

            if (encoding == null)

            try
            {
                using (var response = request.GetResponse() as HttpWebResponse)
                {
                    ret = response.StatusCode;

                    if (encoding == null)
                    {
                        try
                        {
                            encoding = System.Text.Encoding.GetEncoding(response.ContentEncoding ?? string.Empty);
                        }
                        catch (ArgumentException)
                        {
                            encoding = System.Text.Encoding.UTF8;
                        }
                    }

                    body = encoding.GetString(Utils.Input.ReadFromStream(response.GetResponseStream()));
                }
            }
            catch (Exception) { }

            return ret;
        }

        /// <summary>
        /// Issues a GET request not caring about the response.
        /// </summary>
        /// <param name="url">URL.</param>
        public static void FireAndForget(string url)
        {
            var request = WebRequest.Create(url) as HttpWebRequest;

            try
            {
                using (var response = request.GetResponse() as HttpWebResponse) { }
            }
            catch (Exception) { }
        }
    }
}
