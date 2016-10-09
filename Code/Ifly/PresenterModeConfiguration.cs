namespace Ifly
{
    /// <summary>
    /// Represents presenter mode animation availability.
    /// </summary>
    public enum PresenterModeAnimationAvailability
    {
        /// <summary>
        /// Minimal transitions.
        /// </summary>
        Minimal = 0,

        /// <summary>
        /// Normal transitions.
        /// </summary>
        Normal = 1,

        /// <summary>
        /// No transitions.
        /// </summary>
        None = 2
    }

    /// <summary>
    /// Represents presenter mode configuration.
    /// </summary>
    public class PresenterModeConfiguration
    {
        /// <summary>
        /// Gets or sets the Id of the related presentation.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the availability of the element/slide animations.
        /// </summary>
        public PresenterModeAnimationAvailability Animations { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether Sprites can ask to go fullscreen.
        /// </summary>
        public bool? AllowFullscreen { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public PresenterModeConfiguration()
        {
            Animations = PresenterModeAnimationAvailability.Minimal;
            AllowFullscreen = true;
        }

        /// <summary>
        /// Returns the absolute URI of a given presentation.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <param name="config">Presenter configuration.</param>
        /// <returns>The absolute URI of a given presentation.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="requestUri" /> or <paramref name="config" /> is null.</exception>
        public static string GetAbsoluteUri(System.Uri requestUri, PresenterModeConfiguration config)
        {
            if (requestUri == null)
                throw new System.ArgumentNullException("requestUri");

            if (config == null)
                throw new System.ArgumentNullException("config");

            return GetAbsoluteUri(requestUri, config.PresentationId);
        }

        /// <summary>
        /// Returns the absolute URI of a given presentation.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <param name="presentationId">Presentation Id.</param>
        /// <returns>The absolute URI of a given presentation.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="requestUri" /> is null.</exception>
        public static string GetAbsoluteUri(System.Uri requestUri, int presentationId)
        {
            string ret = PublishConfiguration.GetAbsoluteUri(requestUri, presentationId);

            ret += ((ret.IndexOf('?') > 0 ? '&' : '?') + "presenter=1");

            return ret;
        }

        /// <summary>
        /// Returns the Id of the presentation from the given URL.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <returns>Presentation Id.</returns>
        public static int GetPresentationIdFromUri(System.Uri requestUri)
        {
            return PublishConfiguration.GetPresentationIdFromUri(requestUri);
        }
    }
}
