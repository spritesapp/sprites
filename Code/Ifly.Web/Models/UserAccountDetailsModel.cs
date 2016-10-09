namespace Ifly.Web.Models
{
    /// <summary>
    /// Represents user account details model.
    /// </summary>
    public class UserAccountDetailsModel
    {
        /// <summary>
        /// Gets or sets the user.
        /// </summary>
        public User User { get; set; }

        /// <summary>
        /// Returns value indicating whether the given input string looks like an email.
        /// </summary>
        /// <param name="input">Input string.</param>
        /// <returns>Value indicating whether the given input string looks like an email.</returns>
        public bool IsEmail(string input)
        {
            return Volga.Utils.Input.IsEmail(input ?? string.Empty);
        }
    }
}