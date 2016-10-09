/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />
/// <reference path="DataImportModal.ts" />

module Ifly.Models.UI {
    /** Represents realtime element property. */
    export class RealtimeElementProperty {
        /** Gets or sets property name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets value indicating whether field is required. */
        public required: KnockoutObservable<boolean>;

        /** Gets or sets the mapping. */
        public mapping: KnockoutObservable<string>;

        /** Gets or sets the realtime data settings. */
        public settings: RealtimeDataSettings;

        /** Gets or sets the real value of the property (used to make type-ahead work with mappings). */
        public realValue: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {Ifly.Utils.IElementSchemaField} field Field schema.
         * @param {RealtimeDataSettings} settings Settings.
         */
        constructor(field: Ifly.Utils.IElementSchemaField, settings: RealtimeDataSettings) {
            this.name = ko.observable<string>(field.name);
            this.required = ko.observable<boolean>(!!field.required);
            this.mapping = ko.observable<string>();
            this.realValue = ko.observable<string>();

            this.settings = settings;

            this.mapping.subscribe(v => {
                if (!v || !v.length) {
                    settings.mapping(this.name(), '');
                }
            });

            this.realValue.subscribe(v => {
                settings.mapping(this.name(), v);
            });
        }

        /**
         * Performs mapping suggestion.
         * @param {string} value Value.
         */
        public suggest(value: string): Ifly.Utils.IListItem[]{
            return this.settings.suggestMappings(value);
        }
    }
    
    /** Represents a realtime data settings. */
    export class RealtimeDataSettings extends DataImportSettings {
        /** Gets or sets element type name. */
        public elementTypeName: KnockoutObservable<string>;

        /** Gets or sets element properties. */
        public elementProperties: KnockoutObservableArray<RealtimeElementProperty>;

        /** Gets or sets value indicating whether target element's data is matrix. */
        public isArrayElement: KnockoutObservable<boolean>;

        /** Gets or sets element type. */
        private _elementType: number;

        /** Gets or sets element Id. */
        private _id: number;

        /** Gets or sets slide Id. */
        private _slideId: number;

        /** Gets or sets the mappings. */
        private _mappings: Utils.IQueryParameter[];

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {object} container DOM element which corresponds to a view container.
         */
        constructor(data?: any, container?: any) {
            this.elementTypeName = ko.observable<string>();
            this.elementProperties = ko.observableArray<RealtimeElementProperty>();
            this.isArrayElement = ko.observable<boolean>();
            this._mappings = [];

            super(data, container, {
                validateAgainstElementType: () => {
                    return this._elementType;
                }
            });

            this.googleAnalytics.anyData.addEventListener('valueChanged', (sender, e) => {
                this.parameter('anydata-' + e.name, e.value);
            });

            this.googleAnalytics.anyData.suggestionService = {
                suggestItems: (name, value, exactMatch?) => {
                    var items = name == 'dimension' ? this.googleAnalytics.suggestDimensions(value, exactMatch) :
                        this.googleAnalytics.suggestMetrics(value, exactMatch);

                    return ko.utils.arrayMap(items, r => {
                        return {
                            label: r.name,
                            value: r.id
                        };
                    });
                }
            };
        }

        /**
         * Performs mapping suggestion.
         * @param {string} value Value.
         * @param {boolean} exactMatch Value indicating whether to perform exact match.
         */
        public suggestMappings(value: string, exactMatch?: boolean): Ifly.Utils.IListItem[]{
            return this.sourceType() == DataImportSourceType.googleAnalytics ?
                ko.utils.arrayMap(this.googleAnalytics.suggestMetrics(value, exactMatch), r => {
                    return {
                        label: r.name,
                        value: r.id
                    };
                }) : [];
        }

