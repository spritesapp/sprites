using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents help topic search result set.
    /// </summary>
    public class HelpTopicSearchResultSet
    {
        /// <summary>
        /// Gets or sets the search results.
        /// </summary>
        public IList<HelpTopicSearchResult> Results { get; set; }

        /// <summary>
        /// Gets or sets the total number of results available.
        /// </summary>
        public int Total { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public HelpTopicSearchResultSet()
        {
            this.Results = new List<HelpTopicSearchResult>();
        }
    }
}
