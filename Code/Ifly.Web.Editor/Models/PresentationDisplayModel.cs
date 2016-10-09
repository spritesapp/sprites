namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents presentation looping of a playback settings.
    /// </summary>
    public class PresentationDisplayLoopPlaybackSettings
    {
        /// <summary>
        /// Gets or sets value indicating whether looping of a playback is enabled.
        /// </summary>
        public bool Enable { get; set; }

        /// <summary>
        /// Returns a string representation of the current object.
        /// </summary>
        /// <returns>A string representation of the current object.</returns>
        public override string ToString()
        {
 	         return Enable.ToString().ToLowerInvariant();
        }
    }

    /// <summary>
    /// Represents a presentation display model.
    /// </summary>
    public class PresentationDisplayModel
    {
        /// <summary>
        /// Gets or sets the absolute presentation URI.
        /// </summary>
        public string PresentationUrl { get; set; }

        /// <summary>
        /// Gets or sets the presentation URL query.
        /// </summary>
        public string PresentationUrlQuery { get; set; }

        /// <summary>
        /// Gets or sets presentation title.
        /// </summary>
        public string PresentationTitle { get; set; }

        /// <summary>
        /// Gets or sets the Id of the presentation.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the Id of the presentation user.
        /// </summary>
        public int PresentationUserId { get; set; }

        /// <summary>
        /// Gets or sets the presentation.
        /// </summary>
        public Ifly.Presentation Presentation { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether password is requires for the presentation to display.
        /// </summary>
        public bool RequiresPassword { get; set; }

        /// <summary>
        /// Gets or sets looping of a playback settings.
        /// </summary>
        public PresentationDisplayLoopPlaybackSettings LoopPlayback { get; set; }

        /// <summary>
        /// Gets or sets presentation integration settings.
        /// </summary>
        public IntegrationSettings PresentationIntegrationSettings { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether CEF is connected.
        /// </summary>
        public bool IsCefConnected { get; set; }
    }
}