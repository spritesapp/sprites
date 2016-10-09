using System.IO;

namespace Ifly.Layout
{
    /// <summary>
    /// Represents theme source.
    /// </summary>
    /// <typeparam name="TTheme">Theme type.</typeparam>
    /// <typeparam name="TThemeResult">Theme result type.</typeparam>
    public interface IThemeSource<TTheme, TThemeResult>
        where TThemeResult : ThemeResultBase<TTheme>, new()
        where TTheme : ThemeBase, new()
    {
        /// <summary>
        /// Returns the bundle stream for given themes.
        /// </summary>
        /// <param name="themes">Themes.</param>
        /// <returns>Bundle stream.</returns>
        Stream GetBundleStream(TThemeResult themes = null);

        /// <summary>
        /// Imports all themes from the underlying context and returns the imported themes.
        /// </summary>
        /// <returns>Themes.</returns>
        TThemeResult ImportThemes();

        /// <summary>
        /// Returns all themes that have been imported earlier from user hard drive.
        /// </summary>
        /// <returns>Themes.</returns>
        TThemeResult GetImportedThemes();
    }
}

