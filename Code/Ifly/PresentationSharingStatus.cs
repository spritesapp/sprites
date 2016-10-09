using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents presentation sharing update result.
    /// </summary>
    public class PresentationSharingUpdateResult
    {
        /// <summary>
        /// Gets or sets the list of newly added collaborators.
        /// </summary>
        public IEnumerable<PresentationSharing> Added { get; set; }

        /// <summary>
        /// Gets or sets the list of removed collaborators.
        /// </summary>
        public IEnumerable<PresentationSharing> Removed { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public PresentationSharingUpdateResult()
        {
            this.Added = new List<PresentationSharing>();
            this.Removed = new List<PresentationSharing>();
        }
    }

    /// <summary>
    /// Represents user presentation sharing status.
    /// </summary>
    public class PresentationUserSharingStatus
    {
        /// <summary>
        /// Gets or sets the user Id.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Gets or sets the invite-only email used when originally sharing the presentation.
        /// </summary>
        public string UserInviteEmail { get; set; }

        /// <summary>
        /// Gets value indicating whether user has accepted the sharing request.
        /// </summary>
        public bool HasAcceptedSharing
        {
            get { return UserId > 0; }
        }
    }

    /// <summary>
    /// Represents presentation sharing status.
    /// </summary>
    public class PresentationSharingStatus
    {
        /// <summary>
        /// Gets or sets the presentation Id.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the users this presentation is shared with.
        /// </summary>
        public IEnumerable<PresentationUserSharingStatus> Users { get; set; }

    }
}
