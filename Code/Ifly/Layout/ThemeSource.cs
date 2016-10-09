using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;

namespace Ifly.Layout
{
    /// <summary>
    /// Represents theme source.
    /// </summary>
    public static class ThemeSource
    {
        private static object _lock = new object();

        /// <summary>
        /// Gets the GitHub theme source.
        /// </summary>
        public static GitHubThemeSource GitHub
        {
            get { return GitHubThemeSource.Current; }
        }

        /// <summary>
        /// Gets the user theme source.
        /// </summary>
        public static UserThemeSource User
        {
            get { return UserThemeSource.Current; }
        }

        /// <summary>
        /// Returns the theme URL by examining the given HTTP request.
        /// </summary>
        /// <param name="request">HTTP request.</param>
        /// <returns>Theme URL.</returns>
        public static string GetThemeUrlFromRequest(HttpRequest request = null)
        {
            string ret = string.Empty;
            NameValueCollection query = null;

            if (request == null)
                request = HttpContext.Current.Request;

            ret = request["theme"];

            if (string.IsNullOrEmpty(ret) && request.UrlReferrer != null && !string.IsNullOrEmpty(request.UrlReferrer.Query))
            {
                query = HttpUtility.ParseQueryString(request.UrlReferrer.Query);

                if (query != null)
                    ret = query["theme"];
            }

            return ret;
        }

        /// <summary>
        /// Returns the bundle stream for given themes.
        /// </summary>
        /// <typeparam name="TTheme">Theme type.</typeparam>
        /// <typeparam name="TThemeResult">Theme result type.</typeparam>
        /// <param name="basePath">Base theme path.</param>
        /// <param name="themes">Themes.</param>
        /// <returns>Bundle stream.</returns>
        public static Stream GetBundleStream<TTheme, TThemeResult>(string basePath, TThemeResult themes)
            where TThemeResult : ThemeResultBase<TTheme>
            where TTheme : ThemeBase
        {
            Stream ret = null;
            string checksum = null;
            string bundlePath = null;
            Stream themeStream = null;
            string directoryPath = null;
            string existingBundle = null;
            string bundlePhysicalPath = null;
            StringBuilder bundleContent = null;
            bundleContent = new StringBuilder();
            directoryPath = HttpContext.Current.Server.MapPath(basePath);

            if (themes != null && themes.Themes != null && themes.Themes.Any())
            {
                if (!Directory.Exists(directoryPath))
                    Directory.CreateDirectory(directoryPath);

                checksum = themes.Checksum;

                if (string.IsNullOrEmpty(checksum))
                    checksum = ThemeSource.CalculateChecksum(themes.Themes);

                if (!string.IsNullOrEmpty(checksum))
                {
                    bundlePhysicalPath = Path.Combine(directoryPath, string.Format("{0}.bundle", checksum));

                    if (!File.Exists(bundlePhysicalPath))
                    {
                        lock (_lock)
                        {
                            existingBundle = Directory.EnumerateFiles(directoryPath, "*.bundle").FirstOrDefault();

                            if (!string.IsNullOrEmpty(existingBundle))
                                File.Delete(existingBundle);

                            foreach (TTheme theme in themes.Themes)
                            {
                                themeStream = theme.OpenRead();

                                if (themeStream != null)
                                {
                                    using (themeStream)
                                    {
                                        using (StreamReader reader = new StreamReader(themeStream))
                                            bundleContent.AppendLine(reader.ReadToEnd()).AppendLine();
                                    }
                                }
                            }

                            if (bundleContent.Length > 0)
                            {
                                bundlePath = bundlePhysicalPath;
                                File.WriteAllText(bundlePhysicalPath, SecureContent(bundleContent.ToString()), Encoding.UTF8);
                            }
                        }
                    }
                    else
                        bundlePath = bundlePhysicalPath;
                }
            }

            ret = !string.IsNullOrEmpty(bundlePath) ? new FileStream(bundlePath, FileMode.Open, FileAccess.Read) : null;

            return ret;
        }

        /// <summary>
        /// Returns all themes that have been imported earlier.
        /// </summary>
        /// <typeparam name="TTheme">Theme type.</typeparam>
        /// <typeparam name="TThemeResult">Theme result type.</typeparam>
        /// <param name="basePath">Base theme path.</param>
        /// <param name="ensureOnlyFiles">A list of theme file names (without directory information) to treat as white-list - all other files will be deleted.</param>
        /// <returns>Themes.</returns>
        public static TThemeResult GetImportedThemes<TTheme, TThemeResult>(string basePath, IEnumerable<string> ensureOnlyFiles = null)
            where TThemeResult: ThemeResultBase<TTheme>, new()
            where TTheme: ThemeBase, new()
        {
            TThemeResult ret = null;
            string directoryPath = null;
            List<string> filesToDelete = null;
            IEnumerable<TTheme> themes = null;
            filesToDelete = new List<string>();
            themes = Enumerable.Empty<TTheme>();
            directoryPath = HttpContext.Current.Server.MapPath(basePath);

            if (Directory.Exists(directoryPath))
            {
                themes = Directory.GetFiles(directoryPath, "*.css").Where(f =>
                {
                    string fileName = Path.GetFileName(f);
                    bool exportable = ensureOnlyFiles == null || !ensureOnlyFiles.Any() ||
                        ensureOnlyFiles.Any(e => string.Compare(e, fileName, true) == 0);

                    if (!exportable)
                        filesToDelete.Add(f);

                    return exportable;
                }).Select(f =>
                {
                    return CreateThemeInstance<TTheme>(Path.GetFileNameWithoutExtension(f),
                        t => t.PhysicalPath = f);
                });

                if (filesToDelete.Any())
                {
                    foreach (string f in filesToDelete)
                        File.Delete(f);
                }
            }

            ret = new TThemeResult()
            {
                Themes = themes,
                Checksum = CalculateChecksum(themes)
            };

            return ret;
        }

