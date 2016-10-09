namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents a slide settings model.
    /// </summary>
    public class SlideSettingsModel
    {
        /// <summary>
        /// Gets or sets the slide title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the slide description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the slide play time.
        /// </summary>
        public double PlaybackTime { get; set; }
    }
}