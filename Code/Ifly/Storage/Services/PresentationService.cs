using System.Collections.Generic;

namespace Ifly.Storage.Services
{
    /// <summary>
    /// Represents a presentation data service.
    /// </summary>
    public class PresentationService :
        DataService<Presentation, Repositories.IPresentationRepository>, IPresentationService
    {
        /// <summary>
        /// Returns the presentation descriptors for a given user.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <returns>Presentation descriptors.</returns>
        public IList<PresentationRecordDescriptor> GetPresentationsByUser(int userId)
        {
            IList<PresentationRecordDescriptor> ret = new List<PresentationRecordDescriptor>();

            if (userId > 0)
            {
                using (var repo = base.OpenRespository())
                    ret = repo.GetPresentationsByUser(userId);
            }

            return ret;
        }
    }
}
