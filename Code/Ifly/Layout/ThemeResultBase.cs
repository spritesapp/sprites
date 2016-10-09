using System.Collections.Generic;
using System.Linq;

namespace Ifly.Layout
{
    /// <summary>
    /// Represents a theme result.
    /// </summary>
    /// <typeparam name="TTheme">Theme type.</typeparam>
    public abstract class ThemeResultBase<TTheme> where TTheme: ThemeBase
    {
        /// <summary>
        /// Gets or sets the MD5 checksum.
        /// </summary>
        public string Checksum { get; set; }

        /// <summary>
        /// Gets or sets the themes.
        /// </summary>
        public IEnumerable<TTheme> Themes { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        protected ThemeResultBase()
        {
            Checksum = string.Empty;
            Themes = Enumerable.Empty<TTheme>();
        }
    }
}

