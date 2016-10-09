module Ifly.Models.Charts {
    /** Represents Google Charts data. */
    export interface IGoogleChartsData {
        /** Gets or sets the data table. */
        table: any;

        /** Gets or sets the function that fills the data with values. */
        fill: () => any;
    }

    /** Represents Google Charts provider. */
    export class GoogleChartsProvider implements IChartProvider {
        /** Gets or sets value indicating whether Google Charts components have been loaded. */
        private static _loaded: boolean;

        /** Gets or sets the reference to the Google Visualization namespace. */
        private _gv: any;

        /** Initializes a new instance of an object. */
        constructor() {
            this._gv = window['google'].visualization;
        }

        /** 
         * Draws the chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        public drawChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            switch (options.chartType) {
                case Models.ChartType.line:
                    this.drawLineChart(element, container, options);
                    break;
                case Models.ChartType.column:
                    this.drawColumnChart(element, container, options);
                    break;
                case Models.ChartType.bar: 
                    this.drawBarChart(element, container, options);
                    break;
                case Models.ChartType.pie:
                    this.drawPieChart(element, container, options);
                    break;
                case Models.ChartType.doughnut:
                    this.drawDoughnutChart(element, container, options);
                    break;
                case Models.ChartType.area:
                    this.drawAreaChart(element, container, options);
                    break;
                case Models.ChartType.bubble:
                    this.drawBubbleChart(element, container, options);
                    break;
                case Models.ChartType.treeMap:
                    this.drawTreeMapChart(element, container, options);
                    break;
                case Models.ChartType.stackedArea:
                    this.drawStackedAreaChart(element, container, options);
                    break;
                case Models.ChartType.stackedBar:
                    this.drawStackedBarChart(element, container, options);
                    break;
                case Models.ChartType.stackedColumn:
                    this.drawStackedColumnChart(element, container, options);
                    break;
            }
        }

        /** 
         * Draws line chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawLineChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            this.drawGenericChart('Line', element, container, options);
        }

        /** 
         * Draws area chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawAreaChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            this.drawGenericChart('Area', element, container, options);
        }

        /** 
         * Draws stacked area chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawStackedAreaChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            this.drawGenericChart('Area', element, container, options, opt => {
                opt.isStacked = true;
            });
        }

        /** 
         * Draws column chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawColumnChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            var drawn = e => {
                var elm = $(e), ps = elm.find('svg > g'), pse = null, pses = [], animatable = !this.disableAnimation();

                ps = $($(ps.length > 1 && $(ps[1]).children().length > 0 ? ps[1] : ps[0])
                    .find('g[clip-path] > g').get(0)).find('rect');

                for (var i = 0; i < ps.length; i++) {
                    pse = $(ps[i]);

                    if (!pse.attr('fill-opacity')) {
                        pse.attr('data-class', 'item-' + (i + 1));

                        if (animatable) {
                            pse.attr('data-class-temp', 'true');
                        }

                        pses[pses.length] = pse;
                    }
                }

                if (animatable) {
                    setTimeout(() => {
                        for (var i = 0; i < pses.length; i++) {
                            pses[i].removeAttr('data-class-temp');
                        }
                    }, 100);
                }
            };

            this.drawGenericChart('Column', element, container, options, null, e => {
                if (Ifly.App.getInstance().isEditorHosted()) {
                    drawn(e);
                } else {
                    setTimeout(() => {
                        drawn(e);
                    }, 50);
                }
            });
        }

        /** 
         * Draws stacked column chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawStackedColumnChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            this.drawGenericChart('Column', element, container, options, opt => {
                opt.isStacked = true;
            });
        }

        /** 
         * Draws bar chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawBarChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            var drawn = e => {
                var elm = $(e), ps = elm.find('svg > g'), pse = null, pses = [], animatable = !this.disableAnimation();

                ps = $($(ps.length > 1 && $(ps[1]).children().length > 0 ? ps[1] : ps[0])
                    .find('g[clip-path] > g').get(0)).find('rect');

                for (var i = 0; i < ps.length; i++) {
                    pse = $(ps[i]);

                    if (!pse.attr('fill-opacity')) {
                        pse.attr('data-class', 'item-' + (i + 1));

                        if (animatable) {
                            pse.attr('data-class-temp', 'true');
                        }

                        pses[pses.length] = pse;
                    }
                }

                if (animatable) {
                    setTimeout(() => {
                        for (var i = 0; i < pses.length; i++) {
                            pses[i].removeAttr('data-class-temp');
                        }
                    }, 100);
                }
            };

            this.drawGenericChart('Column', element, container, options, opt => {
                opt.orientation = 'vertical';
            }, e => {
                if (Ifly.App.getInstance().isEditorHosted()) {
                    drawn(e);
                } else {
                    setTimeout(() => {
                        drawn(e);
                    }, 50);
                }
            });
        }

        /** 
         * Draws stacked bar chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawStackedBarChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            this.drawGenericChart('Column', element, container, options, opt => {
                opt.orientation = 'vertical';
                opt.isStacked = true;
            });
        }

        /** 
         * Draws bubble chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawBubbleChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            var drawn = e => {
                var elm = $(e), ps = elm.find('svg circle');

                for (var i = 0; i < ps.length; i++) {
                    $(ps[i]).attr('data-class', 'item-' + (i + 1));
                }
            };

            this.drawGenericChart('Bubble', element, container, options, null, e => {
                if (Ifly.App.getInstance().isEditorHosted()) {
                    drawn(e);
                } else {
                    setTimeout(() => {
                        drawn(e);
                    }, 50);
                }
            });
        }

        /** 
         * Draws tree map chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawTreeMapChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            var drawn = e => {
                var elm = $(e), gs = elm.find('svg > g'), t = null, p = null,
                    n = 0, nextParent = elm.find('svg'), offset = 0;

                nextParent.attr({
                    'pointer-events': 'none'
                });

                for (var i = 0; i < gs.length; i++) {
                    p = $(gs[i]);
                    t = p.find('text');

                    if ((t.length && t.text() == 'IflyRoot') || p.find('rect').length > 1) {
                        p.remove();
                    } else {
                        p.find('rect').attr({
                            fill: options.getNextColor(n++, ChartColorType.fill)
                        });

                        t.attr({
                            fill: options.noChrome ? 'transparent' : '#ffffff'
                        });

                        p.attr('data-class', 'item-' + (++offset));
                    }
                }
            };

            this.drawGenericChart('TreeMap', element, container, options, null, e => {
                if (Ifly.App.getInstance().isEditorHosted()) {
                    drawn(e);
                } else {
                    setTimeout(() => {
                        drawn(e);
                    }, 50);
                }
            });
        }

        /** 
         * Draws pie chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         * @param {boolean} withHole Value indicating whether to make a donut chart.
         */
        private drawPieChart(element: IChartElement, container: IChartContainer, options: IChartOptions, withHole?: boolean) {
            var chart = new this._gv.PieChart(container.inner.get(0)),
                o = null, d = null, drawn = e => {
                    var elm = $(e), ps = elm.find('svg > g > path');
                    
                    for (var i = 0; i < ps.length; i++) {
                        $(ps[i]).attr('data-class', 'item-' + (i + 1));
                    }
                };

            o = this.getNativeChartOptions(chart, options);

            if (withHole) {
                o.pieHole = 0.5;
            }

            d = this.getNativeChartData(options);

            this.tryDrawChart(chart, d.table, o);

            if (Ifly.App.getInstance().isEditorHosted()) {
                drawn(container.inner.get(0));
            } else {
                setTimeout(() => {
                    drawn(container.inner.get(0));
                }, 50);
            }
        }

        /** 
         * Draws donut chart.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         */
        private drawDoughnutChart(element: IChartElement, container: IChartContainer, options: IChartOptions) {
            this.drawPieChart(element, container, options, true);
        }

        /** 
         * Draws generic chart.
         * @param {string} name Chart name.
         * @param {IChartElement} element Chart element.
         * @param {IChartContainer} container Chart container.
         * @param {IChartOptions} options Chart options.
         * @param {Function} initializer Chart options initializer.
         * @param {Function} drawn A callback which is fired when chart is drawn.
         */
        private drawGenericChart(name: string, element: IChartElement, container: IChartContainer, options: IChartOptions, initializer?: (opt: any) => any, drawn?: (c: Element) => any) {
            var chart = new this._gv[name + (name == 'TreeMap' ? '' : 'Chart')](container.inner.get(0)),
                o = null, d = null;

            o = this.getNativeChartOptions(chart, options);

            if (initializer) {
                initializer(o);
            }

            d = this.getNativeChartData(options);

            if (!options.animate) {
                d.fill();
            }

            if (this.tryDrawChart(chart, d.table, o) && drawn) {
                drawn(<Element>container.inner.get(0));
            }

            if (options.animate) {
                this.animate(chart, d, o);
            }
        }

        /** 
         * Animates the chart.
         * @param {object} chart Chart to animate.
         * @param {IGoogleChartsData} data Chart data.
         * @param {object} options Chart options.
         */
        private animate(chart: any, data: IGoogleChartsData, options: any) {
            setTimeout(() => {
                data.fill();
                this.tryDrawChart(chart, data.table, options);
            }, 10);
        }

        /**
         * Tries to draw the given chart.
         * @param {object} chart Chart.
         * @param {object} data Data.
         * @param {object} options Chart options.
         */
        private tryDrawChart(chart, data, options): boolean {
            var ret = true;

            try {
                chart.draw(data, options);
            } catch (ex) { ret = false; }

            return ret;
        }

        /** 
         * Returns native chart options.
         * @param {object} chart Chart.
         * @param {IChartOptions} options Chart options.
         */
        private getNativeChartOptions(chart: any, options: IChartOptions): any {
            var legend = this.getLegend(options), ret = null, chartArea = {
                left: 0,
                top: parseInt(<any>(options.legendFontSize / 2 + 10), 10),
                width: legend != 'none' ? parseInt(<any>(options.width / 3 * 2)) : options.width - 10,
                height: legend != 'none' ? parseInt(<any>(options.height / 3 * 2)) : options.height - 10
            };

            chartArea.left = parseInt(<any>((options.width - chartArea.width) / 2), 10);
            
            ret = {
                backgroundColor: 'transparent',
                colors: this.getColors(options).fill,
                enableInteractivity: false,
                fontSize: options.chartType == ChartType.treeMap ?
                options.legendFontSize : options.fontSize,
                fontName: options.fontFamily,
                fontFamily: options.fontFamily,
                legend: legend,
                width: options.width,
                height: options.height,
                chartArea: chartArea,
                tooltip: options.noChrome ? null : {
                    textStyle: {
                        color: options.fontColor
                    }
                },
                animation: null,
                pointSize: options.noChrome ? 0 : parseInt(<any>(options.legendFontSize / 2), 10),
                hAxis: {
                    textStyle: options.noChrome ? null : {
                        color: options.fontColor,
                        fontName: options.fontFamily,
                        fontSize: options.legendFontSize
                    },
                    baselineColor: options.noChrome ? 'transparent' : options.gridColor,
                    gridlines: {
                        color: 'transparent'
                    }
                },
                vAxis: {
                    textStyle: options.noChrome ? null : {
                        color: options.fontColor,
                        fontName: options.fontFamily,
                        fontSize: options.legendFontSize
                    },
                    baselineColor: options.noChrome ? 'transparent' : options.gridColor,
                    gridlines: {
                        color: 'transparent'
                    }
                },
                showTooltips: false,
                bubble: {
                    textStyle: {
                        fontName: options.fontFamily,
                        fontSize: options.fontSize,
                        color: options.noChrome ? 'transparent' : options.fontContrastColor
                    }
                },
                pieSliceTextStyle: {
                    fontName: options.fontFamily,
                    fontSize: options.fontSize
                },
                pieSliceText: options.noChrome ? 'none' : 'value'
            };

            if (options.noChrome) {
                ret.fontColor = 'transparent';
                ret.areaOpacity = 0.8;
            }

            return ret;
        }

        /** 
         * Returns chart color series (fill and stroke).
         * @param {IChartOptions} options Chart options.
         */
        private getColors(options: IChartOptions) {
            var ret = {
                fill: [],
                stroke: []
            };

            for (var i = 0; i < 10; i++) {
                ret.fill[ret.fill.length] = options.getNextColor(i, ChartColorType.fill);
                ret.stroke[ret.stroke.length] = options.getNextColor(i, ChartColorType.stroke);
            }

            return ret;
        }

        /**
         * Rotates the data clockwise and flips it.
         * @param {object} data Data to rotate.
         */
        private rotateDataClockwiseAndFlip(data: any) {
            var ret = null;

            ret = {};

            for (var i = 0; i < data.rows.length; i++) {
                if (!ret.columns) {
                    ret.columns = [{ name: '' }];
                }

                ret.columns[ret.columns.length] = { name: data.rows[i].cells[0].value || '' };
            }

            ret.rows = [];

            for (var i = 1; i < data.columns.length; i++) {
                ret.rows[ret.rows.length] = {
                    cells: [{ value: data.columns[i].name || '' }]
                };
            }

            for (var i = 0; i < data.rows.length; i++) {
                for (var j = 1; j < data.rows[i].cells.length; j++) {
                    ret.rows[j - 1].cells[i + 1] = { value: data.rows[i].cells[j].value || '' };
                }
            }

            return ret;
        }

        /** 
         * Returns native chart data.
         * @param {IChartOptions} options Chart options.
         */
        private getNativeChartData(options: IChartOptions): IGoogleChartsData {
            var t = [[]], chartData = options.chartData, offset = 1, v = '', root = 'IflyRoot',
                dataMatrix = [], tab = null, ret = null, rx = /[a-z]/gi, isNum = false, setValueOffset = 1;

            if (options.chartType == Models.ChartType.line ||
                options.chartType == Models.ChartType.area ||
                options.chartType == Models.ChartType.bar) {

                chartData = this.rotateDataClockwiseAndFlip(chartData);
            } else if (options.chartType == Models.ChartType.treeMap && chartData.columns.length > 1) {
                chartData.columns.splice(1, 0, { name: 'Parent' });
                setValueOffset = 2;
            }

            for (var i = 0; i < chartData.columns.length; i++) {
                t[0][t[0].length] = chartData.columns[i].name || '';
            }

            if (options.chartType == Models.ChartType.treeMap && chartData.rows.length > 0) {
                chartData.rows.splice(0, 0, {
                    cells: $.map(new Array(chartData.columns.length), (e, i) => {
                        return {
                            value: i == 0 ? root : null
                        };
                    })
                });

                for (var i = 1; i < chartData.rows.length; i++) {
                    chartData.rows[i].cells.splice(1, 0, { value: root });
                }
            }

            for (var i = 0; i < chartData.rows.length; i++) {
                if (!t[i + offset]) {
                    t[i + offset] = [];
                }

                dataMatrix[i] = [];

                for (var j = 0; j < chartData.rows[i].cells.length; j++) {
                    v = chartData.rows[i].cells[j].value;
                    isNum = (v || '').toString().match(rx) == null;

                    if (j > 0 && (j != 1 || options.chartType != Models.ChartType.treeMap)) {
                        dataMatrix[i][dataMatrix[i].length] = isNum ? options.parseNumber(v) : v;
                        t[i + offset][t[i + offset].length] = isNum ? 0 : v;
                    } else {
                        if (v && i > 0 && j == 0 && j < (chartData.rows[i].cells.length - 2) && options.chartType == Models.ChartType.treeMap) {
                            v += ' (' + chartData.rows[i].cells[j + 2].value + ')';
                        }

                        t[i + offset][t[i + offset].length] = (v || '');
                    }
                }
            }

            ret = ((rawData) => {
                var tab = this._gv.arrayToDataTable(rawData);

                return {
                    table: tab,
                    fill: (): boolean => {
                        var result = true;

                        try {
                            for (var i = 0; i < dataMatrix.length; i++) {
                                for (var j = 0; j < dataMatrix[i].length; j++) {
                                    tab.setValue(i, j + setValueOffset, dataMatrix[i][j]);
                                }
                            }
                        } catch (ex) { result = false; }

                        return result;
                    }
                };
            })(t);

            /* These chart types don't support animation... */ 
            if (options.chartType == Models.ChartType.pie ||
                options.chartType == Models.ChartType.doughnut ||
                options.chartType == Models.ChartType.treeMap) {

                ret.fill();
            }

            return ret;
        }

        /** 
         * Returns char legend configuration.
         * @param {IChartOptions} options Chart options.
         */
        private getLegend(options: IChartOptions) {
            var ret = null, hasColumnText = false, v = '';

            if (options.noChrome) {
                ret = 'none';
            } else {
                for (var i = 0; i < options.chartData.rows.length; i++) {
                    if (options.chartData.rows[i].cells.length > 0) {
                        hasColumnText = (options.chartData.rows[i].cells[0].value || '').length > 0;
                        if (hasColumnText) {
                            break;
                        }
                    }
                }

                if (!hasColumnText && options.chartType != Models.ChartType.pie &&
                    options.chartType != Models.ChartType.doughnut) {

                    for (var i = 0; i < options.chartData.columns.length; i++) {
                        v = options.chartData.columns[i].name || '';
                        hasColumnText = v.length > 0 && v.toLocaleLowerCase().indexOf('column #') != 0;

                        if (hasColumnText) {
                            break;
                        }
                    }
                }

                if (hasColumnText) {
                    ret = {
                        position: 'bottom',
                        textStyle: {
                            color: options.fontColor,
                            fontSize: options.legendFontSize
                        },
                        scrollArrows: {
                            activeColor: options.accentColor
                        },
                        pagingTextStyle: {
                            color: options.fontColor,
                            fontSize: options.legendFontSize
                        }
                    };
                } else {
                    ret = 'none';
                }
            }

            return ret;
        }

        /** Returns value indicating whether animation is disabled. */
        private disableAnimation(): boolean {
            var loc = (window.top.location.href || '').toLowerCase();
            return loc.indexOf('_cef') >= 0 && loc.indexOf('_cef:animation=0') >= 0;
        }

        /** 
         * Loads the Google Charts components.
         * @param {Function} complete A callback which is executed when components are loaded.
         */
        public static load(complete: () => any) {
            var g = window['google'];

            complete = complete || function () { };

            if (this._loaded) {
                complete();
            } else if (!g) {
                this._loaded = true;
                complete();
            } else {
                g.setOnLoadCallback(() => {
                    this._loaded = true;
                    complete();
                });
            }
        }
    }
} 