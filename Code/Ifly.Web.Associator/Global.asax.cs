using Ifly.Web.Common.Filters;
using System.Linq;
using System.Net;
using System.Net.Security;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;

namespace Ifly.Web.Associator
{
    /// <summary>
    /// Represents an application.
    /// </summary>
    public class MvcApplication : System.Web.HttpApplication
    {
        /// <summary>
        /// Occurs when application starts.
        /// </summary>
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();

            RegisterApi(GlobalConfiguration.Configuration);
            RegisterGlobalFilters(GlobalFilters.Filters);
            RegisterRoutes(RouteTable.Routes);
            RegisterBundles(BundleTable.Bundles);

        }

        /// <summary>
        /// Registers bundles.
        /// </summary>
        /// <param name="bundles">Bundles.</param>
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new StyleBundle("~/css/app").Include(
                "~/Assets/css/Normalize.css",
                "~/Assets/css/font-awesome.min.css",
                "~/Assets/css/Main.css",
                "~/Assets/css/Responsive.css"
            ));

            bundles.Add(new ScriptBundle("~/js/app").Include(
                "~/Assets/js/jquery-1.10.2.min.js",
                "~/Assets/js/App.js",
                "~/Assets/js/Views/Main.js"
            ));

            BundleTable.EnableOptimizations = true;
        }
        
        /// <summary>
        /// Registers routes.
        /// </summary>
        /// <param name="routes">Routes.</param>
        public static void RegisterRoutes(RouteCollection routes)
        {
            string allLanguages = string.Empty;
            string defaultLanguageCulture = string.Empty;
            Volga.Configuration.ConfigurationFile config = Volga.Configuration.ConfigurationFile.Open();

            defaultLanguageCulture = config.Localization.Languages.GetDefault().CultureName;
            allLanguages = string.Join("|", config.Localization.Languages.OfType<Volga.Configuration.CultureConfiguration>().Select(c => string.Format("({0})|({1})", c.Shortcut, c.CultureName)));

            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            // Testing error reporting.
            routes.Add("Throw", new Volga.Mvc.InternationalRoute("_debug/throw",
                new { controller = "Home", action = "Throw", language = defaultLanguageCulture }));

            // Route for errors
            routes.Add("Errors", new Volga.Mvc.InternationalRoute("error/{id}",
                new { controller = "Error", action = "Details", language = defaultLanguageCulture }));

            // Route for localization
            routes.Add("Localization", new Volga.Mvc.InternationalRoute("{language}/{controller}/{action}/{id}",
                new { controller = "Home", action = "Index", language = defaultLanguageCulture, id = UrlParameter.Optional },
                new { language = allLanguages }));

            routes.Add("Default", new Volga.Mvc.LowercaseRoute("{controller}/{action}/{id}",
                new { controller = "Home", action = "Index", id = UrlParameter.Optional }));

        }

        /// <summary>
        /// Registers global filters.
        /// </summary>
        /// <param name="filters">Filters.</param>
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new LogErrorAttribute());
            filters.Add(new HandleErrorAttribute());
        }

        /// <summary>
        /// Registers web API.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public static void RegisterApi(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "ServicesGetAssociations",
                routeTemplate: "api/compare",
                defaults: new { controller = "Associate", action = "ReceiveAssociations" }
            );

            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );

            config.Filters.Add(new ApiLogErrorAttribute());

            #if DEBUG
            ServicePointManager.ServerCertificateValidationCallback = (sender, certificate, chain, errors) =>
            {
                if (errors == SslPolicyErrors.None)
                    return true;

                var request = sender as HttpWebRequest;

                if (request != null)
                    return request.RequestUri.Host.IndexOf("spritesapp.com", System.StringComparison.OrdinalIgnoreCase) >= 0;

                return false;
            };
            #endif
        }

        /// <summary>
        /// Handles application "PostReleaseRequestState" event.
        /// </summary>
        /// <param name="sender">Event sender.</param>
        /// <param name="e">Event arguments.</param>
        protected void Application_PostReleaseRequestState(object sender, System.EventArgs e)
        {
            System.Web.HttpApplication app = sender as System.Web.HttpApplication;

            if (Volga.Services.Streaming.ResponseFilterChain.CanApply(app.Request) && Ifly.Utils.Input.CanApplyFilterChain(app.Request, app.Response))
                app.Response.Filter = new Volga.Services.Streaming.ResponseFilterChain(app.Context, app.Response.Filter);
        }
    }
}