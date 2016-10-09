namespace Ifly.Web.Models
{
    /// <summary>
    /// Represents user sign-up model.
    /// </summary>
    public class UserSignUpModel
    {
        /// <summary>
        /// Gets or sets the name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the email.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Gets or sets the password.
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// Gets or sets sign-up subscription type for this user.
        /// </summary>
        public SubscriptionType? SignUpSubscriptionType { get; set; }
    }
}