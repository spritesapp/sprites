using Ifly.Storage.Repositories;
using System;
using System.Linq;
using System.Reflection;

namespace Ifly.External.OAuth
{
    /// <summary>
    /// Represents OAuth client.
    /// </summary>
    public abstract class OAuthClient
    {
        /// <summary>
        /// Represents OAuth web client.
        /// </summary>
        public sealed class OAuthWebClient : System.Net.WebClient
        {
            /// <summary>
            /// Gets the access token.
            /// </summary>
            public string AccessToken { get; private set; }

            /// <summary>
            /// Initializes a new instance of an object.
            /// </summary>
            /// <param name="accessToken">Access token.</param>
            public OAuthWebClient(string accessToken)
            {
                this.AccessToken = accessToken;
            }

            /// <summary>
            /// Returns a web request object for a given URL.
            /// </summary>
            /// <param name="address">URL.</param>
            /// <returns>Web request object.</returns>
            protected override System.Net.WebRequest GetWebRequest(Uri address)
            {
                System.Net.WebRequest ret = base.GetWebRequest(address);

                ret.Headers.Add("Authorization", string.Format("Bearer {0}", AccessToken));

                return ret;
            }

            /// <summary>
            /// Checks whether the given client is allowed to call the given URL.
            /// </summary>
            /// <param name="url">URL.</param>
            /// <param name="accessToken">Access token.</param>
            /// <returns>Value indicating whether the given client is allowed to call the given URL.</returns>
            public static bool CheckAuthorized(string url, string accessToken)
            {
                bool ret = true;

                try
                {
                    using (var client = new OAuthWebClient(accessToken))
                        client.DownloadString(url);
                }
                catch (System.Net.WebException ex)
                {
                    if (ex.Response != null && (ex.Response as System.Net.HttpWebResponse).StatusCode == 
                        System.Net.HttpStatusCode.Unauthorized)

                        ret = false;
                }

                return ret;
            }
        }

        private string _name = string.Empty;

        /// <summary>
        /// Gets client name.
        /// </summary>
        public string Name
        {
            get
            {
                if (string.IsNullOrEmpty(_name))
                    _name = OAuthClient.GetName(this.GetType());

                return _name;
            }
        }

        /// <summary>
        /// Gets client scope.
        /// </summary>
        public string Scope { get; private set; }

