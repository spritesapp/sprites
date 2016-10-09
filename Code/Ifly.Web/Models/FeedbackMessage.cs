namespace Ifly.Web.Models
{
    /// <summary>
    /// Represents a feedback message.
    /// </summary>
    public class FeedbackMessage
    {
        /// <summary>
        /// Gets or sets the sender's name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the sender's email.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Gets or sets the message text.
        /// </summary>
        public string Text { get; set; }
    }
}