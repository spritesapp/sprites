using Newtonsoft.Json;
using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Ifly.External.MailChimp
{
    /// <summary>
    /// Represents MailChimp list.
    /// </summary>
    public enum MailChimpList
    {
        /// <summary>
        /// Sprites.
        /// </summary>
        Sprites = 0
    }

    /// <summary>
    /// Represents MailChimp client.
    /// </summary>
    public class MailChimpClient
    {
        /// <summary>
        /// Represents MailChimp web client.
        /// </summary>
        private class MailChimpWebClient : WebClient
        {
            /// <summary>
            /// Returns a new web request.
            /// </summary>
            /// <param name="address">Address.</param>
            /// <returns>Web request.</returns>
            protected override WebRequest GetWebRequest(Uri address)
            {
                WebRequest ret = base.GetWebRequest(address);

                if (ret is HttpWebRequest)
                    (ret as HttpWebRequest).ContentType = "application/json";
                else
                    ret.Headers.Add("Content-Type", "application/json");

                return ret;
            }

            /// <summary>
            /// Returns a task which downloads the given data and evaluates it as JSON object.
            /// </summary>
            /// <param name="address">Address.</param>
            /// <returns>Result.</returns>
            public async Task<dynamic> DownloadDynamicTaskAsync(Uri address)
            {
                string result = await this.DownloadStringTaskAsync(address);

                return JsonConvert.DeserializeObject(result);
            }
        }

        private readonly string _apiKey;
        private readonly string _apiBaseUrl;
        private readonly string _apiKeyQuery;

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public MailChimpClient()
        {
            string[] key = "6e372054a20e381fd4e9af4c27227bac-us9".Split('-');

            _apiKey = key[0];
            _apiKeyQuery = string.Format("?apikey={0}", _apiKey);
            _apiBaseUrl = string.Format("https://{0}.api.mailchimp.com/2.0", key[1]);
        }

        /// <summary>
        /// Subscribes to the given list.
        /// </summary>
        /// <param name="list">List.</param>
        /// <param name="email">Subscribe email address.</param>
        public async Task<dynamic> SubscribeToList(MailChimpList list, string email)
        {
            if (string.IsNullOrEmpty(email))
                throw new MailChimpException("Email address is required.");

            // Getting the Id of the given list.
            string listId = await QueryListId(list);

            // Subscribing to the given list.
            byte[] data = await new MailChimpWebClient().UploadDataTaskAsync(
                new Uri(string.Concat(_apiBaseUrl, "/lists/subscribe")),
                Encoding.ASCII.GetBytes(JsonConvert.SerializeObject(new
                {
                    apikey = _apiKey,
                    id = listId,
                    email = new {
                        email = email
                    },
                    update_existing = true
                }))
            );

            if (data == null)
                throw new MailChimpException("Unknown error occured.");

            // Analyzing the result.
            dynamic response = JsonConvert.DeserializeObject(
                Encoding.ASCII.GetString(data)
            );

            if (string.IsNullOrEmpty((dynamic)response.email.ToString()))
                throw new MailChimpException("Unknown error occured.");

            return response;
        }

        /// <summary>
        /// Returns a task which resolves the Id of the given list.
        /// </summary>
        /// <param name="list">List.</param>
        /// <returns>List Id.</returns>
        public async Task<string> QueryListId(MailChimpList list)
        {
            string ret = string.Empty;

            if (list == MailChimpList.Sprites)
                ret = "2a3d6026f1";

            await Task.Delay(1);

            return ret;
        }
    }
}
