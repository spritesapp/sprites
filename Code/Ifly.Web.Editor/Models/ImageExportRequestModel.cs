namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents image export format.
    /// </summary>
    public enum ImageExportFormat
    {
        /// <summary>
        /// JPG.
        /// </summary>
        JPG = 0,

        /// <summary>
        /// PDF.
        /// </summary>
        PDF = 1
    }

    /// <summary>
    /// Represents image export request model.
    /// </summary>
    public class ImageExportRequestModel
    {
        /// <summary>
        /// Gets or sets the zero-based index of the slide to export.
        /// </summary>
        public int Slide { get; set; }

        /// <summary>
        /// Gets or sets the total number of slides in a given presentation.
        /// </summary>
        public int TotalSlides { get; set; }

        /// <summary>
        /// Gets or sets the Id of the presentation.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the target image width.
        /// </summary>
        public int Width { get; set; }

        /// <summary>
        /// Gets or sets image export format.
        /// </summary>
        public ImageExportFormat Format { get; set; }
    }
}