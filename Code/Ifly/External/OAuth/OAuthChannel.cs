using System;
using System.Collections.Specialized;
using System.Text;

namespace Ifly.External.OAuth
{
    /// <summary>
    /// Represents OAuth channel.
    /// </summary>
    public class OAuthChannel
    {
        /// <summary>
        /// Represents raw OAuth token response.
        /// </summary>
        private sealed class OAuthTokenResponse
        {
            /// <summary>
            /// Gets or sets access token.
            /// </summary>
            public string access_token { get; set; }

            /// <summary>
            /// Gets or sets refresh token.
            /// </summary>
            public string refresh_token { get; set; }

            /// <summary>
            /// Gets or sets the number of seconds after which the token expires.
            /// </summary>
            public int expires_in { get; set; }

            /// <summary>
            /// Gets or sets the token type.
            /// </summary>
            public string token_type { get; set; }
        }

        /// <summary>
        /// Gets or sets the client Id.
        /// </summary>
        public string ClientId { get; set; }

        /// <summary>
        /// Gets or sets the client secret.
        /// </summary>
        public string ClientSecret { get; set; }

        /// <summary>
        /// Returns return URL.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <param name="applicationName">Application name.</param>
        /// <returns>Redirect URL.</returns>
        public string GetReturnUrl(System.Uri requestUri, string applicationName)
        {
            return string.Format("{0}://{1}/oauth/{2}/token", requestUri.Scheme, requestUri.Host, applicationName.ToLowerInvariant());
        }

        /// <summary>
        /// Returns the authorization URL.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <param name="scope">Scope.</param>
        /// <param name="applicationName">Application name.</param>
        /// <param name="userId">User Id.</param>
        /// <returns>Authorization URL.</returns>
        public string GetAuthorizationUrl(System.Uri requestUri, string scope, string applicationName, int userId)
        {
            OAuthState state = new OAuthState(applicationName, userId);

            return string.Format("https://accounts.google.com/o/oauth2/auth?response_type=code&client_id={0}&redirect_uri={1}&scope={2}&access_type=offline&state={3}",
                System.Web.HttpUtility.UrlEncode(ClientId), System.Web.HttpUtility.UrlEncode(GetReturnUrl(requestUri, applicationName)), System.Web.HttpUtility.UrlEncode(scope), System.Web.HttpUtility.UrlEncode(state.ToString()));
        }

        /// <summary>
        /// Parses access code response.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <returns>Access code response.</returns>
        public OAuthCodeResponse ParseAccessCodeResponse(System.Uri requestUri)
        {
            OAuthCodeResponse ret = new OAuthCodeResponse();
            NameValueCollection query = System.Web.HttpUtility.ParseQueryString(requestUri.Query ?? string.Empty);

            ret.Error = System.Web.HttpUtility.UrlDecode(query["error"]);
            ret.AccessCode = System.Web.HttpUtility.UrlDecode(query["code"]);
            ret.State = OAuthState.Parse(System.Web.HttpUtility.UrlDecode(query["state"]));

            return ret;
        }

        /// <summary>
        /// Obtains access token.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <param name="applicationName">Application name.</param>
        /// <param name="code">Access code.</param>
        /// <returns>Access token.</returns>
        public OAuthToken GetAccessToken(System.Uri requestUri, string applicationName, string code)
        {
            byte[] response = null;
            OAuthToken ret = new OAuthToken();
            OAuthTokenResponse tokenResponse = null;
            NameValueCollection payload = new NameValueCollection();

            payload.Add("code", code);
            payload.Add("client_id", ClientId);
            payload.Add("client_secret", ClientSecret);
            payload.Add("redirect_uri", GetReturnUrl(requestUri, applicationName));
            payload.Add("grant_type", "authorization_code");

            using (var client = new System.Net.WebClient())
                response = client.UploadValues("https://accounts.google.com/o/oauth2/token", payload);

            if (response != null)
            {
                tokenResponse = Newtonsoft.Json.JsonConvert
                    .DeserializeObject<OAuthTokenResponse>(Encoding.UTF8.GetString(response));

                if (tokenResponse != null)
                {
                    ret.AccessToken = tokenResponse.access_token;
                    ret.RefreshToken = tokenResponse.refresh_token;
                    ret.AccessTokenExpiresIn = tokenResponse.expires_in;
                    ret.AccessTokenRefreshed = DateTime.UtcNow;
                }
            }

            return ret;
        }

        /// <summary>
        /// Returns value indicating whether the given access token is about to expire.
        /// </summary>
        /// <param name="token">Access token.</param>
        /// <returns>Value indicating whether the given access token is about to expire.</returns>
        public bool IsTokenExpiring(OAuthToken token)
        {
            return token == null || string.IsNullOrEmpty(token.AccessToken) || 
                token.AccessTokenRefreshed.AddSeconds(Math.Round(Math.Floor((double)(token.AccessTokenExpiresIn / 4 * 3)))) < DateTime.UtcNow;
        }

        /// <summary>
        /// Tries to refresh the given access token.
        /// </summary>
        /// <param name="token">Access token.</param>
        /// <param name="force">Value indicating whether to force refresh.</param>
        /// <returns>Value indicating whether access token was refreshed.</returns>
        public bool TryRefreshAccessToken(OAuthToken token, bool force = false)
        {
            bool ret = false;
            byte[] response = null;
            OAuthTokenResponse tokenResponse = null;
            NameValueCollection payload = new NameValueCollection();

            if (token != null && (IsTokenExpiring(token) || force) && !string.IsNullOrEmpty(token.RefreshToken))
            {
                payload.Add("client_id", ClientId);
                payload.Add("client_secret", ClientSecret);
                payload.Add("refresh_token", token.RefreshToken);
                payload.Add("grant_type", "refresh_token");

                try
                {
                    using (var client = new System.Net.WebClient())
                        response = client.UploadValues("https://accounts.google.com/o/oauth2/token", payload);
                }
                catch (System.Net.WebException) { }

                if (response != null)
                {
                    tokenResponse = Newtonsoft.Json.JsonConvert
                        .DeserializeObject<OAuthTokenResponse>(Encoding.UTF8.GetString(response));

                    if (tokenResponse != null)
                    {
                        ret = true;

                        token.AccessToken = tokenResponse.access_token;
                        token.AccessTokenExpiresIn = tokenResponse.expires_in;
                        token.AccessTokenRefreshed = DateTime.UtcNow;
                    }
                }
            }

            return ret;
        }
    }
}
