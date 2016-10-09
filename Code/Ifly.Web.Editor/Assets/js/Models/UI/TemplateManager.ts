/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />
/// <reference path="DataTableView.ts" />

module Ifly.Models.UI {
    /** Represents template layout. */
    export interface ITemplateLayout {
        /** Gets or sets slide title. */
        title?: string;

        /** Gets or sets slide description. */
        description?: string;

        /** Gets or sets slide elements. */
        elements?: Ifly.Models.Element[];
    }

    /** Represents a slide template. */
    export interface ISlideTemplate {
        /** Gets or sets template Id. */
        id: string;

        /** Gets or sets template name. */
        name?: string;

        /** Returns layout tumbnail HTML. */
        getThumbnailHtml(): string;

        /** Returns layout. */
        getLayout(): ITemplateLayout;

        /** Serializes the slide template. */
        serialize(): any;
    }

    /** Represents slide template base. */
    export class SlideTemplateBase implements ISlideTemplate {
        /** Gets or sets template Id. */
        public id: string;

        /** Gets or sets template name. */
        public name: string;

        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            this.id = id;
            this.name = name;
        }

        /** Returns layout tumbnail HTML. */
        public getThumbnailHtml(): string {
            return '';
        }

        /** Returns layout. */
        public getLayout(): ITemplateLayout {
            return null;
        }

        /** Serializes the slide template. */
        public serialize(): any {
            var layout = this.getLayout(), ret = null;

            if (layout) {
                ret = {
                    title: layout.title,
                    description: layout.description,
                    elements: ko.utils.arrayMap(layout.elements || [], (e: Ifly.Models.Element) => {
                        return e.serialize();
                    })
                };
            }

            return ret;
        }

