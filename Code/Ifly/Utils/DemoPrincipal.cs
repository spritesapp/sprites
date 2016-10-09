using System;
using System.Security.Principal;

namespace Ifly.Utils
{
    /// <summary>
    /// Represents a demo principal.
    /// </summary>
    public class DemoPrincipal : IPrincipal
    {
        private readonly IIdentity _identity;
        private const string DemoUserName = "Demo user";

        /// <summary>
        /// Gets the identity.
        /// </summary>
        public IIdentity Identity
        {
            get { return _identity; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="identity">Identity.</param>
        public DemoPrincipal(IIdentity identity)
        {
            _identity = identity;
        }

        /// <summary>
        /// Returns value indicating whether user is in a given role.
        /// </summary>
        /// <param name="role">Role to check.</param>
        /// <returns>Value indicating whether user is in a given role.</returns>
        public bool IsInRole(string role)
        {
            return string.Compare(role, "Demo", StringComparison.OrdinalIgnoreCase) == 0;
        }

        /// <summary>
        /// Returns value indicating whether the given user principal represents a demo user.
        /// </summary>
        /// <param name="principal">User principal.</param>
        /// <returns>Value indicating whether the given user principal represents a demo user.</returns>
        public static bool IsDemo(IPrincipal principal)
        {
            // OMG this is sooo ugly. But our DemoPrincipal doesn't survive app redirect... Will fix this later (hopefully).
            return principal != null && (principal is DemoPrincipal || (principal.Identity != null &&
                string.Compare(principal.Identity.Name, DemoUserName, System.StringComparison.OrdinalIgnoreCase) == 0));
        }

        /// <summary>
        /// Returns value indicating whether the given user is a demo user.
        /// </summary>
        /// <param name="user">User.</param>
        /// <returns>Value indicating whether the given user is a demo user.</returns>
        public static bool IsDemo(User user)
        {
            return user != null && user.Id == CreateDemoUser().Id;
        }

        /// <summary>
        /// Creates new demo user.
        /// </summary>
        /// <returns>Demo user.</returns>
        public static User CreateDemoUser()
        {
            return new User()
            {
                Id = 31337,
                ExternalId = string.Empty,
                Name = DemoUserName,
                Subscription = new UserSubscription()
                {
                    RenewedTo = SubscriptionType.Pro,
                    RenewedToDuration = SubscriptionDuration.OneMonth,
                    Renewed = DateTime.Now.AddYears(2)
                }
            };
        }

        /// <summary>
        /// Creates new demo principal.
        /// </summary>
        /// <returns>Demo principal.</returns>
        public static DemoPrincipal CreateDemoPrincipal()
        {
            return new DemoPrincipal(new GenericIdentity(DemoUserName, "Demo"));
        }
    }
}
