namespace Ifly.Web.Models
{
    /// <summary>
    /// Represents user password change model.
    /// </summary>
    public class UserPasswordChangeModel
    {
        /// <summary>
        /// Gets or sets the user external Id.
        /// </summary>
        public string ExternalId { get; set; }

        /// <summary>
        /// Gets or sets the reset token.
        /// </summary>
        public string ResetToken { get; set; }

        /// <summary>
        /// Gets or sets the new password.
        /// </summary>
        public string NewPassword { get; set; }
    }
}