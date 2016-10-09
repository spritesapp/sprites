namespace Ifly
{
    /// <summary>
    /// Represents a user password details.
    /// </summary>
    public class UserPasswordDetails 
    {
        /// <summary>
        /// Gets or sets the password hash.
        /// </summary>
        public string Hash { get; set; }

        /// <summary>
        /// Gets or sets the password reset token.
        /// </summary>
        public string ResetToken { get; set; }

        /// <summary>
        /// Gets or sets the password confirm token.
        /// </summary>
        public string ConfirmToken { get; set; }
    }
}
