namespace Ifly
{
    /// <summary>
    /// Represents element property.
    /// </summary>
    public class ElementProperty : Storage.Record
    {
        /// <summary>
        /// Gets or sets the element Id.
        /// </summary>
        public int ElementId { get; set; }

        /// <summary>
        /// Gets or sets the property name.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the property value.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public ElementProperty() { }
    }
}
