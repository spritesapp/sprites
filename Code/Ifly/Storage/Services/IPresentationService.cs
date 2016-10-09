using System.Collections.Generic;

namespace Ifly.Storage.Services
{
    /// <summary>
    /// Represents a presentation data service.
    /// </summary>
    public interface IPresentationService : IDataService<Presentation>, IDependency
    {
        /// <summary>
        /// Returns the presentation descriptors for a given user.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <returns>Presentation descriptors.</returns>
        IList<PresentationRecordDescriptor> GetPresentationsByUser(int userId);    
    }
}
