using Ifly.Web.Editor.Api;
using System;
using System.Configuration;
using System.Reflection;
using System.Web;
using System.Linq;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Web.SessionState;
using System.Net;
using System.Diagnostics;
using Ifly.Web.Common.Filters;

namespace Ifly.Web.Editor
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
        
        /// <summary>
        /// Handles application errors.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Application_Error(object sender, System.EventArgs e)
        {
            LogErrorAttribute.Log(Server.GetLastError());
        }

        /// <summary>
        /// Registers bundles.
        /// </summary>
        /// <param name="bundles">Bundles.</param>
        public static void RegisterBundles(BundleCollection bundles)
        {
            // Basic (global) styles
            bundles.Add(new StyleBundle("~/css/normalize").Include(
                "~/Assets/css/Normalize.css",
                "~/Assets/css/font-awesome.min.css",
                "~/Assets/css/jqvmap.css",
                "~/Assets/css/nanoscroller.css"
            ));

            // App styles
            bundles.Add(new StyleBundle("~/css/app").Include(
                "~/Assets/css/color-picker.min.css",
                "~/Assets/css/Main.css",
                "~/Assets/css/UI.css"
            ));

            // Styles requires for displaying infographics on the client
            bundles.Add(new StyleBundle("~/css/embed").Include(
                "~/Assets/css/Embed/Infographic.css",
                "~/Assets/css/Embed/Themes.css",
                "~/Assets/css/Embed/Player.css"
            ));

            // Progress bars
            bundles.Add(new StyleBundle("~/css/progress").Include(
                "~/Assets/css/Progress.css"
            ));

            // View models, editor, UI
            bundles.Add(new ScriptBundle("~/js/editor").Include(
                "~/Assets/js/knockout-2.3.0.min.js",
                "~/Assets/js/sortable.min.js",
                "~/Assets/js/moment.min.js",
                "~/Assets/js/q.min.js",
                "~/Assets/js/marked.min.js",
                "~/Assets/js/color-picker.min.js",
                "~/Assets/js/jquery.nanoscroller.min.js",
                "~/Assets/js/jquery.signalR.min.js",
                "~/Assets/js/Utils/Input.js",
                "~/Assets/js/Utils/BindingHandlers.js",
                "~/Assets/js/Models/IModel.js",
                "~/Assets/js/Models/Globals.js",
                "~/Assets/js/Models/User.js",
                "~/Assets/js/Models/UserSubscription.js",
                "~/Assets/js/Models/PublishConfiguration.js",
                "~/Assets/js/Models/IntegrationSettings.js",
                "~/Assets/js/Models/PresenterModeConfiguration.js",
                "~/Assets/js/Models/Presentation.js",
                "~/Assets/js/Models/Slide.js",
                "~/Assets/js/Models/DataCell.js",
                "~/Assets/js/Models/DataTable.js",
                "~/Assets/js/Models/DataRow.js",
                "~/Assets/js/Models/DataColumn.js",
                "~/Assets/js/Models/ElementProperty.js",
                "~/Assets/js/Models/Element.js",
                "~/Assets/js/Models/MediaItem.js",
                "~/Assets/js/Models/RealtimeDataConfiguration.js",
                "~/Assets/js/Models/ImpressionSummary.js",
                "~/Assets/js/Models/PresentationSharingStatus.js",
                "~/Assets/js/Models/Generators/ElementFactory.js",
                "~/Assets/js/Models/UI/AudioRecorder.js",
                "~/Assets/js/Models/UI/Component.js",
                "~/Assets/js/Models/UI/Control.js",
                "~/Assets/js/Models/Help/HelpPanel.js",
                "~/Assets/js/Models/Help/HelpManager.js",
                "~/Assets/js/Models/UI/ThemeSelector.js",
                "~/Assets/js/Models/UI/FontSelector.js",
                "~/Assets/js/Models/UI/ColorPicker.js",
                "~/Assets/js/Models/UI/ImageSelector.js",
                "~/Assets/js/Models/UI/UserContextMenu.js",
                "~/Assets/js/Models/UI/SlideManager.js",
                "~/Assets/js/Models/UI/DataTableView.js",
                "~/Assets/js/Models/UI/ModalForm.js",
                "~/Assets/js/Models/UI/PresentationSettingsModal.js",
                "~/Assets/js/Models/UI/SlideSettingsModal.js",
                "~/Assets/js/Models/UI/IconSelectorModal.js",
                "~/Assets/js/Models/UI/DataSourceSettingsModal.js",
                "~/Assets/js/Models/UI/MapAnnotationsModal.js",
                "~/Assets/js/Models/UI/ProgressBarsModal.js",
                "~/Assets/js/Models/UI/TimelineItemsModal.js",
                "~/Assets/js/Models/UI/CodeEditorModal.js",
                "~/Assets/js/Models/UI/PresentationStatsModal.js",
                "~/Assets/js/Models/UI/PublishSettingsModal.js",
                "~/Assets/js/Models/UI/ElementLinkModal.js",
                "~/Assets/js/Models/UI/GalleryManager.js",
                "~/Assets/js/Models/UI/ElementPropertiesPanel.js",
                "~/Assets/js/Models/UI/CompositionManager.js",
                "~/Assets/js/Models/UI/PublishManager.js",
                "~/Assets/js/Models/UI/ChatManager.js",
                "~/Assets/js/Models/UI/CollaborativeEditsManager.js",
                "~/Assets/js/Models/UI/CollaborationManager.js",
                "~/Assets/js/Models/UI/RichTextEditor.js",
                "~/Assets/js/Models/UI/CodeEditor.js",
                "~/Assets/js/Models/UI/ThemeManager.js",
                "~/Assets/js/Models/UI/DataImportModal.js",
                "~/Assets/js/Models/UI/FeedbackModal.js",
                "~/Assets/js/Models/UI/CloneSlideModal.js",
                "~/Assets/js/Models/UI/ClonePresentationModal.js",
                "~/Assets/js/Models/UI/ShortcutModal.js",
                "~/Assets/js/Models/UI/RealtimeDataModal.js",
                "~/Assets/js/Models/UI/CollaboratorEditModal.js",
                "~/Assets/js/Models/UI/TemplateManager.js",
                "~/Assets/js/Models/UI/TemplateSelector.js",
                "~/Assets/js/Models/UI/MediaSelectorModal.js",
                "~/Assets/js/Models/UI/ThemeBuilderModal.js",
                "~/Assets/js/Models/UI/VoiceOverEditModal.js",
                "~/Assets/js/Editor.js"
            ));

            // Basic (global) functionality
            bundles.Add(new ScriptBundle("~/js/app").Include(
                "~/Assets/js/jquery-1.10.2.min.js",
                "~/Assets/js/Utils/ScriptLoader.js",
                "~/Assets/js/Utils/FontLoader.js",
                "~/Assets/js/Models/Charts/GoogleChartsProvider.js",
                "~/Assets/js/App.js"
            ));

            // Scripts requires for displaying infographics on the client
            bundles.Add(new ScriptBundle("~/js/embed").Include(
                "~/Assets/js/Models/Globals.js",
                "~/Assets/js/Models/Embed/Infographic.js",
                "~/Assets/js/Models/Embed/Player.js",
                "~/Assets/js/Utils/Converters.js",
                "~/Assets/js/Utils/Input.js"
            ));

            // Scripts for jqvmap (geo map)
            bundles.Add(new ScriptBundle("~/js/jqvmap").Include(
                "~/Assets/js/jquery-jvectormap/jquery-jvectormap-1.2.2.min.js",
                "~/Assets/js/jquery-jvectormap/maps/jquery-jvectormap-europe-mill-en.js",
                "~/Assets/js/jquery-jvectormap/maps/jquery-jvectormap-us-mill-en.js",
                "~/Assets/js/jquery-jvectormap/maps/jquery-jvectormap-world-mill-en.js",
                "~/Assets/js/jquery-jvectormap/maps/jquery-jvectormap-canada-mill-en.js",
                "~/Assets/js/jquery-jvectormap/maps/jquery-jvectormap-france-mill-en.js",
                "~/Assets/js/jquery-jvectormap/maps/jquery-jvectormap-germany-mill-en.js",
                "~/Assets/js/jquery-jvectormap/maps/jquery-jvectormap-india-mill-en.js",
                "~/Assets/js/jquery-jvectormap/maps/jquery-jvectormap-italy-mill-en.js"
            ));

            // Scripts for charts (chart.js)
            bundles.Add(new ScriptBundle("~/js/charts").Include(
                "~/Assets/js/charts/chart.min.js"
            ));

            // Scripts for code editor (Ace)
            bundles.Add(new ScriptBundle("~/js/code-editor").Include(
                "~/Assets/js/ace-editor/ace.js",
                "~/Assets/js/ace-editor/mode-javascript.js",
                "~/Assets/js/ace-editor/theme-xcode.js",
                "~/Assets/js/ace-editor/worker-javascript.js"
            ));

            // Help pane components
            bundles.Add(new ScriptBundle("~/js/editor/help").Include(
                "~/Assets/js/Models/Help/HelpTopicScore.js",
                "~/Assets/js/Models/Help/HelpTopicMediaItem.js",
                "~/Assets/js/Models/Help/HelpTopic.js",
                "~/Assets/js/Models/Help/HelpTopicSearchResult.js",
                "~/Assets/js/Models/Help/HelpTopicSearchResultSet.js",
                "~/Assets/js/Models/Help/HelpService.js"
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

            // Canvas
            routes.Add("Canvas", new Volga.Mvc.InternationalRoute("canvas",
                new { controller = "Canvas", action = "Index", language = defaultLanguageCulture }));

            // Route for localization
            routes.Add("Localization", new Volga.Mvc.InternationalRoute("{language}/{controller}/{action}/{id}",
                new { controller = "Home", action = "Index", language = defaultLanguageCulture, id = UrlParameter.Optional },
                new { language = allLanguages }));

            // Download exported video
            routes.Add("DownloadExportedVideo", new Volga.Mvc.LowercaseRoute("export/video/download",
                new { controller = "VideoExportUtils", action = "DownloadExportedVideo" }));

            // Download exported image
            routes.Add("DownloadExportedImage", new Volga.Mvc.LowercaseRoute("export/image/download",
                new { controller = "ImageExportUtils", action = "DownloadExportedImage" }));

            // Routes for embedding
            routes.Add("DisplayPresentationCanvas", new Volga.Mvc.LowercaseRoute("embed/{id}/canvas",
                new { controller = "Presentation", action = "DisplayCanvas" }));

            routes.Add("DisplayPresentation", new Volga.Mvc.LowercaseRoute("embed/{id}",
                new { controller = "Presentation", action = "Display" }));

            // Custom themes (GitHub)
            routes.Add("CustomThemesGitHub", new Volga.Mvc.LowercaseRoute("css/themes/github",
                new { controller = "Themes", action = "GetGitHubBundleContents" }));

            // Custom themes (GitHub)
            routes.Add("CustomThemesUser", new Volga.Mvc.LowercaseRoute("css/themes/user",
                new { controller = "Themes", action = "GetUserBundleContents" }));

            // Default routes
            routes.Add("DefaultWithPresentation", new Volga.Mvc.LowercaseRoute("{id}",
                new { controller = "Home", action = "Details", id = UrlParameter.Optional }));

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
            Ifly.ApplicationContext.Current = new Api.Sessions.SessionBasedApplicationContext();

            // Configuring custom services.
            foreach (var service in Resolver.ResolveAll<IConfigurableServiceController>().OrderByDescending(c => c.Priority))
                service.Configure(config);

            config.Filters.Add(new ApiLogErrorAttribute());
            config.MessageHandlers.Add(new Api.Sessions.BoundedSessionAttribute());
        }
    }
}