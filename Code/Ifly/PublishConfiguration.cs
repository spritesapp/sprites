using System.Linq;
using System.Text.RegularExpressions;

namespace Ifly
{
    /// <summary>
    /// Represents a publish configuration.
    /// </summary>
    public class PublishConfiguration
    {
        /// <summary>
        /// Gets or sets the Id of the related presentation.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the zero-based index of a specific slide to display.
        /// </summary>
        public int? Slide { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether to display navigation controls.
        /// </summary>
        public bool Controls { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether to display progress bar on each slide.
        /// </summary>
        public bool ProgressBar { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether to automatically start playing animations.
        /// </summary>
        public bool AutoPlay { get; set; }

        /// <summary>
        /// Gets or sets the MD5 hash of the password which indicates that this is a private presentation.
        /// </summary>
        public string PasswordHash { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public PublishConfiguration()
        {
            this.AutoPlay = true;
            this.Controls = true;
            this.ProgressBar = true;
        }

        /// <summary>
        /// Returns the absolute URI of a given presentation.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <param name="config">Publish configuration.</param>
        /// <returns>The absolute URI of a given presentation.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="requestUri" /> or <paramref name="config" /> is null.</exception>
        public static string GetAbsoluteUri(System.Uri requestUri, PublishConfiguration config)
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
            if (requestUri == null)
                throw new System.ArgumentNullException("requestUri");

            return string.Format("{0}://{1}/view/embed/{2}", requestUri.Scheme, requestUri.Host, presentationId);
        }

        /// <summary>
        /// Returns the Id of the presentation from the given URL.
        /// </summary>
        /// <param name="requestUri">Request URI.</param>
        /// <returns>Presentation Id.</returns>
        public static int GetPresentationIdFromUri(System.Uri requestUri)
        {
            int ret = 0;
            string[] parts = null;
            string path = string.Empty;
            string idPart = string.Empty;

            if (requestUri != null)
            {
                path = requestUri.AbsolutePath.ToLowerInvariant();

                if (path.IndexOf("/edit/") >= 0 || path.IndexOf("/view/embed/") >= 0)
                {
                    parts = path.Split(new char[] { '/' }, System.StringSplitOptions.RemoveEmptyEntries)
                        .Select(p => p.Trim()).ToArray();

                    idPart = parts[parts.Length - 1];

                    if (parts.Length > 1 && string.Compare(parts[parts.Length - 1], "canvas", true) == 0)
                        idPart = parts[parts.Length - 2];

                    if (Regex.IsMatch(idPart, "^[0-9]+$", RegexOptions.IgnoreCase))
                        ret = int.Parse(idPart);
                }
            }

            return ret;
        }
    }
}
