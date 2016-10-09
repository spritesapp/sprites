namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents presentation update result.
    /// </summary>
    public class PresentationUpdateResultModel
    {
        /// <summary>
        /// Gets or sets the presentation Id.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the slide which is automatically created when new presentation is created.
        /// </summary>
        public Slide Slide { get; set; }
    }
}