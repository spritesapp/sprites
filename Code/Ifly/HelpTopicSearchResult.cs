using System;

namespace Ifly
{
    /// <summary>
    /// Represents a help topic search result.
    /// </summary>
    public class HelpTopicSearchResult
    {
        /// <summary>
        /// Gets or sets the topic Id.
        /// </summary>
        public int TopicId { get; set; }

        /// <summary>
        /// Gets or sets the topic reference key.
        /// </summary>
        public string TopicReferenceKey { get; set; }

        /// <summary>
        /// Gets or sets the search result title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the search result summary.
        /// </summary>
        public string Summary { get; set; }
    }
}
