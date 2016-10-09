namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents presentation presenter mode settings model.
    /// </summary>
    public class PresentationPresenterSettingsModel
    {
        /// <summary>
        /// Gets or sets the availability of the element/slide animations.
        /// </summary>
        public PresenterModeAnimationAvailability Animations { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether Sprites can ask to go fullscreen.
        /// </summary>
        public bool? AllowFullscreen { get; set; }
    }
}