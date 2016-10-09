namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents clone slide settings.
    /// </summary>
    public class CloneSlideSettings
    {
        /// <summary>
        /// Gets or sets the slide title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the target presentation Id.
        /// </summary>
        public int? TargetPresentationId { get; set; }
    }
}