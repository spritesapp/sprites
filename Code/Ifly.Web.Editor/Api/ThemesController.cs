using Ifly.Layout;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents an theme upload controller.
    /// </summary>
    public class ThemesController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 4; }
        }

        /// <summary>
        /// Uploads the image.
        /// </summary>
        /// <returns>Theme URL.</returns>
        [HttpPost]
        public async Task<ThemeReference> UploadTheme()
        {
            UserTheme t = null;
            int maxSizeKb = 1024;
            ThemeReference ret = null;
            string root = string.Empty;
            MultipartFileData file = null;
            string fileName = string.Empty;
            string targetFileName = string.Empty;
            string originalPhysicalPath = string.Empty;
            MultipartFormDataStreamProvider provider = null;
            User currentUser = ApplicationContext.Current.User;
            
            if (currentUser != null && currentUser.Subscription != null && currentUser.Subscription.Type != SubscriptionType.Basic)
            {
                if (!this.Request.Content.IsMimeMultipartContent())
                    throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);

                root = System.Web.HttpContext.Current.Server.MapPath(string.Format("~/App_Data/Themes/{0}", currentUser.Id));

                if (!Directory.Exists(root))
                    Directory.CreateDirectory(root);

                provider = new MultipartFormDataStreamProvider(root);

                await this.Request.Content.ReadAsMultipartAsync(provider);
                file = provider.FileData.FirstOrDefault();

                if (file != null)
                {
                    originalPhysicalPath = file.LocalFileName;

                    if (File.Exists(originalPhysicalPath))
                    {
                        if ((new FileInfo(originalPhysicalPath).Length / maxSizeKb) > maxSizeKb)
                            File.Delete(originalPhysicalPath);
                        else
                        {
                            if (file.Headers != null && file.Headers.ContentDisposition != null)
                            {
                                fileName = Path.GetFileNameWithoutExtension((file.Headers.ContentDisposition.FileName ??
                                    file.Headers.ContentDisposition.Name ?? string.Empty).Trim('"', '\\', '\'').Trim());
                            }

                            if (string.IsNullOrEmpty(fileName))
                                fileName = string.Format("Theme {0}", System.DateTime.UtcNow.Ticks);

                            fileName = string.Format("{0}.css", fileName);
                            targetFileName = Path.Combine(Path.GetDirectoryName(originalPhysicalPath), fileName);

                            if (File.Exists(targetFileName))
                                File.Delete(targetFileName);

                            File.Move(originalPhysicalPath, targetFileName);

                            t = ThemeSource.CreateThemeInstance<UserTheme>(targetFileName, null, true);

                            ret = CreateReferenceFromTheme(t, fileName);
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Creates new theme.
        /// </summary>
        /// <param name="theme">Theme settings.</param>
        /// <returns>Theme URL.</returns>
        [HttpPost]
        public ThemeReference CreateTheme(Models.ThemeBuilderTheme theme)
        {
            UserTheme t = null;
            ThemeReference ret = null;
            User currentUser = ApplicationContext.Current.User;

            if (currentUser != null && currentUser.Subscription != null && currentUser.Subscription.Type != SubscriptionType.Basic)
            {
                t = UserThemeSource.Current.CloneTheme(theme.CopyFrom, theme.Name, new ThemeMetadata()
                {
                    FontFamily = theme.FontFamily,
                    FontColor = theme.FontColor,
                    AccentColor1 = theme.AccentColor1,
                    AccentColor2 = theme.AccentColor2,
                    AccentColor3 = theme.AccentColor3,
                    AccentColor4 = theme.AccentColor4,
                    BackgroundColor = theme.BackgroundColor,
                    BackgroundImage = theme.BackgroundImage,
                    Logo = theme.Logo
                });

                if (t != null)
                    ret = CreateReferenceFromTheme(t);
            }

            return ret;
        }

        /// <summary>
        /// Returns theme reference from user theme.
        /// </summary>
        /// <param name="theme">User theme.</param>
        /// <param name="fileName">Theme file name.</param>
        /// <returns>Theme reference.</returns>
        private ThemeReference CreateReferenceFromTheme(UserTheme theme, string fileName = null)
        {
            User currentUser = ApplicationContext.Current.User;

            if (string.IsNullOrEmpty(fileName))
                fileName = System.IO.Path.GetFileName(theme.PhysicalPath);

            return new ThemeReference()
            {
                Id = theme.Id,
                Name = theme.Name,
                Url = string.Format("{0}://{1}/themes/{2}/{3}", Request.RequestUri.Scheme, Request.RequestUri.Host, currentUser.Id, fileName)
            };
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "UploadTheme",
                routeTemplate: "api/themes/upload",
                defaults: new { controller = "Themes", action = "UploadTheme" }
            );

            config.Routes.MapHttpRoute(
                name: "CreateTheme",
                routeTemplate: "api/themes/create",
                defaults: new { controller = "Themes", action = "CreateTheme" }
            );
        }
    }
}
