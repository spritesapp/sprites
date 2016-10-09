namespace Ifly
{
    /// <summary>
    /// Represents presentation sharing.
    /// </summary>
    public class PresentationSharing : Storage.Record
    {
        /// <summary>
        /// Gets or sets the Id of the presentation.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the Id of the user this presentation is shared with.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Gets or sets the invite-only email used when originally sharing the presentation.
        /// </summary>
        public string UserInviteEmail { get; set; }

        /// <summary>
        /// Gets or the user invitation key.
        /// </summary>
        public string UserInviteKey { get; set; }
    }
}
