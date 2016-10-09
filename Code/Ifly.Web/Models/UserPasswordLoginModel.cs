namespace Ifly.Web.Models
{
    /// <summary>
    /// Represents user password login model.
    /// </summary>
    public class UserPasswordLoginModel
    {
        /// <summary>
        /// Gets or sets the email.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Gets or sets the password.
        /// </summary>
        public string Password { get; set; }
    }
}