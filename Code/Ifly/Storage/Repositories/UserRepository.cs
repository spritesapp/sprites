using System.Collections.Generic;
using System.Linq;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents a user repository.
    /// </summary>
    public class UserRepository : RavenRepository<User>, IUserRepository
    {
        /// <summary>
        /// Selects the given user by the external Id.
        /// </summary>
        /// <param name="externalId">External Id.</param>
        /// <returns>User.</returns>
        public User SelectByExternalId(string externalId)
        {
            return !string.IsNullOrEmpty(externalId) ? 
                base.Session.Query<User>().Where(u => u.ExternalId == externalId).FirstOrDefault() : 
                null;
        }
    }
}
