namespace Ifly.Layout
{
    /// <summary>
    /// Represents GitHub in-memory theme.
    /// </summary>
    public class GitHubInMemoryTheme : ThemeBase
    {
        /// <summary>
        /// Gets or sets the URI where the theme has been loaded from.
        /// </summary>
        public string Uri { get; set; }

        /// <summary>
        /// Gets or sets the theme content.
        /// </summary>
        public byte[] Content { get; set; }
    }
}

