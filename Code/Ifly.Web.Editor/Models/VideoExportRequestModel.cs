namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents video export request model.
    /// </summary>
    public class VideoExportRequestModel
    {
        /// <summary>
        /// Gets or sets the Id of the presentation.
        /// </summary>
        public int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the target image width.
        /// </summary>
        public int Width { get; set; }

        /// <summary>
        /// Gets or sets the name for the audio.
        /// </summary>
        public string Audio { get; set; }
    }
}