using Ifly.Storage.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ifly.Media
{
    /// <summary>
    /// Represents media item repository.
    /// </summary>
    public interface IMediaItemRepository : IRepository<MediaItem>, IDependency
    {
        /// <summary>
        /// Returns all media items that were created by the given user.
        /// </summary>
        /// <param name="userId">User Id. If omitted, the Id of the current user will be used.</param>
        /// <returns>Media items.</returns>
        IEnumerable<MediaItem> GetMediaItemsByUser(int? userId = null);
    }
}
