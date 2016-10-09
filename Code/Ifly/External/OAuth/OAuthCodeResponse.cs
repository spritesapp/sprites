namespace Ifly.External.OAuth
{
    /// <summary>
    /// Represents OAuth code response.
    /// </summary>
    public class OAuthCodeResponse
    {
        /// <summary>
        /// Gets or sets the passed state.
        /// </summary>
        public OAuthState State { get; set; }

        /// <summary>
        /// Gets or sets the access code.
        /// </summary>
        public string AccessCode { get; set; }

        /// <summary>
        /// Gets or sets the error (if any).
        /// </summary>
        public string Error { get; set; }
    }
}