        /** Returns viewport dimensions for the template to relate to. */
        public getViewportDimensions(): { width: number; height: number } {
            /* Using hard-coded viewport dimensions to make template look better on different screen resolutions. */
            return {
                width: 1111,
                height: 666
            };
        }
    }

    /** Represents blank template. */
    export class BlankTemplate extends SlideTemplateBase {
        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            super(id, name);
        }
    }

    /** Represents title-only template. */
    export class TitleOnlyTemplate extends SlideTemplateBase {
        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            super(id, name);
        }

        /** Returns layout tumbnail HTML. */
        public getThumbnailHtml(): string {
            return '<div class="l-element l-title"></div>';
        }

        /** Returns layout. */
        public getLayout(): ITemplateLayout {
            return {
                title: Ifly.App.getInstance().components['TemplateSelector'].terminology.templateData['title-only'].title
            };
        }
    }

    /** Represents text-only template. */
    export class TextOnlyTemplate extends SlideTemplateBase {
        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            super(id, name);
        }

        /** Returns layout tumbnail HTML. */
        public getThumbnailHtml(): string {
            return '<div class="l-element"></div>';
        }

        /** Returns layout. */
        public getLayout(): ITemplateLayout {
            var terminology = Ifly.App.getInstance().components['TemplateSelector'].terminology;
            
            return {
                elements: [
                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.text,
                        name: terminology.elementTypes.text,
                        position: Ifly.Models.ElementPosition.center,
                        properties: [
                            { name: 'text', value: terminology.templateData['text-only'].text },
                            { name: 'isRichText', value: 'true' },
                            { name: 'textType', value: '0' }
                        ]
                    })
                ]
            }
        }
    }

    /** Represents title and chart template. */
    export class TitleAndChartTemplate extends SlideTemplateBase {
        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            super(id, name);
        }

        /** Returns layout tumbnail HTML. */
        public getThumbnailHtml(): string {
            return '<div class="l-element l-title"></div><div class="l-element l-accent l-chart"><i class="icon icon-bar-chart"></i></div>';
        }

        /** Returns layout. */
        public getLayout(): ITemplateLayout {
            var terminology = Ifly.App.getInstance().components['TemplateSelector'].terminology,
                t = terminology.templateData['title-and-chart'];
            
            return {
                title: t.title,
                description: t.description,
                elements: [
                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.chart,
                        name: terminology.elementTypes.chart,
                        position: Ifly.Models.ElementPosition.center,
                        properties: [
                            { name: 'type', value: ChartType.doughnut.toString() },
                            { name: 'size', value: '50' },
                            { name: 'chrome', value: ChartChromeMode.auto.toString() },
                            {
                                name: 'data',
                                value: new Ifly.Utils.DataTableConverter().convertToString(new DataTable({
                                    columns: [{ name: t.chartColumn0 }, { name: t.chartColumn1 }],
                                    rows: [
                                        { cells: [{ value: t.chartRow0Column0 }, { value: '4626000' }] },
                                        { cells: [{ value: t.chartRow1Column0 }, { value: '1767000' }] },
                                        { cells: [{ value: t.chartRow2Column0 }, { value: '1553000' }] },
                                        { cells: [{ value: t.chartRow3Column0 }, { value: '1156000' }] },
                                        { cells: [{ value: t.chartRow4Column0 }, { value: '1132000' }] }
                                    ]
                                }))
                            }
                        ]
                    })
                ]
            }
        }
    }

    /** Represents facts and figure template. */
    export class FactsAndFigureTemplate extends SlideTemplateBase {
        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            super(id, name);
        }

        /** Returns layout tumbnail HTML. */
        public getThumbnailHtml(): string {
            return '<div class="pull-left"><div class="l-element l-fact"></div><div class="l-element l-fact"></div></div><div class="pull-right"><div class="l-element l-accent l-figure"><i class="icon icon-male"></i></div></div>';
        }

        /** Returns layout. */
        public getLayout(): ITemplateLayout {
            var terminology = Ifly.App.getInstance().components['TemplateSelector'].terminology,
                t = terminology.templateData['facts-and-figure'];

            return {
                elements: [
                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.fact,
                        name: terminology.elementTypes.fact,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 50,
                            top: 150,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'icon', value: 'inbox' },
                            { name: 'quantity', value: '34' },
                            { name: 'measure', value: t.fact0Measure },
                            { name: 'description', value: t.fact0Description },
                            { name: 'quantityColor', value: ColorType.accent1 }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.fact,
                        name: terminology.elementTypes.fact,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 50,
                            top: 300,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'icon', value: 'group' },
                            { name: 'quantity', value: '3.3' },
                            { name: 'measure', value: t.fact1Measure },
                            { name: 'description', value: t.fact1Description },
                            { name: 'quantityColor', value: ColorType.accent2 }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.line,
                        name: terminology.elementTypes.line,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 500,
                            top: 150,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'type', value: LineType.vertical.toString() },
                            { name: 'length', value: '26' }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.figure,
                        name: terminology.elementTypes.figure,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 550,
                            top: 150,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'icon', value: 'print' },
                            { name: 'size', value: FigureSetSize.fourty.toString() },
                            { name: 'highlight', value: '5' },
                            { name: 'highlightColor', value: ColorType.accent3.toString() }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.text,
                        name: terminology.elementTypes.text,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 550,
                            top: 375,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'text', value: t.figureText },
                            { name: 'isRichText', value: 'true' },
                            { name: 'textType', value: '0' }
                        ]
                    })
                ]
            };
        }
    }

    /** Represents facts and chart template. */
    export class FactsAndChartTemplate extends SlideTemplateBase {
        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            super(id, name);
        }

        /** Returns layout tumbnail HTML. */
        public getThumbnailHtml(): string {
            return '<div class="pull-left"><div class="l-element l-accent l-chart"><i class="icon icon-bar-chart"></i></div></div><div class="pull-right"><div class="l-element l-fact"></div><div class="l-element l-fact"></div></div>';
        }

        /** Returns layout. */
        public getLayout(): ITemplateLayout {
            var terminology = Ifly.App.getInstance().components['TemplateSelector'].terminology,
                t = terminology.templateData['facts-and-chart'];
            
            return {
                title: t.title,
                elements: [
                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.chart,
                        name: terminology.elementTypes.chart,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 50,
                            top: 150,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'type', value: ChartType.column.toString() },
                            { name: 'size', value: '41' },
                            { name: 'chrome', value: ChartChromeMode.auto.toString() },
                            {
                                name: 'data',
                                value: new Ifly.Utils.DataTableConverter().convertToString(new DataTable({
                                    columns: [{ name: null }, { name: t.chartColumn0 }, { name: t.chartColumn1 }, { name: t.chartColumn2 }, { name: t.chartColumn3 }],
                                    rows: [
                                        { cells: [{ value: t.chartRow0Column0 }, { value: '7.1%' }, { value: '8.3%' }, { value: '82.4%' }, { value: '2%' }] },
                                    ]
                                }))
                            }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.line,
                        name: terminology.elementTypes.line,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 500,
                            top: 150,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'type', value: LineType.vertical.toString() },
                            { name: 'length', value: '26' }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.fact,
                        name: terminology.elementTypes.fact,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 550,
                            top: 150,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'icon', value: 'search' },
                            { name: 'quantity', value: '82%' },
                            { name: 'measure', value: t.fact0Measure },
                            { name: 'description', value: t.fact0Description },
                            { name: 'quantityColor', value: ColorType.accent3 }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.fact,
                        name: terminology.elementTypes.fact,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 550,
                            top: 300,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'icon', value: 'mail-forward' },
                            { name: 'quantity', value: '1.9' },
                            { name: 'measure', value: t.fact1Measure },
                            { name: 'description', value: t.fact1Description },
                            { name: 'quantityColor', value: ColorType.accent2 }
                        ]
                    })
                ]
            }
        }
    }

    /** Represents map and table template. */
    export class MapAndTableTemplate extends SlideTemplateBase {
        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            super(id, name);
        }

        /** Returns layout tumbnail HTML. */
        public getThumbnailHtml(): string {
            return '<div class="pull-left"><div class="l-element l-accent l-map"><i class="icon icon-globe"></i></div></div><div class="pull-right"><div class="l-element l-table"></div></div>';
        }

        /** Returns layout. */
        public getLayout(): ITemplateLayout {
            var terminology = Ifly.App.getInstance().components['TemplateSelector'].terminology,
                t = terminology.templateData['map-and-table'];
            
            return {
                title: t.title,
                elements: [
                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.map,
                        name: terminology.elementTypes.map,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 50,
                            top: 150,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            { name: 'type', value: MapType.world.toString() },
                            { name: 'size', value: '45' },
                            { name: 'color', value: '4' }, /* Auto */
                            {
                                name: 'annotations',
                                value: new Utils.MapAnnotationArrayConverter().convertToString([
                                    new MapAnnotation({ areaName: t.mapAnnotation1Name, areaCode: 'US', density: MapAnnotationDensity.hight, baseColor: ColorType.accent1, tooltip: t.mapAnnotation1Tooltip })
                                ])
                            }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.table,
                        name: terminology.elementTypes.table,
                        position: Ifly.Models.ElementPosition.free,
                        offset: {
                            left: 640,
                            top: 150,
                            viewport: this.getViewportDimensions()
                        },
                        properties: [
                            {
                                name: 'data',
                                value: new Ifly.Utils.DataTableConverter().convertToString(new DataTable({
                                    columns: [{ name: t.tableColumn0 }, { name: t.tableColumn1 }],
                                    rows: [
                                        { cells: [{ value: t.tableRow0Column0 }, { value: '28.01%' }], mark: true },
                                        { cells: [{ value: t.tableRow1Column0 }, { value: '5.21%' }] },
                                        { cells: [{ value: t.tableRow2Column0 }, { value: '3.88%' }] },
                                        { cells: [{ value: t.tableRow3Column0 }, { value: '3.86%' }] },
                                        { cells: [{ value: t.tableRow4Column0 }, { value: '3.83%' }] }
                                    ]
                                }))
                            }
                        ]
                    })
                ]
            }
        }
    }

    /** Represents image and text template. */
    export class ImageAndTextTemplate extends SlideTemplateBase {
        /**
         * Initializes a new instance of an object.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        constructor(id: string, name: string) {
            super(id, name);
        }

        /** Returns layout tumbnail HTML. */
        public getThumbnailHtml(): string {
            return '<div class="l-element l-accent l-image"><i class="icon icon-picture"></i></div><div class="l-element l-text"></div>';
        }

        /** Returns layout. */
        public getLayout(): ITemplateLayout {
            var terminology = Ifly.App.getInstance().components['TemplateSelector'].terminology,
                t = terminology.templateData['image-and-text'];
            
            return {
                title: t.title,
                elements: [
                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.text,
                        name: terminology.elementTypes.text,
                        position: Ifly.Models.ElementPosition.top,
                        properties: [
                            { name: 'text', value: t.text },
                            { name: 'isRichText', value: 'true' },
                            { name: 'textType', value: '0' }
                        ]
                    }),

                    new Ifly.Models.Element({
                        type: Ifly.Models.ElementType.image,
                        name: terminology.elementTypes.image,
                        position: Ifly.Models.ElementPosition.top,
                        properties: [
                            { name: 'sourceType', value: ImageSourceType.url.toString() },
                            { name: 'url', value: 'https://upload.wikimedia.org/wikipedia/en/8/80/Wikipedia-logo-v2.svg' },
                            { name: 'width', value: '20' }
                        ]
                    })
                ]
            }
        }
    }

    /** Represents a template manager. */
    export class TemplateManager extends Component {
        private _slideTemplates: ISlideTemplate[];

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);
        }

        /** Returns all slide templates. */
        public getSlideTemplates(): ISlideTemplate[]{
            var ret = [], template = null, terminology = null;
            
            if (!this._slideTemplates) {
                if (this.editor.user && this.editor.user.subscription) {
                    this._slideTemplates = [];

                    if (this.editor.user.subscription.type() != SubscriptionType.basic) {
                        terminology = Ifly.App.getInstance().components['TemplateSelector'].terminology.templates;

                        for (var p in terminology) {
                            if (terminology.hasOwnProperty(p)) {
                                template = this.createSlideTemplate(p, terminology[p]);

                                if (template) {
                                    this._slideTemplates.push(template);
                                }
                            }
                        }
                    }

                    ret = this._slideTemplates;
                }
            } else {
                ret = this._slideTemplates;
            }

            return ret;
        }

        /**
         * Creates slide template.
         * @param {string} id Template Id.
         * @param {string} name Template name.
         */
        public createSlideTemplate(id: string, name?: string): ISlideTemplate {
            var ret = null;

            if (this.editor.user.subscription.type() != SubscriptionType.basic) {
                if (id == 'title-only') {
                    ret = new TitleOnlyTemplate(id, name);
                } else if (id == 'text-only') {
                    ret = new TextOnlyTemplate(id, name);
                } else if (id == 'title-and-chart') {
                    ret = new TitleAndChartTemplate(id, name);
                } else if (id == 'fact-and-figure') {
                    ret = new FactsAndFigureTemplate(id, name);
                } else if (id == 'fact-and-chart') {
                    ret = new FactsAndChartTemplate(id, name);
                } else if (id == 'map-and-table') {
                    ret = new MapAndTableTemplate(id, name);
                } else if (id == 'image-and-text') {
                    ret = new ImageAndTextTemplate(id, name);
                } else if (id == 'blank') {
                    ret = new BlankTemplate(id, name);
                }
            }

            return ret;
        }
    }
} 