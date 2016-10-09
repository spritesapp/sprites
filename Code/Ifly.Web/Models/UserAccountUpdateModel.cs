namespace Ifly.Web.Models
{
    /// <summary>
    /// Represents user account update model.
    /// </summary>
    public class UserAccountUpdateModel
    {
        /// <summary>
        /// Gets or sets user name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets user email address.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Gets or sets user subscription type.
        /// </summary>
        public SubscriptionType SubscriptionType { get; set; }

        /// <summary>
        /// Gets or sets the password.
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// Gets or sets the company name.
        /// </summary>
        public string CompanyName { get; set; }

        /// <summary>
        /// Gets or sets the company address.
        /// </summary>
        public string CompanyAddress { get; set; }
    }
}