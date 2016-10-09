using System.Collections.Generic;

namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents slide order mapping.
    /// </summary>
    public class SlideOrderMapping
    {
        /// <summary>
        /// Gets or sets the slide Id.
        /// </summary>
        public int SlideId { get; set; }

        /// <summary>
        /// Gets or sets the order.
        /// </summary>
        public int Order { get; set; }
    }

    /// <summary>
    /// Represents slide reorder result model.
    /// </summary>
    public class SlideReorderResultModel
    {
        /// <summary>
        /// Gets or sets the slides.
        /// </summary>
        public IList<SlideOrderMapping> Slides { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public SlideReorderResultModel()
        {
            this.Slides = new List<SlideOrderMapping>();
        }
    }
}