namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents video export status response model.
    /// </summary>
    public class VideoExportStatusResponseModel : VideoExportResponseModel
    {
        /// <summary>
        /// Gets or sets the current task.
        /// </summary>
        public string Task { get; set; }

        /// <summary>
        /// Gets or sets the extra data (JSON-encoded).
        /// </summary>
        public string ExtraData { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether export succeeded.
        /// </summary>
        public bool Success { get; set; }
    }
}