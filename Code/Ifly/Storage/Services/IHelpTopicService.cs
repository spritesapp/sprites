using System.Collections.Generic;

namespace Ifly.Storage.Services
{
    /// <summary>
    /// Represents a help topic service.
    /// </summary>
    public interface IHelpTopicService : IDataService<HelpTopic>, IDependency
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
        HelpTopic ReadByReferenceKey(string referenceKey);

        /// <summary>
        /// Changes the score of a given topic in favor of it being helpful.
        /// </summary>
        /// <param name="id">Help topic Id.</param>
        /// <returns>Updated score.</returns>
        HelpTopicScore VoteHelpful(int id);

        /// <summary>
        /// Changes the score of a given topic in favor of it being unhelpful.
        /// </summary>
        /// <param name="id">Help topic Id.</param>
        /// <returns>Updated score.</returns>
        HelpTopicScore VoteUnhelpful(int id);
    }
}
