namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents a user-defined theme.
    /// </summary>
    public class ThemeBuilderTheme
    {
        /// <summary>
        /// Gets or sets theme name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the Id of the theme to copy settings from.
        /// </summary>
        public string CopyFrom { get; set; }

        /// <summary>
        /// Gets or sets the selected font.
        /// </summary>
        public string FontFamily { get; set; }

        /// <summary>
        /// Gets or sets selected font color.
        /// </summary>
        public string FontColor { get; set; }

        /// <summary>
        /// Gets or sets the accent color #1.
        /// </summary>
        public string AccentColor1 { get; set; }

        /// <summary>
        /// Gets or sets the accent color #2.
        /// </summary>
        public string AccentColor2  { get; set; }

        /// <summary>
        /// Gets or sets the accent color #3.
        /// </summary>
        public string AccentColor3 { get; set; }

        /// <summary>
        /// Gets or sets the accent color #4.
        /// </summary>
        public string AccentColor4 { get; set; }

        /// <summary>
        /// Gets or sets the background color.
        /// </summary>
        public string BackgroundColor { get; set; }

        /// <summary>
        /// Gets or sets background image.
        /// </summary>
        public string BackgroundImage { get; set; }

        /// <summary>
        /// Gets or sets the logo.
        /// </summary>
        public string Logo { get; set; }
    }
}