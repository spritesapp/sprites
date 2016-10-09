using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;

namespace Ifly.Layout
{
    /// <summary>
    /// Allows importing themes from GitHub repository.
    /// </summary>
    public class GitHubThemeSource : IThemeSource<GitHubTheme, GitHubThemeResult>
    {
        private static object _lock = new object();
        private static GitHubThemeSource _current = null;

        /// <summary>
        /// Represents GitHub theme cache.
        /// </summary>
        private static class GitHubThemeCache
        {
            private static Tuple<GitHubThemeResult, DateTime> _result;

            /// <summary>
            /// Reads from cache.
            /// </summary>
            /// <returns>Result.</returns>
            public static GitHubThemeResult Read()
            {
                GitHubThemeResult ret = null;

                if (_result != null && DateTime.UtcNow.Subtract(_result.Item2).TotalMinutes < 1)
                {
                    lock (_lock)
                    {
                        if (_result != null)
                            ret = _result.Item1;
                    }
                }

                return ret;
            }

            /// <summary>
            /// Updates the cache.
            /// </summary>
            /// <param name="result">Result.</param>
            public static void Update(GitHubThemeResult result)
            {
                _result = new Tuple<GitHubThemeResult, DateTime>(result, DateTime.UtcNow);
            }
        }

        /// <summary>
        /// Represents in-memory GitHub theme cache.
        /// </summary>
        private static class GitHubInMemoryThemeCache
        {
            private static Tuple<GitHubInMemoryTheme, DateTime> _result;

            /// <summary>
            /// Reads from cache.
            /// </summary>
            /// <returns>Result.</returns>
            public static GitHubInMemoryTheme Read()
            {
                GitHubInMemoryTheme ret = null;

                if (_result != null && DateTime.UtcNow.Subtract(_result.Item2).TotalMinutes < 1)
                {
                    lock (_lock)
                    {
                        if (_result != null)
                            ret = _result.Item1;
                    }
                }

                return ret;
            }

            /// <summary>
            /// Updates the cache.
            /// </summary>
            /// <param name="result">Result.</param>
            public static void Update(GitHubInMemoryTheme result)
            {
                _result = new Tuple<GitHubInMemoryTheme, DateTime>(result, DateTime.UtcNow);
            }
        }

