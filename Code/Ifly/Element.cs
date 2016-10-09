using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents timeline orientation.
    /// </summary>
    public enum TimelineOrientation
    {
        /// <summary>
        /// Horizontal.
        /// </summary>
        Horizontal = 0,

        /// <summary>
        /// Vertical.
        /// </summary>
        Vertical = 1
    }

    /// <summary>
    /// Represents a callout tail size.
    /// </summary>
    public enum CalloutTailSize 
    {
        /// <summary>
        /// Medium.
        /// </summary>
        Medium = 0,

        /// <summary>
        /// Small.
        /// </summary>
        Small = 1,

        /// <summary>
        /// Extra small.
        /// </summary>
        ExtraSmall = 2,

        /// <summary>
        /// Large.
        /// </summary>
        Large = 3,

        /// <summary>
        /// Extra large.
        /// </summary>
        ExtraLarge = 4
    }

    /// <summary>
    /// Represents a callout orientation relative to the tail.
    /// </summary>
    public enum CalloutOrientation
    {
        /// <summary>
        /// Top right.
        /// </summary>
        TopRight = 0,

        /// <summary>
        /// Right.
        /// </summary>
        Right = 1,

        /// <summary>
        /// Bottom right.
        /// </summary>
        BottomRight = 2,

        /// <summary>
        /// Bottom.
        /// </summary>
        Bottom = 3,

        /// <summary>
        /// Bottom left.
        /// </summary>
        BottomLeft = 4,

        /// <summary>
        /// Left.
        /// </summary>
        Left = 5,

        /// <summary>
        /// Top left.
        /// </summary>
        TopLeft = 6,

        /// <summary>
        /// Top.
        /// </summary>
        Top = 7
    }

    /// <summary>
    /// Represents text type.
    /// </summary>
    public enum TextType
    {
        /// <summary>
        /// Text.
        /// </summary>
        Text = 0,

        /// <summary>
        /// Quote.
        /// </summary>
        Quote = 1
    }

    /// <summary>
    /// Represents an element type.
    /// </summary>
    public enum ElementType
    {
        /// <summary>
        /// Text block.
        /// </summary>
        Text = 0,

        /// <summary>
        /// Slide title.
        /// </summary>
        Title = 1,

        /// <summary>
        /// Slide description.
        /// </summary>
        Description = 2,

        /// <summary>
        /// Fact.
        /// </summary>
        Fact = 3,

        /// <summary>
        /// Image.
        /// </summary>
        Image = 4,

        /// <summary>
        /// Map.
        /// </summary>
        Map = 5,

        /// <summary>
        /// Chart.
        /// </summary>
        Chart = 6,

        /// <summary>
        /// Table.
        /// </summary>
        Table = 7,

        /// <summary>
        /// Figure.
        /// </summary>
        Figure = 8,

        /// <summary>
        /// Line.
        /// </summary>
        Line = 9,

        /// <summary>
        /// Progress.
        /// </summary>
        Progress = 10,

        /// <summary>
        /// Callout.
        /// </summary>
        Callout = 11,

        /// <summary>
        /// Timeline.
        /// </summary>
        Timeline = 12,

        /// <summary>
        /// Widget.
        /// </summary>
        Widget = 13
    }

    /// <summary>
    /// Represents slide position.
    /// </summary>
    public enum ElementPosition
    {
        /// <summary>
        /// Place the element on the top of the slide.
        /// </summary>
        Top = 0,

        /// <summary>
        /// Place the element on the left of the slide.
        /// </summary>
        Left = 1,

        /// <summary>
        /// Place the element on the right of the slide.
        /// </summary>
        Right = 2,

        /// <summary>
        /// Place the element on the bottom of the slide.
        /// </summary>
        Bottom = 3,

        /// <summary>
        /// Place the element in the center of the slide.
        /// </summary>
        Center = 4,

        /// <summary>
        /// Element can freely be moved within the slide.
        /// </summary>
        Free = 5
    }

    /// <summary>
    /// Represents an element.
    /// </summary>
    public class Element : Storage.Record
    {
        /// <summary>
        /// Gets or sets the name of the element.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the Id of the corresponding slide.
        /// </summary>
        public int SlideId { get; set; }

        /// <summary>
        /// Gets or sets the element position.
        /// </summary>
        public ElementPosition Position { get; set; }

        /// <summary>
        /// Gets or sets the element type.
        /// </summary>
        public ElementType Type { get; set; }

        /// <summary>
        /// Gets or sets element properties.
        /// </summary>
        public IList<ElementProperty> Properties { get; set; }

        /// <summary>
        /// Gets or sets the order of this element relative to other elements in the same position.
        /// </summary>
        public int Order { get; set; }

        /// <summary>
        /// Gets or sets the Id of the slide the user will be navigated to when he/she clicks the element.
        /// </summary>
        public int NavigateSlideId { get; set; }

        /// <summary>
        /// Gets or sets the element offset.
        /// </summary>
        public ElementOffset Offset { get; set; }

        /// <summary>
        /// Gets or sets element's elevation.
        /// </summary>
        public int Elevation { get; set; }

        /// <summary>
        /// Gets or sets realtime data configuration.
        /// </summary>
        public RealtimeDataConfiguration RealtimeData { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public Element()
        {
            this.Properties = new List<ElementProperty>();
            this.Offset = new ElementOffset();
            this.RealtimeData = new RealtimeDataConfiguration();
        }
    }
}
