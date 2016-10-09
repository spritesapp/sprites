using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents a slide.
    /// </summary>
    public sealed class Slide : Storage.Record
    {
        /// <summary>
        /// Gets or sets the Id of the corresponding presentation.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the zero-based order number of the slide.
        /// </summary>
        public int Order { get; set; }

        /// <summary>
        /// Gets or sets the slide title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the slide description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the playback time for this slide.
        /// </summary>
        public double PlaybackTime { get; set; }

        /// <summary>
        /// Gets or sets the slide elements.
        /// </summary>
        public IList<Element> Elements { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public Slide()
        {
            this.Elements = new List<Element>();
        }
    }
}
