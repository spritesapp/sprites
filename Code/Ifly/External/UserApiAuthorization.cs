namespace Ifly.External
{
    /// <summary>
    /// Represents user API authorization.
    /// </summary>
    public class UserApiAuthorization
    {
        /// <summary>
        /// Gets or sets Google Analytics API authorization.
        /// </summary>
        public OAuth.OAuthToken GoogleAnalytics { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public UserApiAuthorization()
        {
            GoogleAnalytics = new OAuth.OAuthToken();
        }
    }
}
