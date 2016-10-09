using System.Collections.Generic;

namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents presentation sharing all model.
    /// </summary>
    public class PresentationSharingAllModel
    {
        /// <summary>
        /// Gets or sets the status for all the presentation.
        /// </summary>
        public IList<PresentationSharingStatus> Status { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public PresentationSharingAllModel()
        {
            this.Status = new List<PresentationSharingStatus>();
        }
    }
}