namespace Ifly.External.OAuth
{
    /// <summary>
    /// Represents OAuth authorization result.
    /// </summary>
    public class OAuthAuthorizationResult
    {
        /// <summary>
        /// Gets or sets value indicating whether user is authorized.
        /// </summary>
        public bool Authorized { get; set; }

        /// <summary>
        /// Gets or sets access token.
        /// </summary>
        public string AccessToken { get; set; }
    }
}
