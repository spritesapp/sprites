using Microsoft.Web.WebPages.OAuth;
using System.Linq;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using System.Collections.Generic;
using Ifly.QueueService;
using Ifly.Web.Common.Filters;

namespace Ifly.Web
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

            RegisterGlobalFilters(GlobalFilters.Filters);
            RegisterRoutes(RouteTable.Routes);
            RegisterBundles(BundleTable.Bundles);
            RegisterOAuth();
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
        /// Registers bundles.
        /// </summary>
        /// <param name="bundles">Bundles.</param>
        public static void RegisterBundles(BundleCollection bundles)
        {
            // Basic (global) styles
            bundles.Add(new StyleBundle("~/css/basic").Include(
                "~/Assets/css/Normalize.css",
                "~/Assets/css/font-awesome.min.css",
                "~/Assets/css/Main.css",
                "~/Assets/css/Responsive.css"
            ));

            // Basic (global) functionality
            bundles.Add(new ScriptBundle("~/js/basic").Include(
                "~/Assets/js/jquery-1.10.2.min.js",
                "~/Assets/js/paypal-button.min.js",
                "~/Assets/js/App.js"
            ));

            // Account-related functionality
            bundles.Add(new ScriptBundle("~/js/views/account").Include(
                "~/Assets/js/Views/Account/Login.js",
                "~/Assets/js/Views/Account/AccountDetails.js",
                "~/Assets/js/Views/Account/PaymentMethodModal.js",
                "~/Assets/js/Views/Account/FeedbackModal.js"
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

            routes.Add("AuthorizeApiAccess", new Volga.Mvc.LowercaseRoute("oauth/{provider}/token",
                new { controller = "OAuth", action = "Authorize" }));

            routes.Add("EnsureApiAccess", new Volga.Mvc.LowercaseRoute("oauth/{provider}/ensure",
                new { controller = "OAuth", action = "EnsureAuthorization" }));

            routes.Add("CheckApiAccess", new Volga.Mvc.LowercaseRoute("oauth/{provider}/status",
                new { controller = "OAuth", action = "CheckAuthorizationStatus" }));

            routes.Add("Rss", new Volga.Mvc.LowercaseRoute("rss",
                new { controller = "Home", action = "RssFeed" }));

            routes.Add("DataRss", new Volga.Mvc.LowercaseRoute("data/rss",
                new { controller = "Home", action = "RssFeed" }));

            routes.Add("Login", new Volga.Mvc.LowercaseRoute("login",
                new { controller = "Account", action = "Login" }));

            routes.Add("Logout", new Volga.Mvc.LowercaseRoute("logout",
                new { controller = "Account", action = "Logout" }));

            routes.Add("AccountDetails", new Volga.Mvc.LowercaseRoute("account",
                new { controller = "Account", action = "Details" }));

            routes.Add("AccountPaymentInformation", new Volga.Mvc.LowercaseRoute("account/payment-information",
                new { controller = "Account", action = "GetPaymentInformation" }));

            routes.Add("AccountOnPayPalPaymentApplied", new Volga.Mvc.LowercaseRoute("account/paid-with-paypal",
                new { controller = "Account", action = "OnPayPalPaymentApplied" }));

            routes.Add("Features", new Volga.Mvc.LowercaseRoute("features",
                new { controller = "Home", action = "Features" }));

            routes.Add("FeaturesDetailed", new Volga.Mvc.LowercaseRoute("features/detailed",
                new { controller = "Home", action = "FeaturesDetailed" }));

            routes.Add("Examples", new Volga.Mvc.LowercaseRoute("examples",
                new { controller = "Home", action = "Examples" }));

            routes.Add("Contact", new Volga.Mvc.LowercaseRoute("contact",
                new { controller = "Home", action = "Contact" }));

            routes.Add("Pricing", new Volga.Mvc.LowercaseRoute("pricing",
               new { controller = "Home", action = "Pricing" }));

            routes.Add("PricingFAQ", new Volga.Mvc.LowercaseRoute("pricing/faq",
                new { controller = "Home", action = "PricingFAQ" }));

            routes.Add("Team", new Volga.Mvc.LowercaseRoute("team",
               new { controller = "Home", action = "Team" }));

            routes.Add("Testimonials", new Volga.Mvc.LowercaseRoute("testimonials",
               new { controller = "Home", action = "Testimonials" }));

            routes.Add("SignUp", new Volga.Mvc.LowercaseRoute("signup",
               new { controller = "Home", action = "SignUp" }));

            routes.Add("Intro", new Volga.Mvc.LowercaseRoute("intro",
               new { controller = "Home", action = "Intro" }));

            routes.Add("Video", new Volga.Mvc.LowercaseRoute("video",
               new { controller = "Home", action = "Video" }));

            routes.Add("ValidateEmail", new Volga.Mvc.LowercaseRoute("pre-update-email",
               new { controller = "Account", action = "ValidateEmail" }));

            routes.Add("ConfirmEmail", new Volga.Mvc.LowercaseRoute("validate-email",
               new { controller = "Account", action = "ConfirmEmail" }));

            routes.Add("ChangePassword", new Volga.Mvc.LowercaseRoute("change-password",
               new { controller = "Account", action = "ChangePassword" }));

            routes.Add("ConfirmPresentationSharing", new Volga.Mvc.LowercaseRoute("confirm-sharing",
               new { controller = "Account", action = "ConfirmPresentationSharing" }));

            routes.Add("PrivacyPolicy", new Volga.Mvc.LowercaseRoute("privacy",
               new { controller = "Legal", action = "PrivacyPolicy" }));

            routes.Add("TermsOfService", new Volga.Mvc.LowercaseRoute("tos",
               new { controller = "Legal", action = "TermsOfService" }));

            routes.Add("TermsOfService2", new Volga.Mvc.LowercaseRoute("terms",
               new { controller = "Legal", action = "TermsOfService" }));

            routes.Add("SubscribeToNewsletter", new Volga.Mvc.LowercaseRoute("newsletter-subscribe",
               new { controller = "Account", action = "SubscribeToNewsletter" }));

            routes.Add("AccountSignInGoogle", new Volga.Mvc.LowercaseRoute("signin-google",
               new { controller = "Account", action = "Authenticated" }));

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
        /// Handles application errors.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void Application_Error(object sender, System.EventArgs e)
        {
            LogErrorAttribute.Log(Server.GetLastError());
        }

        /// <summary>
        /// Registers OAuth providers.
        /// </summary>
        public static void RegisterOAuth()
        {
            OAuthWebSecurity.RegisterFacebookClient(
                appId: "521113044653315",
                appSecret: "1a269b3d873b0bb1b5f68ed9fae14899");

            OAuthWebSecurity.RegisterTwitterClient(
                consumerKey: "nH7XAt2NM1vSaZsr6VW84g",
                consumerSecret: "KdsOZIvx1Iuv8JJSc2rGFXYUwLnxKZNsOmgWc4H2OTA"
            );

            OAuthWebSecurity.RegisterGoogleClient("Sprites", new Dictionary<string, object>() 
            { 
                { "firstName", null }, 
                { "lastName", null } 
            });
        }
    }
}