        /**
         * Adds, updates or deletes the given mapping.
         * @param {string} name Mapping source.
         * @param {string} value Mapping target.
         */
        public mapping(name: string, value?: string): string {
            var ret = null, index = -1;

            for (var i = 0; i < this._mappings.length; i++) {
                if (this._mappings[i].name == name) {
                    index = i;
                    break;
                }
            }

            if (typeof (value) === 'undefined' || value === null) {
                if (index >= 0) {
                    ret = this._mappings[index].value;
                }
            } else if (value == '') {
                if (index >= 0) {
                    this._mappings.splice(index, 1);
                }
            } else {
                if (index >= 0) {
                    this._mappings[index].value = value;
                } else {
                    this._mappings[this._mappings.length] = {
                        name: name,
                        value: value
                    };
                }
            }

            return ret;
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var c = Ifly.App.getInstance().components['RealtimeDataModal'],
                schema = null, matchingMappings = [], props = [], loadAnyDataValue = null;

            data = data || {};

            super.load(data);
            this._mappings = Utils.Input.deserializeQuery(this.parameter('mappings'), ',', '-');

            if (this.sourceType() === null || this.sourceType() === DataImportSourceType.excel) {
                this.sourceType(DataImportSourceType.google);
            }

            this.elementProperties.removeAll();
            this.isArrayElement(false);

            this._id = data.id;
            this._slideId = data.slideId;
            this._elementType = data.type;

            if (typeof (data.type) !== 'undefined' && data.type >= 0) {
                this.elementTypeName(c.terminology.elementTypeNames[Models.ElementType[data.type]]);

                schema = Ifly.Utils.Input.getImportableElementSchema(data.type);

                this.isArrayElement(!!(schema || {}).isArrayElement);

                if (schema && schema.fields) {
                    ko.utils.arrayForEach(schema.fields, f => {
                        this.elementProperties.push(new RealtimeElementProperty(<any>f, this));
                    });
                }
            } else {
                this.elementTypeName('');
            }

            if (this.sourceType() === DataImportSourceType.google) {
                this.google.url(data.endpoint || '');
            } else if (this.sourceType() == DataImportSourceType.url) {
                this.url.url(data.endpoint || '');
            } else if (this.sourceType() == DataImportSourceType.googleAnalytics) {
                this.googleAnalytics.profileId(this.parameter('profileId'));
                this.googleAnalytics.selectPeriod(parseInt(this.parameter('selectPeriod'), 10));

                this.googleAnalytics.loadDimensionsAndMetrics(() => {
                    props = this.elementProperties();

                    ko.utils.arrayForEach(props, prop => {
                        matchingMappings = this.suggestMappings(this.mapping(prop.name()), true);

                        if (matchingMappings.length == 1) {
                            prop.mapping(matchingMappings[0].label);
                            prop.realValue(matchingMappings[0].value);
                        }
                    });

                    this.googleAnalytics.anyData.dimension.realValue(this.parameter('anydata-dimension'));
                    this.googleAnalytics.anyData.metric.realValue(this.parameter('anydata-metric'));

                    loadAnyDataValue = (n, v) => {
                        var matchedItems = this.googleAnalytics.anyData.suggestionService.suggestItems(n, v.realValue(), true);

                        if (matchedItems.length == 1) {
                            v.value(matchedItems[0].label);
                            v.realValue(matchedItems[0].value);
                        }
                    };

                    loadAnyDataValue('dimension', this.googleAnalytics.anyData.dimension);
                    loadAnyDataValue('metric', this.googleAnalytics.anyData.metric);
                });
            }
        }

        /**  Serializes object state. */
        public serialize() {
            var p = null, endpoint = null, t = null;

            this.parameter('mappings', Utils.Input.serializeQuery(this._mappings, ',', '-'));

            p = super.serialize();
            t = this.sourceType();

            if (t == DataImportSourceType.google) {
                endpoint = this.google.url();
            } else if (t == DataImportSourceType.url) {
                endpoint = this.url.url();
            }

            return {
                type: t,
                data: null,
                id: this._id,
                sourceType: t,
                endpoint: endpoint,
                parameters: p.parameters,
                slideId: this._slideId
            };
        }
    }

    /** Represents a realtime data modal. */
    export class RealtimeDataModal extends ModalForm<RealtimeDataSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: RealtimeDataModal;

        /** Gets or sets an optional callback that is called when data is saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#realtime-data-import', () => {
                return new RealtimeDataSettings(null, this.container);
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['RealtimeDataModal'];

            super.load(data);

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    title: this.data.elementTypeName() + ': ' + c.terminology.title,
                    content: this.container,
                    buttons: [
                        {
                            text: c.terminology.save,
                            click: () => { this.save(); }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this.cancel(); }
                        }
                    ]
                });
            } else {
                this.modal.updateButtons();

                this.modal.open({
                    title: this.data.elementTypeName() + ': ' + c.terminology.title
                });
            }

            this.enabled(true);

            Ifly.App.getInstance().trackEvent('discover', 'real-time data');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize(),
                c = Ifly.App.getInstance().components['RealtimeDataModal'];

            Ifly.App.getInstance().trackEvent('act', 'real-time data');

            if (this._saved) {
                this.modal.updateButtons({
                    primary: {
                        text: c.terminology.saving,
                        enabled: false
                    },
                    secondary: {
                        enabled: false
                    }
                });

                this._saved(serialized, () => {
                    this._saved = null;
                    this.close();
                });
            } else {
                this.close();
            }
        }

        /** Closes the window. */
        public close() {
            this.data.reset();
            super.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): RealtimeDataModal {
            if (!this._instance) {
                this._instance = new RealtimeDataModal();
            }

            return this._instance;
        }
    }
}