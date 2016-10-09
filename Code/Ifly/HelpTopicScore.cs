namespace Ifly
{
    /// <summary>
    /// Represents a help topic score.
    /// </summary>
    public class HelpTopicScore
    {
        /// <summary>
        /// Gets or sets the positive part of the score.
        /// </summary>
        public int Positive { get; set; }

        /// <summary>
        /// Gets or sets the negative part of the score.
        /// </summary>
        public int Negative { get; set; }

        /// <summary>
        /// Gets the total scopre.
        /// </summary>
        public int Total
        {
            get { return Positive + Negative; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public HelpTopicScore() { }
    }
}
