using System.Collections.Generic;

namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents element settings model.
    /// </summary>
    public class ElementSettingsModel
    {
        /// <summary>
        /// Gets or sets the name of the element.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the element position.
        /// </summary>
        public ElementPosition Position { get; set; }

        /// <summary>
        /// Gets or sets the element type.
        /// </summary>
        public ElementType Type { get; set; }

        /// <summary>
        /// Gets or sets element properties.
        /// </summary>
        public IList<ElementPropertySettingsModel> Properties { get; set; }

        /// <summary>
        /// Gets or sets the order of this element relative to other elements in the same position.
        /// </summary>
        public int Order { get; set; }

        /// <summary>
        /// Gets or sets the Id of the slide the user will be navigated to when he/she clicks the element.
        /// </summary>
        public int NavigateSlideId { get; set; }

        /// <summary>
        /// Gets or sets the element offset.
        /// </summary>
        public ElementOffset Offset { get; set; }

        /// <summary>
        /// Gets or sets realtime data configuration.
        /// </summary>
        public RealtimeDataConfiguration RealtimeData { get; set; }
    }
}