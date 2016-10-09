using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents presentation chart provider type.
    /// </summary>
    public enum PresentationChartProviderType
    {
        /// <summary>
        /// Chart.js.
        /// </summary>
        ChartJS = 0,

        /// <summary>
        /// Google Charts.
        /// </summary>
        GoogleCharts = 1
    }

    /// <summary>
    /// Represents presentation description mode.
    /// </summary>
    public enum PresentationSlideDescriptionType
    {
        /// <summary>
        /// Always use slide description.
        /// </summary>
        Always = 0,

        /// <summary>
        /// Don't use slide description.
        /// </summary>
        Never = 1
    }

    /// <summary>
    /// Represents a presentation. This class cannot be inherited.
    /// </summary>
    public sealed class Presentation : Storage.Record
    {
        /// <summary>
        /// Gets or sets the Id of the user who has created this presentation.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether presentation is active.
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether presentation is archived.
        /// </summary>
        public bool IsArchived { get; set; }

        /// <summary>
        /// Gets or sets the total number of impressions for this presentation.
        /// </summary>
        public int TotalImpressions { get; set; }

        /// <summary>
        /// Gets or sets the charts type.
        /// </summary>
        public PresentationChartProviderType UseCharts { get; set; }

        /// <summary>
        /// Gets or sets slide description type.
        /// </summary>
        public PresentationSlideDescriptionType UseSlideDescription { get; set; }

        /// <summary>
        /// Gets or sets the user subscription type stamped when the presentation was last time updated.
        /// </summary>
        public SubscriptionType UserSubscriptionType { get; set; }

        /// <summary>
        /// Gets or sets the date and time when this presentation was created.
        /// </summary>
        public System.DateTime Created { get; set; }

        /// <summary>
        /// Gets or sets the presentation title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or sets the name of the theme that is applied to this presentation.
        /// </summary>
        public string Theme { get; set; }

        /// <summary>
        /// Gets or sets the background image.
        /// </summary>
        public string BackgroundImage { get; set; }

        /// <summary>
        /// Gets or sets the list of slides that are part of a given presentation.
        /// </summary>
        public IList<Slide> Slides { get; set; }

        /// <summary>
        /// Gets or sets the publish settings.
        /// </summary>
        public PublishConfiguration PublishSettings { get; set; }

        /// <summary>
        /// Gets or sets the integration settings.
        /// </summary>
        public IntegrationSettings IntegrationSettings { get; set; }

        /// <summary>
        /// Gets or sets the presenter settings.
        /// </summary>
        public PresenterModeConfiguration PresenterSettings { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public Presentation()
        {
            this.Theme = "clean";
            this.IsActive = true;
            this.IsArchived = false;
            this.Slides = new List<Slide>();
            this.Created = System.DateTime.UtcNow;
            this.PublishSettings = new PublishConfiguration();
            this.IntegrationSettings = new IntegrationSettings();
            this.PresenterSettings = new PresenterModeConfiguration();
        }
    }
}
