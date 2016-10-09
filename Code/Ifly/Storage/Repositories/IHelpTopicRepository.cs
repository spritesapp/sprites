using System.Collections.Generic;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents a help topic repository.
    /// </summary>
    public interface IHelpTopicRepository : IRepository<HelpTopic>, IDependency
    {
        /// <summary>
        /// Searches among all help topics by the given search term.
        /// </summary>
        /// <param name="term">Search term.</param>
        /// <param name="offset">Zero-based offset of the matching record.</param>
        /// <param name="amount">Amount of matching records to return.</param>
        /// <returns>Matching help topics.</returns>
        HelpTopicSearchResultSet Search(string term, int offset = 0, int amount = 20);

        /// <summary>
        /// Returns a help topic with the given reference key.
        /// </summary>
        /// <param name="referenceKey">Reference key.</param>
        /// <returns>Help topic.</returns>
        HelpTopic SelectByReferenceKey(string referenceKey);
    }
}
