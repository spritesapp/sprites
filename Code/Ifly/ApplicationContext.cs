using System.Web;
using System.Web.Security;
using Ifly.Storage.Repositories;
using System.Configuration;

namespace Ifly
{
    /// <summary>
    /// Represents an application context.
    /// </summary>
    public class ApplicationContext
    {
        private static readonly object _lock;

        /// <summary>
        /// Gets or sets the currently authenticated user.
        /// </summary>
        public virtual User User
        {
            get
            {
                User ret = null;
                bool hasDatabase = false;
                string requestUser = "Ifly.User";

                System.Action tryFillUser = () =>
                {
                    using (var repo = Resolver.Resolve<IUserRepository>())
                        HttpContext.Current.Items[requestUser] = repo.SelectByExternalId(HttpContext.Current.User.Identity.Name);
                };

                if (HttpContext.Current != null)
                {
                    if (HttpContext.Current.User != null)
                    {
                        if (HttpContext.Current.Items[requestUser] == null)
                        {
                            if (Utils.DemoPrincipal.IsDemo(HttpContext.Current.User))
                                HttpContext.Current.Items[requestUser] = Utils.DemoPrincipal.CreateDemoUser();
                            else
                            {
                                if ((hasDatabase = ConfigurationManager.ConnectionStrings["Main"] != null))
                                    tryFillUser();

                                if (HttpContext.Current.Items[requestUser] == null && !string.IsNullOrWhiteSpace(HttpContext.Current.User.Identity.Name) && hasDatabase)
                                {
                                    System.Threading.Thread.Sleep(1000);
                                    tryFillUser();
                                }
                            }
                        }
                    }

                    ret = HttpContext.Current.Items[requestUser] as User;
                }

                return ret;
            }
            set { HttpContext.Current.Items["Ifly.User"] = value; }
        }

        /// <summary>
        /// Gets application instance Id.
        /// </summary>
        public string InstanceId { get; private set; }

        /// <summary>
        /// Gets or sets the current application context.
        /// </summary>
        public static ApplicationContext Current { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static ApplicationContext()
        {
            _lock = new object();
            Current = new ApplicationContext();
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public ApplicationContext() 
        {
            InstanceId = System.DateTime.UtcNow.Ticks.ToString();
        }

        /// <summary>
        /// Returns value indicating whether the given feature is enabled.
        /// </summary>
        /// <param name="feature">Feature.</param>
        /// <returns>Value indicating whether the given feature is enabled.</returns>
        public bool IsFeatureEnabled(string feature)
        {
            bool ret = true;
            string v = ConfigurationManager.AppSettings["Ifly.Feature." + feature];

            if (!string.IsNullOrEmpty(v))
            {
                ret = string.Compare(v, "true", true) == 0 ||
                    string.Compare(v, "1", true) == 0 ||
                    string.Compare(v, "on", true) == 0 ||
                    string.Compare(v, "yes", true) == 0;
            }

            return ret;
        }

        /// <summary>
        /// Returns an object used to synchronize access to various resources from multiple threads.
        /// </summary>
        /// <returns>An object used to synchronize access to various resources from multiple threads.</returns>
        public virtual object GetSynchronizationObject()
        {
            return _lock;
        }
    }
}
