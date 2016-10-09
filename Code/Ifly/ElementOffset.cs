namespace Ifly
{
    /// <summary>
    /// Represents element offset.
    /// </summary>
    public class ElementOffset
    {
        /// <summary>
        /// Gets or sets the offset from the left.
        /// </summary>
        public double Left { get; set; }

        /// <summary>
        /// Gets or sets the offset from the top.
        /// </summary>
        public double Top { get; set; }

        /// <summary>
        /// Gets or sets element offset viewport.
        /// </summary>
        public ElementOffsetViewport Viewport { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public ElementOffset()
        {
            Viewport = new ElementOffsetViewport();
        }
    }
}
