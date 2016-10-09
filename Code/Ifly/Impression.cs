using System;

namespace Ifly
{
    /// <summary>
    /// Represents presentation impression.
    /// </summary>
    public class Impression : Storage.Record, Storage.IRelationalRecord
    {
        /// <summary>
        /// Gets or sets the Id of the presentation.
        /// </summary>
        public virtual int? PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the Id of the user who created the presentation.
        /// </summary>
        public virtual int? PresentationUserId { get; set; }

        /// <summary>
        /// Gets or sets the impression timestamp.
        /// </summary>
        public virtual DateTime? Timestamp { get; set; }
    }
}