        /// <summary>
        /// Gets the current instance of the theme source.
        /// </summary>
        public static GitHubThemeSource Current
        {
            get { return _current; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        private GitHubThemeSource() { }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static GitHubThemeSource()
        {
            _current = new GitHubThemeSource();
        }

        /// <summary>
        /// Returns the bundle stream for given themes.
        /// </summary>
        /// <param name="themes">Themes.</param>
        /// <returns>Bundle stream.</returns>
        public Stream GetBundleStream(GitHubThemeResult themes = null)
        {
            Stream ret = null;
            GitHubInMemoryTheme inMemoryTheme = null;

            if (themes == null)
            {
                inMemoryTheme = GetUrlSpecifiedTheme();

                if (inMemoryTheme != null)
                    ret = new MemoryStream(inMemoryTheme.Content);
            }

            if (ret == null)
            {
                if (themes == null)
                    themes = ImportThemes();

                ret = ThemeSource.GetBundleStream<GitHubTheme, GitHubThemeResult>("~/Assets/css/Themes/", themes);
            }

            return ret;
        }

        /// <summary>
        /// Imports all themes from the underlying context and returns the imported themes.
        /// </summary>
        /// <returns>Themes.</returns>
        public GitHubThemeResult ImportThemes()
        {
            int modifierIndex = -1;
            string[] export = null;
            string[] modifiers = null;
            GitHubThemeResult ret = null;
            string themeFilePath = string.Empty;
            string themeContents = string.Empty;
            string directoryPath = string.Empty;
            HashSet<string> exported = new HashSet<string>();
            string baseUrl = "https://raw.githubusercontent.com/spritesapp/sprites-themes/master";

            ret = GitHubThemeCache.Read();

            if (ret == null)
            {
                directoryPath = HttpContext.Current.Server.MapPath("~/Assets/css/Themes/");
                export = ThemeSource.DownloadString(string.Format("{0}/EXPORT", baseUrl)).Split(new char[] { '\n' }, StringSplitOptions.RemoveEmptyEntries);

                if (export.Any())
                {
                    if (!Directory.Exists(directoryPath))
                        Directory.CreateDirectory(directoryPath);

                    foreach (string themeFileName in export.Select(e => e.Trim()))
                    {
                        if (!string.IsNullOrWhiteSpace(themeFileName) && !themeFileName.StartsWith("#"))
                        {
                            modifierIndex = themeFileName.IndexOf('!');

                            modifiers = modifierIndex > 0 ?
                                themeFileName.Substring(modifierIndex)
                                    .TrimStart('!')
                                    .Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries)
                                    .Select(m => m.Trim().ToLowerInvariant())
                                    .ToArray() : null;

                            themeFilePath = Path.Combine(directoryPath, modifierIndex > 0 ?
                                themeFileName.Substring(0, modifierIndex).Trim() : themeFileName);

                            if (!File.Exists(themeFilePath) || (modifiers != null && modifiers.Any(m => string.Compare(m, "force", true) == 0)))
                            {
                                themeContents = ThemeSource.DownloadString(string.Format("{0}/lib/{1}", baseUrl, themeFileName));
                                if (!string.IsNullOrWhiteSpace(themeContents))
                                {
                                    if (!exported.Contains(themeFileName))
                                        exported.Add(themeFileName);

                                    if (File.Exists(themeFilePath))
                                        File.Delete(themeFilePath);

                                    File.WriteAllText(themeFilePath, themeContents, Encoding.UTF8);
                                }
                            }
                        }
                    }
                }

                ret = GetImportedThemesInternal(exported);

                GitHubThemeCache.Update(ret);
            }

            return ret;
        }

        /// <summary>
        /// Returns all themes that have been imported earlier from user hard drive.
        /// </summary>
        /// <returns>Themes.</returns>
        public GitHubThemeResult GetImportedThemes()
        {
            return GetImportedThemesInternal();
        }

        /// <summary>
        /// Returns the theme which is specified via URL.
        /// </summary>
        /// <returns>Theme.</returns>
        private GitHubInMemoryTheme GetUrlSpecifiedTheme()
        {
            GitHubInMemoryTheme ret = null;
            string inMemoryThemeUrl = ThemeSource.GetThemeUrlFromRequest(HttpContext.Current.Request);

            if (!string.IsNullOrEmpty(inMemoryThemeUrl))
            {
                ret = GitHubInMemoryThemeCache.Read();

                if (ret == null || string.Compare(inMemoryThemeUrl, ret.Uri, true) != 0)
                {
                    ret = ThemeSource.CreateThemeInstance<GitHubInMemoryTheme>(inMemoryThemeUrl, t => 
                    {
                        t.Uri = inMemoryThemeUrl;
                        t.Content = Encoding.UTF8.GetBytes(ThemeSource.DownloadString(inMemoryThemeUrl));
                    });

                    if (ret.Content != null && ret.Content.Length > 0)
                        GitHubInMemoryThemeCache.Update(ret);
                    else
                        ret = null;
                }
            }

            return ret;
        }

        /// <summary>
        /// Returns all themes that have been imported earlier from GitHub repository.
        /// </summary>
        /// <param name="ensureOnlyFiles">A list of theme file names (without directory information) to treat as white-list - all other files will be deleted.</param>
        /// <returns>Themes.</returns>
        private GitHubThemeResult GetImportedThemesInternal(IEnumerable<string> ensureOnlyFiles = null)
        {
            GitHubThemeResult ret = null;
            GitHubInMemoryTheme inMemoryTheme = null;

            inMemoryTheme = GetUrlSpecifiedTheme();

            if (inMemoryTheme != null)
            {
                ret = new GitHubThemeResult()
                {
                    Themes = new List<GitHubTheme>() 
                    {
                        new GitHubTheme()
                        {
                            Id = inMemoryTheme.Id,
                            Name = inMemoryTheme.Name
                        }
                    },
                    Checksum = CalculateChecksum(inMemoryTheme)
                };
            }
            else
                ret = ThemeSource.GetImportedThemes<GitHubTheme, GitHubThemeResult>("~/Assets/css/Themes/", ensureOnlyFiles);

            return ret;
        }

        /// <summary>
        /// Calculates the checksum for given theme.
        /// </summary>
        /// <param name="theme">Theme.</param>
        /// <returns>Checksum.</returns>
        private string CalculateChecksum(GitHubInMemoryTheme theme)
        {
            return Utils.Crypto.GetHash(theme.Uri);
        }
    }
}
