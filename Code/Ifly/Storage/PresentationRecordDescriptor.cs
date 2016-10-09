using System;

namespace Ifly.Storage
{
    /// <summary>
    /// Represents presentation record descriptor.
    /// </summary>
    public class PresentationRecordDescriptor : RecordDescriptor
    {
        /// <summary>
        /// Gets or sets the date and time when presentation was created.
        /// </summary>
        public DateTime Created { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether presentation is archived.
        /// </summary>
        public bool IsArchived { get; set; }
    }
}
