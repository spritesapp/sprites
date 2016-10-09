using System.IO;

namespace Ifly.Layout
{
    /// <summary>
    /// Represents a base theme.
    /// </summary>
    public abstract class ThemeBase
    {
        /// <summary>
        /// Gets or sets the Id of the theme.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the user-friendly name of the theme.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the physical path of the theme.
        /// </summary>
        public string PhysicalPath { get; set; }

        /// <summary>
        /// Opens the contents of a given theme.
        /// </summary>
        /// <returns></returns>
        public Stream OpenRead()
        {
            string path = this.PhysicalPath;

            return !string.IsNullOrEmpty(path) ? File.OpenRead(path) : null;
        }
    }
}

