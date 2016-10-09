module Ifly.Models {
    /** Represents timeline size scale. */
    export enum TimelineSizeScale {
        /** 50%. */
        fiftyPercent = 0,

        /** 65%. */
        sixtyFivePercent = 1,

        /** 75%. */
        seventyFivePercent = 2,

        /** 90%. */
        ninetyPercent = 3
    }

    /** Represents chart color type. */
    export enum ChartColorType {
        /** Fill. */
        fill = 0,

        /** Stroke. */
        stroke = 1
    }

    /** Represents a map type. */
    export enum MapType {
        /** USA. */
        usa = 0,

        /** Europe. */
        europe = 1,

        /** World. */
        world = 2,

        /** Canada. */
        canada = 3,

        /** France. */
        france = 4,

        /** India. */
        india = 5,

        /** Germany. */
        germany = 6,

        /** Italy. */
        italy = 7
    }

    /** Represents a map type. */
    export enum ChartType {
        /** Line. */
        line = 0,

        /** Column. */
        column = 1,

        /** Pie. */
        pie = 2,

        /** Doughut. */
        doughnut = 3,

        /** Area. */
        area = 4,

        /** Bubble. */
        bubble = 5,

        /** Tree map. */
        treeMap = 6,

        /** Bar. */
        bar = 7,

        /** Stacked area. */
        stackedArea = 8,

        /** Stacked column. */
        stackedColumn = 9,

        /** Stacked bar. */
        stackedBar = 10
    }

    /** Represents presentation chart provider type. */
    export enum PresentationChartProviderType {
        /** Chart.js. */
        chartJS = 0,

        /** Google Charts. */
        googleCharts = 1
    }

    /** Represents presentation slide description type. */
    export enum PresentationSlideDescriptionType {
        /** Use slide description. */
        always = 0,

        /** Don't use slide description. */
        never = 1
    }

    /** Represents image source type. */
    export enum ImageSourceType {
        /** Get from URL. */
        url = 0,
        /** Pick from the gallery. */
        gallery = 1
    }

    /** Represents timeline item style. */
    export enum TimelineItemStyle {
        /** Active. */
        active = 0,

        /** Dimmed. */
        dimmed = 1
    }

    /** Represents timeline orientation. */
    export enum TimelineOrientation {
        /** Horizontal. */
        horizontal = 0,

        /** Vertical. */
        vertical = 1
    }

    /** Represents callout tail size. */
    export enum CalloutTailSize {
        /** Medium. */
        medium = 0,

        /** Small. */
        small = 1,

        /** Extra small. */
        extraSmall = 2,

        /** Large. */
        large = 3,

        /** Extra large. */
        extraLarge = 4
    }

    /** Represents a callout orientation relative to the tail. */
    export enum CalloutOrientation {
        /** Top right. */
        topRight = 0,

        /** Right. */
        right = 1,

        /** Bottom right. */
        bottomRight = 2,

        /** Bottom. */
        bottom = 3,

        /** Bottom left. */
        bottomLeft = 4,

        /** Left. */
        left = 5,

        /** Top left. */
        topLeft = 6,

        /** Top. */
        top = 7
    }

    /** Represents text type. */
    export enum TextType {
        /** Text. */
        text = 0,

        /** Quote. */
        quote = 1
    }

    /** Represents subscription type. */
    export enum SubscriptionType {
        /** Basic. */
        basic = 0,

        /** Pro. */
        pro = 1,

        /** Agency. */
        agency = 2
    }

    /** Represents a line type. */
    export enum LineType {
        /** Horizontal. */
        horizontal = 0,

        /** Vertical. */
        vertical = 1
    }

    /** Represents a figure size. */
    export enum FigureSetSize {
        /** Five. */
        five = 5,

        /** Ten. */
        ten = 10,

        /** Twenty. */
        twenty = 20,

        /** Thirty. */
        thirty = 30,

        /** Fourty. */
        fourty = 40
    }

    /** Represents a color type. */
    export enum ColorType {
        /** Accent color 1. */
        accent1 = 0,

        /** Accent color 2. */
        accent2 = 1,

        /** Accent color 3. */
        accent3 = 2,

        /** Accent color 3. */
        accent4 = 3
    }

    /** Represents map density. */
    export enum MapAnnotationDensity {
        /** Zero density. */
        none = 0,

        /** Low density. */
        low = 1,

        /** Medium density. */
        medium = 2,

        /** High density. */
        hight = 3,

        /** Highest density. */
        highest = 4
    }

    /** Represents text width scale. */
    export enum TextWidthScale {
        /** Auto. */
        auto = 0,

        /** Ten percent. */
        tenPercent = 1,

        /** Twenty-five percent. */
        twentyFivePercent = 2,

        /** Thirty-five percent. */
        thirtyFivePercent = 3,

        /** Fifty percent. */
        fiftyPercent = 4
    }

    /** Represents image width scale. */
    export enum ImageWidthScale {
        /** Auto. */
        auto = 0,

        /** Ten percent. */
        tenPercent = 1,

        /** Twenty-five percent. */
        twentyFivePercent = 2,

        /** Thirty-five percent. */
        thirtyFivePercent = 3,

        /** Fifty percent. */
        fiftyPercent = 4
    }

    /** Represents an element type. */
    export enum ElementType {
        /** Text block. */
        text = 0,

        /** Slide title. */
        title = 1,

        /** Slide description. */
        description = 2,

        /** Fact. */
        fact = 3,

        /** Image. */
        image = 4,

        /** Map. */
        map = 5,

        /** Chart. */
        chart = 6,

        /** Table. */
        table = 7,

        /** Figure. */
        figure = 8,

        /** Line. */
        line = 9,

        /** Progress. */
        progress = 10,

        /** Callout. */
        callout = 11,

        /** Timeline. */
        timeline = 12,

        /** Widget. */
        widget = 13
    }

    /** Represents presenter mode animation availability. */
    export enum PresenterModeAnimationAvailability {
        /** Minimal transitions. */
        minimal = 0,

        /** Normal transitions. */
        normal = 1,

        /** No transitions. */
        none = 2
    }
}