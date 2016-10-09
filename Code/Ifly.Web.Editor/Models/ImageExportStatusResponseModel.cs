namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents image export status response model.
    /// </summary>
    public class ImageExportStatusResponseModel : ImageExportResponseModel
    {
        /// <summary>
        /// Gets or sets value indicating whether export succeeded.
        /// </summary>
        public bool Success { get; set; }
    }
}