        /// <summary>
        /// Downloads the contents that reside under the given URI.
        /// </summary>
        /// <param name="uri">URI.</param>
        /// <returns>Downloaded contents.</returns>
        public static string DownloadString(string uri)
        {
            string ret = string.Empty;

            try
            {
                using (var client = new WebClient())
                    ret = client.DownloadString(uri);
            }
            catch (WebException) { }
            catch (NotSupportedException) { }

            return ret;
        }

        /// <summary>
        /// Calculates the checksum for given themes.
        /// </summary>
        /// <typeparam name="TTheme">Theme type.</typeparam>
        /// <param name="themes">Themes</param>
        /// <returns>Checksum.</returns>
        public static string CalculateChecksum<TTheme>(IEnumerable<TTheme> themes) where TTheme: ThemeBase
        {
            string physicalPath = string.Empty;
            StringBuilder checksum = new StringBuilder();

            if (themes != null)
            {
                foreach (TTheme t in themes)
                {
                    physicalPath = t.PhysicalPath;

                    if (File.Exists(physicalPath))
                        checksum.AppendLine(new FileInfo(physicalPath).LastWriteTimeUtc.Ticks.ToString());
                }
            }

            return Utils.Crypto.GetHash(checksum.ToString());
        }

        /// <summary>
        /// Creates theme instance.
        /// </summary>
        /// <typeparam name="TTheme">Theme type.</typeparam>
        /// <param name="path">Theme path.</param>
        /// <param name="initializer">Theme initializer.</param>
        /// <returns>Theme instance.</returns>
        public static TTheme CreateThemeInstance<TTheme>(string path, Action<TTheme> initializer = null, bool parseThemeCss = false) where TTheme : ThemeBase, new()
        {
            bool isWebAddress = false;
            TTheme ret = new TTheme();
            string originalPath = path;
            string contents = string.Empty;
            
            if (path.IndexOf('/') > 0 || path.IndexOf('\\') > 0)
            {
                if (path.IndexOf("://") > 0)
                {
                    isWebAddress = true;
                    path = path.Substring(path.LastIndexOf('/') + 1);
                }
                else
                    path = Path.GetFileNameWithoutExtension(path);
            }

            if (isWebAddress)
            {
                foreach (char c in new char[] { '?', '.' })
                {
                    if (path.IndexOf(c) > 0)
                        path = path.Substring(0, path.IndexOf(c));
                }
            }

            ret.Id = MakeId(path);
            ret.Name = path;

            if (!isWebAddress && File.Exists(originalPath) && parseThemeCss)
            {
                try
                {
                    contents = File.ReadAllText(originalPath);
                }
                catch (System.IO.IOException) { }

                if (!string.IsNullOrEmpty(contents))
                {
                    contents = SecureContent(contents);

                    contents = Regex.Replace(contents, @"\.theme-([a-zA-Z0-9\-_]+)(\s|\t|\{)", 
                        string.Format(".theme-{0}$2", ret.Id), RegexOptions.IgnoreCase);

                    try
                    {
                        File.WriteAllText(originalPath, contents);
                    }
                    catch (System.IO.IOException) { }
                }
            }

            if (initializer != null)
                initializer(ret);

            return ret;
        }

        /// <summary>
        /// Makes theme Id from a given term.
        /// </summary>
        /// <param name="term">Term.</param>
        /// <returns>Theme Id.</returns>
        public static string MakeId(string term)
        {
            string ret = term ?? string.Empty;

            ret = Regex.Replace(ret, @"\s", "-").Trim().Trim('-').Trim();
            ret = Regex.Replace(ret, @"[^a-zA-Z0-9\-_]", "-", RegexOptions.IgnoreCase).ToLowerInvariant().Trim('-');

            return ret;
        }

        /// <summary>
        /// Secures the given content.
        /// </summary>
        /// <param name="content">Content to secure.</param>
        /// <returns>Content.</returns>
        public static string SecureContent(string content)
        {
            string ret = content;

            // Stylesheets must be served via SSL, otherwise Chrom fails to load them.
            ret = Regex.Replace(ret, @"@import\s+url\s*\(http://", "@import url(https://");

            return ret;
        }
    }
}

