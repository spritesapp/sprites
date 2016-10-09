namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents presentation publish settings model.
    /// </summary>
    public class PresentationPublishSettingsModel
    {
        /// <summary>
        /// Gets or sets the zero-based index of a specific slide to display.
        /// </summary>
        public int? Slide { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether to display navigation controls.
        /// </summary>
        public bool Controls { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether to automatically start playing animations.
        /// </summary>
        public bool AutoPlay { get; set; }

        /// <summary>
        /// Gets or sets the presentation password.
        /// </summary>
        public string Password { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether password was changed.
        /// </summary>
        public bool PasswordChanged { get; set; }
    }
}