namespace Ifly
{
    /// <summary>
    /// Represents impression summary.
    /// </summary>
    public class ImpressionSummary
    {
        /// <summary>
        /// Gets or sets the impression summary channel.
        /// </summary>
        public SocialImpactChannel Channel { get; set; }

        /// <summary>
        /// Gets or sets the point in time (hour, day, month, etc. depending on a scale).
        /// </summary>
        public int PointInTime { get; set; }

        /// <summary>
        /// Gets or sets the total number of impressions.
        /// </summary>
        public int TotalImpressions { get; set; }

        /// <summary>
        /// Gets or sets the relative order of this summary.
        /// </summary>
        public int Order { get; set; }
    }
}
