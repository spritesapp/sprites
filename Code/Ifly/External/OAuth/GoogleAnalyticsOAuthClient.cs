namespace Ifly.External.OAuth
{
    /// <summary>
    /// Represents Google Analytics OAuth client. This class cannot be inherited.
    /// </summary>
    [OAuthClientName("GoogleAnalytics")]
    public sealed class GoogleAnalyticsOAuthClient : OAuthClient
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public GoogleAnalyticsOAuthClient() : 
            base("732432655752-sc8rnb18i0os9s6gg9ru3fnvbdghc6mf.apps.googleusercontent.com", 
            "rK7K4jw-5InCOPmPzoE8iLIM", 
            "https://www.googleapis.com/auth/analytics.readonly") { }

        /// <summary>
        /// Occurs when user gets authorized.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="result">Result.</param>
        /// <returns>Result.</returns>
        protected override OAuthAuthorizationResult OnAuthorized(int userId, OAuthAuthorizationResult result)
        {
            OAuthAuthorizationResult ret = result;
            string ping = "https://www.googleapis.com/analytics/v3/data/ga";

            if (!OAuthWebClient.CheckAuthorized(ping, result.AccessToken))
            {
                ret = EnsureAuthorization(userId, true);

                if (ret == null || string.IsNullOrEmpty(ret.AccessToken) || 
                    !OAuthWebClient.CheckAuthorized(ping, ret.AccessToken))
                {
                    ret.Authorized = false;
                    ret.AccessToken = string.Empty;
                }
            }

            return ret;
        }
    }
}
