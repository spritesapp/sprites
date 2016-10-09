namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents basic presentation settings.
    /// </summary>
    public class PresentationSettingsModel
    {
        /// <summary>
        /// Gets or sets presentation Id.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the presentation title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the presentation theme.
        /// </summary>
        public string Theme { get; set; }

        /// <summary>
        /// Gets or sets the background image.
        /// </summary>
        public string BackgroundImage { get; set; }
    }
}