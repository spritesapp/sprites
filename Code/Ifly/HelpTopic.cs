using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents a help topic.
    /// </summary>
    public class HelpTopic : Storage.Record
    {
        /// <summary>
        /// Gets or sets the reference key used to uniquely identify this topic from within the UI.
        /// </summary>
        public string ReferenceKey { get; set; }

        /// <summary>
        /// Gets or sets a topic score, based on user votes.
        /// </summary>
        public HelpTopicScore Score { get; set; }
        
        /// <summary>
        /// Gets or sets the topic title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the body of the help topic.
        /// </summary>
        public string Body { get; set; }

        /// <summary>
        /// Gets or sets the list of media items associated with this topic.
        /// </summary>
        public IList<string> MediaItems { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public HelpTopic()
        {
            this.MediaItems = new List<string>();
            this.Score = new HelpTopicScore();
        }
    }
}
