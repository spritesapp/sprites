using Ifly.QueueService;
using System;
using System.Collections.Specialized;
using System.Web;
using System.Web.Mvc;

namespace Ifly.Web.Controllers
{
    /// <summary>
    /// Represents a home controller.
    /// </summary>
    [Authorize]
    public class HomeController : Controller
    {
        /// <summary>
        /// Throws a test exception.
        /// </summary>
        /// <returns>Action result.</returns>
        [AllowAnonymous]
        public ActionResult Throw()
        {
            throw new System.Exception("You've asked for it...");
        }

        /// <summary>
        /// Returns the RSS feed.
        /// </summary>
        /// <returns>RSS feed.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult RssFeed()
        {
            return RedirectPermanent("http://blog.spritesapp.com/feed.xml");
        }

        /// <summary>
        /// Returns the result of a default action.
        /// </summary>
        /// <returns>Result.</returns>
        [AllowAnonymous]
        public ActionResult Index()
        {
            Uri referer = null;
            ActionResult ret = null;
            string referrerRaw = Request.Headers["Referer"];

            Func<Uri, string> getReturnUrl = (r) =>
             {
                 string result = "/edit";
                 NameValueCollection query = null;

                 if (!string.IsNullOrEmpty(r.Query))
                 {
                     query = HttpUtility.ParseQueryString(r.Query);
                     if (!string.IsNullOrEmpty(query["ReturnUrl"]))
                     {
                         result = query["ReturnUrl"];

                         if (!result.StartsWith("/"))
                             result = "/" + result;
                     }
                 }

                 return result;
             };

            Func<Uri, bool> isRedirectedFromLogin = (r) =>
                {
                    return string.Compare(Request.Url.Host, r.Host, StringComparison.OrdinalIgnoreCase) == 0 &&
                    string.Compare(r.AbsolutePath, "/login", StringComparison.OrdinalIgnoreCase) == 0;
                };

            Func<Uri, bool> isAuthenticatedWithTwitter = (r) =>
                {
                    return r.AbsoluteUri.IndexOf("twitter.com/oauth/authenticate", StringComparison.OrdinalIgnoreCase) >= 0;
                };

            if (Uri.TryCreate(referrerRaw, UriKind.Absolute, out referer) && ApplicationContext.Current.User != null)
            {
                if (isRedirectedFromLogin(referer) || isAuthenticatedWithTwitter(referer))
                    ret = Redirect(getReturnUrl(referer));
            }

            if (ret == null)
                ret = View();

            return ret;
        }

        /// <summary>
        /// Serves the "Features" page.
        /// </summary>
        /// <returns>View result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Features()
        {
            return View();
        }

        /// <summary>
        /// Serves the "Features -> Detailed" page.
        /// </summary>
        /// <returns>View result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult FeaturesDetailed()
        {
            return View();
        }

        /// <summary>
        /// Serves the "Examples" page.
        /// </summary>
        /// <returns>View result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Examples()
        {
            return View();
        }

        /// <summary>
        /// Serves the "Contact" page.
        /// </summary>
        /// <returns>View result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Contact()
        {
            return View();
        }

        /// <summary>
        /// Serves the "Pricing" page.
        /// </summary>
        /// <returns>View result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Pricing()
        {
            return View();
        }

        /// <summary>
        /// Serves the "Pricing -> FAQ" page.
        /// </summary>
        /// <returns>View result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult PricingFAQ()
        {
            return View();
        }

        /// <summary>
        /// Serves the "Team" page.
        /// </summary>
        /// <returns>View result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Team()
        {
            return Redirect("/");
        }

        /// <summary>
        /// Serves the "Testimonials" page.
        /// </summary>
        /// <returns>View result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Testimonials()
        {
            return View();
        }

        /// <summary>
        /// Opens a sign-up form.
        /// </summary>
        /// <returns>Action result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult SignUp()
        {
            return View();
        }

        /// <summary>
        /// Opens an intro video.
        /// </summary>
        /// <returns>Action result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Intro()
        {
            return View();
        }

        /// <summary>
        /// Opens an intro video.
        /// </summary>
        /// <returns>Action result.</returns>
        [HttpGet]
        [AllowAnonymous]
        public ActionResult Video()
        {
            return View();
        }

        /// <summary>
        /// Submits a feedback message.
        /// </summary>
        /// <param name="message">Message.</param>
        [HttpPost]
        [AllowAnonymous]
        public void Contact(Models.FeedbackMessage message)
        {
            string name = string.Empty;
            string email = string.Empty;

            if (message != null && !string.IsNullOrWhiteSpace(message.Text))
            {
                name = !string.IsNullOrWhiteSpace(message.Name) ? message.Name : "Anonymous";
                email = !string.IsNullOrWhiteSpace(message.Email) ? message.Email : "-";

                MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                {
                    Id = Guid.NewGuid().ToString(),
                    Subject = string.Format("Howdy! {0} & Pavel (Sprites)", name),
                    Body = string.Format("{0}\n\n--\n\"{1}\" <{2}> #{3}", 
                            HttpUtility.HtmlDecode(message.Text),
                            name, 
                            email,
                            Ifly.ApplicationContext.Current != null &&
                            Ifly.ApplicationContext.Current.User != null ?
                            Ifly.ApplicationContext.Current.User.Id :
                            -1
                        )
                }});
            }
        }
    }
}
