using System.Collections.Generic;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents presentation sharing repository.
    /// </summary>
    public interface IPresentationSharingRepository : IRepository<PresentationSharing>, IDependency
    {
        /// <summary>
        /// Returns a mapping between each user presentation and the sharing status of it.
        /// </summary>
        /// <param name="userId">User Id. If omitted, the Id of the current user will be used.</param>
        /// <returns>Sharing status.</returns>
        IDictionary<int, PresentationSharingStatus> GetSharingStatusByUser(int? userId = null);

        /// <summary>
        /// Returns a list of all presentations that are shared with the given user.
        /// </summary>
        /// <param name="userId">User Id. If omitted, the Id of the current user will be used.</param>
        /// <returns>A list of all presentations that are shared with the given (current) user.</returns>
        IEnumerable<PresentationRecordDescriptor> GetPresentationsSharedWithUser(int? userId = null);

        /// <summary>
        /// Returns value indicating whether the given presentation is shared with the given (current) user.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="userId">User Id. If omitted, the Id of the current user will be used.</param>
        /// <returns>Value indicating whether the given presentation is shared with the given (current) user.</returns>
        bool IsSharedWithUser(int presentationId, int? userId = null);

        /// <summary>
        /// Updates sharing status.
        /// </summary>
        /// <param name="status">Status.</param>
        /// <returns>Update result.</returns>
        PresentationSharingUpdateResult UpdateSharingStatus(PresentationSharingStatus status);
    }
}