        /// <summary>
        /// Gets client channel.
        /// </summary>
        protected OAuthChannel Channel { get; private set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="clientId">Client Id.</param>
        /// <param name="clientSecret">Client secret.</param>
        /// <param name="scope">Scope.</param>
        protected OAuthClient(string clientId, string clientSecret, string scope)
        {
            this.Scope = scope;

            this.Channel = new OAuthChannel()
            {
                ClientId = clientId,
                ClientSecret = clientSecret
            };
        }

        /// <summary>
        /// Returns the authorization URL.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <returns>Authorization URL.</returns>
        public string GetAuthorizationUrl(System.Uri requestUri)
        {
            return this.Channel.GetAuthorizationUrl(requestUri, this.Scope, this.Name, Ifly.ApplicationContext.Current != null &&
                Ifly.ApplicationContext.Current.User != null ? Ifly.ApplicationContext.Current.User.Id : 0);
        }

        /// <summary>
        /// Ensures that the user is authorized.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="forceRefresh">Value indicating whether to force refreshing the token.</param>
        /// <returns>Authorization result.</returns>
        public OAuthAuthorizationResult EnsureAuthorization(int userId, bool forceRefresh = false)
        {
            User u = null;
            OAuthToken token = null;
            PropertyInfo prop = null;
            OAuthAuthorizationResult ret = new OAuthAuthorizationResult()
            {
                AccessToken = string.Empty,
                Authorized = false
            };

            if (userId > 0)
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    u = repo.Select(userId);

                    if (u != null && u.ApiAuthorization != null)
                    {
                        prop = GetClientAuthorizationProperty();

                        if (prop != null)
                        {
                            token = prop.GetValue(u.ApiAuthorization) as OAuthToken;

                            if (token != null)
                            {
                                ret.Authorized = !string.IsNullOrEmpty(token.RefreshToken);
                                ret.AccessToken = token.AccessToken;

                                if (this.Channel.TryRefreshAccessToken(token, forceRefresh))
                                {
                                    ret.AccessToken = token.AccessToken;
                                    prop.SetValue(u.ApiAuthorization, token);

                                    repo.Update(u);
                                }
                            }
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Checks whether the client is authorized.
        /// </summary>
        /// <param name="provider">Provider.</param>
        /// <param name="userId">User Id.</param>
        /// <returns>Authorization result.</returns>
        public OAuthAuthorizationResult CheckAuthorizationStatus(int userId)
        {
            User u = null;
            OAuthToken token = null;
            PropertyInfo prop = null;
            OAuthAuthorizationResult ret = new OAuthAuthorizationResult()
            {
                AccessToken = string.Empty,
                Authorized = false
            };

            if (userId > 0)
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    u = repo.Select(userId);

                    if (u != null && u.ApiAuthorization != null)
                    {
                        prop = GetClientAuthorizationProperty();

                        if (prop != null)
                        {
                            token = prop.GetValue(u.ApiAuthorization) as OAuthToken;

                            if (token != null && !string.IsNullOrEmpty(token.AccessToken) && !this.Channel.IsTokenExpiring(token))
                            {
                                ret.Authorized = true;
                                ret.AccessToken = token.AccessToken;

                                ret = OnAuthorized(userId, ret);

                                if (ret == null || !ret.Authorized)
                                {
                                    prop.SetValue(u.ApiAuthorization, null);
                                    repo.Update(u);
                                }
                            }
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Occurs when user gets authorized.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="result">Result.</param>
        /// <returns>Result.</returns>
        protected virtual OAuthAuthorizationResult OnAuthorized(int userId, OAuthAuthorizationResult result)
        {
            return result;
        }

        /// <summary>
        /// Handles authorization request.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        public void HandleRequest(System.Uri requestUri)
        {
            User u = null;
            OAuthToken token = null;
            PropertyInfo prop = null;
            OAuthToken prevToken = null;
            OAuthCodeResponse code = this.Channel.ParseAccessCodeResponse(requestUri);

            if (!string.IsNullOrEmpty(code.AccessCode) && code.State != null && code.State.UserId > 0)
            {
                token = this.Channel.GetAccessToken(requestUri, this.Name, code.AccessCode);

                if (!string.IsNullOrEmpty(token.AccessToken))
                {
                    using (var repo = Resolver.Resolve<IUserRepository>())
                    {
                        u = repo.Select(code.State.UserId);
                        prop = GetClientAuthorizationProperty();

                        if (prop != null)
                        {
                            if (u.ApiAuthorization == null)
                                u.ApiAuthorization = new UserApiAuthorization();

                            if (string.IsNullOrEmpty(token.RefreshToken))
                            {
                                prevToken = prop.GetValue(u.ApiAuthorization) as OAuthToken;

                                if (prevToken != null && !string.IsNullOrEmpty(prevToken.RefreshToken))
                                    token.RefreshToken = prevToken.RefreshToken;
                            }

                            prop.SetValue(u.ApiAuthorization, token);

                            repo.Update(u);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Returns the object property which corresponds to the given client.
        /// </summary>
        /// <returns>Object property.</returns>
        private PropertyInfo GetClientAuthorizationProperty()
        {
            return typeof(UserApiAuthorization).GetProperties().Where(p => string.Compare(p.Name, Name, true) == 0).FirstOrDefault();
        }

        /// <summary>
        /// Returns the client with the given name.
        /// </summary>
        /// <param name="name">Client name.</param>
        /// <returns>Client.</returns>
        public static OAuthClient GetClient(string name)
        {
            Type t = Type.GetType(string.Format("{0}.{1}OAuthClient", typeof(OAuthClient).Namespace, name), false, true);
            return t != null ? Activator.CreateInstance(t) as OAuthClient : null;
        }
        
        /// <summary>
        /// Returns the name of the given client.
        /// </summary>
        /// <param name="clientType">Client type.</param>
        /// <returns>Client name.</returns>
        public static string GetName(Type clientType)
        {
            object[] attributes = clientType.GetCustomAttributes(typeof(OAuthClientNameAttribute), false);
            return attributes != null && attributes.Any() ? (attributes[0] as OAuthClientNameAttribute).Name : string.Empty;
        }
    }
}
