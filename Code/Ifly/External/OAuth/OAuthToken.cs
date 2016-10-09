using System;

namespace Ifly.External.OAuth
{
    /// <summary>
    /// Represents OAuth token.
    /// </summary>
    public class OAuthToken
    {
        /// <summary>
        /// Gets or sets access token.
        /// </summary>
        public string AccessToken { get; set; }

        /// <summary>
        /// Gets or sets the refresh token.
        /// </summary>
        public string RefreshToken { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the access token was last time refreshed.
        /// </summary>
        public DateTime AccessTokenRefreshed { get; set; }

        /// <summary>
        /// Gets or sets the number of seconds after which the last refreshed access token expires.
        /// </summary>
        public int AccessTokenExpiresIn { get; set; }
    }
}
