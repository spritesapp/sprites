namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents slide data model.
    /// </summary>
    public class SlideDataModel
    {
        /// <summary>
        /// Gets or sets the slide title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the slide description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets elements.
        /// </summary>
        public Element[] Elements { get; set; }
    }
}