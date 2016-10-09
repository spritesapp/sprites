namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents feedback model.
    /// </summary>
    public class FeedbackModel
    {
        /// <summary>
        /// Gets or sets user name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets user email.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Gets or sets the feedback text.
        /// </summary>
        public string Text { get; set; }
    }
}