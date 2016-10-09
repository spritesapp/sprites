module Ifly.Models.Charts {
    /** Represents chart element. */
    export interface IChartElement {
        /**
         * Returns the value of the given property.
         * @param {string} propertyName Property name.
         * @param {string} defaultValue Default value if no property with the given name is defined.
         */
        getPropertyValue(propertyName: string, defaultValue?: string): string; 
    }

    /** Represents chart container. */
    export interface IChartContainer {
        /** Gets or sets the outer container. */
        outer: JQuery;

        /** Gets or sets the inner container. */
        inner: JQuery;
    }

    /** Represents chart options. */
    export interface IChartOptions {
        /** Gets or sets the name of the infographic theme currently used. */
        theme: string;

        /** Gets or sets the parsed chart data. */
        chartData: any;

        /** Gets or sets the chart type. */
        chartType: Models.ChartType;

        /** Gets or sets the current font family. */
        fontFamily: string;

        /** Gets or sets the font size. */
        fontSize: number;

        /** Gets or sets the legend font size. */
        legendFontSize: number;

        /** Gets or sets the font color. */
        fontColor: string;

        /** Gets or sets font contrast color. */
        fontContrastColor: string; 

        /** Gets or sets the primary accent color. */
        accentColor: string;

        /** Gets or sets the grid color. */
        gridColor: string;

        /** Gets or sets value indicating whether to animate the chart. */
        animate: boolean;

        /** Gets or sets chart width, in pixels. */
        width: number;

        /** Gets or sets chart height, in pixels. */
        height: number;

        /** Gets or sets value indicating whether to remove any chrome around the chart. */
        noChrome: boolean;

        /** 
         * Return the next available color of a given type for component with the given index.
         * @param {number} index Component index.
         * @param {ChartColorType} type Color type.
         */
        getNextColor: (index: number, type: ChartColorType) => string;

        /** 
         * Parses the number from a given string literal.
         * @param {string} value Value to parse number from.
         */
        parseNumber: (value: string) => number;
    }

    /** Represents chart provider. */
    export interface IChartProvider {
        /** 
         * Draws the chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        drawChart(element: IChartElement, container: IChartContainer, options: IChartOptions);
    }
}  