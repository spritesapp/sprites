using Ifly.Storage.Repositories;
using System.Collections.Generic;
using System.Linq;

namespace Ifly.Media
{
    /// <summary>
    /// Represents media item repository.
    /// </summary>
    public class MediaItemRepository : RavenRepository<MediaItem>, IMediaItemRepository
    {
        /// <summary>
        /// Returns all media items that were created by the given user.
        /// </summary>
        /// <param name="userId">User Id. If omitted, the Id of the current user will be used.</param>
        /// <returns>Media items.</returns>
        public IEnumerable<MediaItem> GetMediaItemsByUser(int? userId = null)
        {
            IEnumerable<MediaItem> ret = Enumerable.Empty<MediaItem>();

            userId = EnsureUserId(userId);

            if (userId.HasValue)
            {
                ret = this.Query().Where(item => item.UserId == userId.Value)
                    .OrderByDescending(item => item.Created).ToList();
            }

            return ret;
        }

        /// <summary>
        /// Ensures user Id.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <returns>Id.</returns>
        private int? EnsureUserId(int? userId = null)
        {
            int id = 0;
            int? ret = null;
            UserSubscription subscription = null;
            User u = Ifly.ApplicationContext.Current.User;

            if (!userId.HasValue)
            {
                if (u != null)
                {
                    id = u.Id;
                    subscription = u.Subscription;
                }
            }
            else
                id = userId.Value;

            if (id > 0)
            {
                if (subscription == null)
                {
                    if (u != null && id == u.Id)
                        subscription = u.Subscription;
                }

                if (subscription == null)
                {
                    using (var repo = Resolver.Resolve<IUserRepository>())
                        u = repo.Select(id);

                    if (u != null)
                        subscription = u.Subscription;
                }

                if (subscription != null)
                    ret = id;
            }

            return ret;
        }
    }
}
