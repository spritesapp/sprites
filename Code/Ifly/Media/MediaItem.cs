using System;

namespace Ifly.Media
{
    public class MediaItem : Storage.Record
    {
        /// <summary>
        /// Gets or sets the Id of the user to whom this media item belongs.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Gets or sets the name of the item.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the URL of this item.
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// Gets or sets the date and time when this item was created.
        /// </summary>
        public DateTime Created { get; set; }
    }
}
