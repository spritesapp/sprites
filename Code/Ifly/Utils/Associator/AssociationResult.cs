namespace Ifly.Utils.Associator
{
    /// <summary>
    /// Represents association result.
    /// </summary>
    public class AssociationResult
    {
        /// <summary>
        /// Gets or sets the value.
        /// </summary>
        public double Value { get; set; }

        /// <summary>
        /// Gets or sets the value unit.
        /// </summary>
        public ValueUnit Unit { get; set; }

        /// <summary>
        /// Gets or sets the ratio (if available).
        /// </summary>
        public double? Ratio { get; set; }

        /// <summary>
        /// Gets or sets the category.
        /// </summary>
        public string Category { get; set; }

        /// <summary>
        /// Gets or sets description.
        /// </summary>
        public string Description { get; set; }
    }
}
