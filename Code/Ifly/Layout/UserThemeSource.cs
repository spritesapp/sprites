using System.IO;
using System.Web;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace Ifly.Layout
{
    /// <summary>
    /// Represents user theme source.
    /// </summary>
    public class UserThemeSource : IThemeSource<UserTheme, UserThemeResult>
    {
        private static object _lock = new object();
        private static UserThemeSource _current = null;

        /// <summary>
        /// Gets the current instance of the theme source.
        /// </summary>
        public static UserThemeSource Current
        {
            get { return _current; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        private UserThemeSource() { }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static UserThemeSource()
        {
            _current = new UserThemeSource();
        }

        /// <summary>
        /// Returns the bundle stream for given themes.
        /// </summary>
        /// <param name="themes">Themes.</param>
        /// <returns>Bundle stream.</returns>
        public Stream GetBundleStream(UserThemeResult themes = null)
        {
            int userId = GetUserId();

            return userId > 0 ? ThemeSource.GetBundleStream<UserTheme, UserThemeResult>(
                string.Format("~/App_Data/Themes/{0}", userId), GetImportedThemes()) : null;
        }

        /// <summary>
        /// Imports all themes from the underlying context and returns the imported themes.
        /// </summary>
        /// <returns>Themes.</returns>
        public UserThemeResult ImportThemes()
        {
            throw new System.NotSupportedException("Importing of user themes is not supported via this source (only directly via ThemesController).");
        }

        /// <summary>
        /// Returns all themes that have been imported earlier from user hard drive.
        /// </summary>
        /// <returns>Themes.</returns>
        public UserThemeResult GetImportedThemes()
        {
            int userId = GetUserId();

            return userId > 0 ? ThemeSource.GetImportedThemes<UserTheme, UserThemeResult>(
                string.Format("~/App_Data/Themes/{0}", userId)) : new UserThemeResult();
        }

        /// <summary>
        /// Clones the given theme.
        /// </summary>
        /// <param name="sourceId">An Id of the theme to clone.</param>
        /// <param name="name">The name for a new theme.</param>
        /// <param name="overrides">Theme overrides.</param>
        /// <returns>New theme.</returns>
        public UserTheme CloneTheme(string sourceId, string name, ThemeMetadata overrides)
        {
            UserTheme ret = null;
            int userId = GetUserId();
            string cssText = string.Empty;
            string fullPhysicalPath = string.Empty;
            string newId = ThemeSource.MakeId(name);
            ThemeMetadata.ExCSSStylesheet stylesheet = null;
            string fullPhysicalPathDirectoryName = string.Empty;
            string fullPath = string.Format("~/App_Data/Themes/{0}/{1}.css", userId, name);
            
            if (userId > 0)
            {
                stylesheet = new ThemeMetadata.ExCSSStylesheet(sourceId, ThemeMetadata.ResolveThemeContents(sourceId));

                if (overrides != null)
                {
                    stylesheet.FontFamily = overrides.FontFamily;
                    stylesheet.FontColor = overrides.FontColor;
                    stylesheet.AccentColor1 = overrides.AccentColor1;
                    stylesheet.AccentColor2 = overrides.AccentColor2;
                    stylesheet.AccentColor3 = overrides.AccentColor3;
                    stylesheet.AccentColor4 = overrides.AccentColor4;
                    stylesheet.BackgroundColor = overrides.BackgroundColor;
                    stylesheet.BackgroundImage = overrides.BackgroundImage ?? string.Empty;
                    stylesheet.Logo = overrides.Logo;
                }

                cssText = stylesheet.ToString();
                cssText = Regex.Replace(cssText, string.Concat("\\.theme-", sourceId), string.Concat(".theme-", newId), RegexOptions.IgnoreCase);

                fullPhysicalPath = HttpContext.Current.Server.MapPath(fullPath);
                fullPhysicalPathDirectoryName = System.IO.Path.GetDirectoryName(fullPhysicalPath);

                if (!System.IO.Directory.Exists(fullPhysicalPathDirectoryName))
                    System.IO.Directory.CreateDirectory(fullPhysicalPathDirectoryName);

                System.IO.File.WriteAllText(fullPhysicalPath, cssText, System.Text.Encoding.UTF8);

                ret = ThemeSource.CreateThemeInstance<UserTheme>(fullPhysicalPath, t => t.PhysicalPath = fullPhysicalPath, true);
            }

            return ret;
        }

        /// <summary>
        /// Returns user Id.
        /// </summary>
        /// <returns>User Id.</returns>
        private int GetUserId()
        {
            Presentation p = null;
            string requestKey = "Ifly.UserThemeSource.UserId";
            int presentationId, ret = ApplicationContext.Current.User != null ? ApplicationContext.Current.User.Id : 0;

            if (HttpContext.Current != null && !string.IsNullOrEmpty(HttpContext.Current.Request.QueryString["presentationId"]))
            {
                if (HttpContext.Current.Items[requestKey] != null)
                    ret = (int)HttpContext.Current.Items[requestKey];
                else
                {
                    int.TryParse(HttpContext.Current.Request.QueryString["presentationId"], out presentationId);

                    if (presentationId > 0)
                    {
                        using (var repo = new Storage.Repositories.PresentationRepository())
                            p = repo.Select(presentationId);

                        if (p != null)
                        {
                            ret = p.UserId;
                            HttpContext.Current.Items[requestKey] = ret;
                        }
                    }
                }
            }

            return ret;
        }
    }
}