namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents session initialization model.
    /// </summary>
    public class SessionInitializationModel
    {
        /// <summary>
        /// Gets or sets the client Id.
        /// </summary>
        public string ClientId { get; set; }

        /// <summary>
        /// Gets or sets the current session Id.
        /// </summary>
        public string CurrentSessionId { get; set; }
    }
}