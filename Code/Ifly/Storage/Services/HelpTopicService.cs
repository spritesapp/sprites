using System.Collections.Generic;
using System.Linq;

namespace Ifly.Storage.Services
{
    /// <summary>
    /// Represents a help topic service.
    /// </summary>
    public class HelpTopicService :
        DataService<HelpTopic, Repositories.IHelpTopicRepository>, IHelpTopicService
    {
        /// <summary>
        /// Searches among all help topics by the given search term.
        /// </summary>
        /// <param name="term">Search term.</param>
        /// <param name="offset">Zero-based offset of the matching record.</param>
        /// <param name="amount">Amount of matching records to return.</param>
        /// <returns>Matching help topics.</returns>
        public HelpTopicSearchResultSet Search(string term, int offset = 0, int amount = 20)
        {
            HelpTopicSearchResultSet ret = new HelpTopicSearchResultSet();

            using (var repo = base.OpenRespository())
                ret = repo.Search(term, offset, amount);

            return ret;
        }

        /// <summary>
        /// Returns a help topic with the given reference key.
        /// </summary>
        /// <param name="referenceKey">Reference key.</param>
        /// <returns>Help topic.</returns>
        public HelpTopic ReadByReferenceKey(string referenceKey)
        {
            HelpTopic ret = null;

            using (var repo = base.OpenRespository())
                ret = repo.SelectByReferenceKey(referenceKey);

            return ret;
        }

        /// <summary>
        /// Changes the score of a given topic in favor of it being helpful.
        /// </summary>
        /// <param name="id">Help topic Id.</param>
        /// <returns>Updated score.</returns>
        public HelpTopicScore VoteHelpful(int id)
        {
            return ChangeScore(id, 1);
        }

        /// <summary>
        /// Changes the score of a given topic in favor of it being unhelpful.
        /// </summary>
        /// <param name="id">Help topic Id.</param>
        /// <returns>Updated score.</returns>
        public HelpTopicScore VoteUnhelpful(int id)
        {
            return ChangeScore(id, -1);
        }

        /// <summary>
        /// Changes the score of a given topic.
        /// </summary>
        /// <param name="id">Topic Id.</param>
        /// <param name="delta">Score delta.</param>
        /// <returns>Updated score.</returns>
        private HelpTopicScore ChangeScore(int id, int delta)
        {
            HelpTopic topic = null;
            HelpTopicScore ret = null;

            using (var repo = base.OpenRespository())
            {
                topic = repo.Select(id);

                if (topic != null)
                {
                    if (topic.Score == null)
                        topic.Score = new HelpTopicScore();

                    if (delta > 0)
                        topic.Score.Positive++;
                    else
                        topic.Score.Negative++;

                    repo.Update(topic);

                    ret = topic.Score;
                }
            }

            return ret;
        }
    }
}
