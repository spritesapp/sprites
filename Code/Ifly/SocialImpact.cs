using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ifly
{
    /// <summary>
    /// Represents social impact channel.
    /// </summary>
    public enum SocialImpactChannel
    {
        /// <summary>
        /// Direct (open in a browser).
        /// </summary>
        Direct = 0,

        /// <summary>
        /// Facebook.
        /// </summary>
        Facebook = 1,

        /// <summary>
        /// Twitter.
        /// </summary>
        Twitter = 2,

        /// <summary>
        /// LinkedIn.
        /// </summary>
        LinkedIn = 3,

        /// <summary>
        /// Google+.
        /// </summary>
        GooglePlus = 4
    }

    /// <summary>
    /// Represents social impact.
    /// </summary>
    public class SocialImpact : Storage.Record, Storage.IRelationalRecord
    {
        /// <summary>
        /// Gets or sets the Id of the presentation.
        /// </summary>
        public virtual int PresentationId { get; set; }

        /// <summary>
        /// Gets or sets the social impact channel.
        /// </summary>
        public virtual SocialImpactChannel Channel { get; set; }

        /// <summary>
        /// Gets or sets the social impact value.
        /// </summary>
        public virtual int? Value { get; set; }

        /// <summary>
        /// Gets or sets the social impact timestamp.
        /// </summary>
        public virtual DateTime Timestamp { get; set; }
    }
}
