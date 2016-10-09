using System.Collections.Generic;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents a presentation repository.
    /// </summary>
    public interface IPresentationRepository : IRepository<Presentation>, IDependency
    {
        /// <summary>
        /// Returns the presentation descriptors for a given user.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <returns>Presentation descriptors.</returns>
        IList<PresentationRecordDescriptor> GetPresentationsByUser(int userId);
    }
}
