using System;
using System.Collections.Generic;

namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents a presentation edit model.
    /// </summary>
    public class PresentationEditModel
    {
        /// <summary>
        /// Gets or sets the presentation.
        /// </summary>
        public Ifly.Presentation Presentation { get; set; }

        /// <summary>
        /// Gets or sets the list of all presentations by this user.
        /// </summary>
        public IList<Storage.PresentationRecordDescriptor> AllPresentations { get; set; }

        /// <summary>
        /// Gets or sets the list of all presentations shared with the given user.
        /// </summary>
        public IList<Storage.PresentationRecordDescriptor> SharedPresentations { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public PresentationEditModel()
        {
            this.AllPresentations = new List<Storage.PresentationRecordDescriptor>();
            this.SharedPresentations = new List<Storage.PresentationRecordDescriptor>();
        }
    }
}