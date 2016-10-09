namespace Ifly.Utils.Aggregation
{
    /// <summary>
    /// Represents RSS feed item.
    /// </summary>
    public sealed class RssFeedItem
    {
        /// <summary>
        /// Gets or sets item title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the URL of the item.
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Returns a string representation of the current object.
        /// </summary>
        /// <returns>A string representation of the current object.</returns>
        public override string ToString()
        {
            return Title;
        }
    }
}
