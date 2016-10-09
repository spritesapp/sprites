/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />
/// <reference path="DataTableView.ts" />

module Ifly.Models.UI {
    /** Represents a map annotations data. */
    export class MapAnnotations implements IModel {
        /** Gets or sets map annotations. */
        public annotations: DataTableView;

        /** Gets or sets the map type. */
        public mapType: MapType;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {object} container DOM element which corresponds to a view container.
         */
        constructor(data?: any, container?: any) {
            this.annotations = new DataTableView(null, container);

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var c = Ifly.App.getInstance().components['MapAnnotationsModal'];

            data = data || {};

            this.mapType = data.mapType || data.MapType || 0;

            this.annotations.load({
                data: {
                    columns: [
                        { name: c.terminology.columnArea, cssClass: 'annotation-area', inputType: DataColumnCellInputType.predictable },
                        { name: c.terminology.columnTooltip, cssClass: 'annotation-tooltip' },
                        { name: c.terminology.columnDensity, cssClass: 'annotation-density', inputType: DataColumnCellInputType.grades },
                        { name: c.terminology.columnBaseColor, cssClass: 'annotation-basecolor', inputType: DataColumnCellInputType.color }
                    ],

                    rows: ko.utils.arrayMap(data.annotations || data.Annotations || [], (a: any) => {
                        return {
                            cells: [
                                {
                                    value: a.areaName || a.AreaName || '',
                                    realValue: a.areaCode || a.AreaCode || ''
                                },
                                { value: a.tooltip || a.Tooltip || '' },
                                { value: a.density || a.Density || '0' },
                                { value: a.baseColor || a.BaseColor || 0 }
                            ]
                        };
                    }),

                    extensions: {
                        cells: {
                            suggest: (value) => {
                                return this.suggestAreas(value);
                            }
                        }
                    }
                }
            });
        }

        /**  Serializes object state. */
        public serialize() {
            var tab = this.annotations.serialize(),
                rows = ko.utils.arrayFilter(tab.data.rows, (r: any) => {
                    return (r.cells[0].value != null && r.cells[0].value.length > 0) ||
                        (r.cells[1].value != null && r.cells[1].value.length > 0);
                }),
                ensureCode = (c, l) => {
                    var result = c, suggestions = [];

                    if (!result || !result.length) {
                        suggestions = this.suggestAreas(l);
                        if (suggestions.length) {
                            result = suggestions[0].value;
                        }
                    }

                    return result;
                };

            return {
                annotations: ko.utils.arrayMap(rows, r => {
                    var cells = r.cells;

                    return {
                        areaName: cells[0].value,
                        areaCode: ensureCode(cells[0].realValue, cells[0].value),
                        tooltip: cells[1].value,
                        density: parseInt(cells[2].value, 10),
                        baseColor: parseInt(cells[3].value, 10)
                    };
                }),

                mapType: this.mapType
            };
        }

        /** 
         * Suggests areas
         * @param {string} value Value to suggest based on.
         */
        private suggestAreas(value: string): any[]{
            var map = (<any>jQuery).VectorMap[MapType[this.mapType]],
                max = 5, p = null, ret = [], valueLowered = value.toLowerCase();

            if (map && map.paths) {
                for (var code in map.paths) {
                    p = map.paths[code];

                    if (typeof (p) != 'function' && p.name) {
                        if (p.name.toLowerCase().indexOf(valueLowered) == 0) {
                            ret.push({ label: p.name, value: code });

                            if (ret.length == max) {
                                break;
                            }
                        }
                    }
                }
            }
            
            return ret;
        }
    }

    /** Represents a map annotations modal. */
    export class MapAnnotationsModal extends ModalForm<MapAnnotations> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: MapAnnotationsModal;

        /** Gets or sets an optional callback that is called when annotations are saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#map-annotations', () => {
                return new MapAnnotations(null, this.container.find('.data-table-view'));
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['MapAnnotationsModal'];

            super.load(data);

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    buttons: [
                        {
                            text: c.terminology.ok,
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
                this.modal.open();
            }

            Ifly.App.getInstance().trackEvent('discover', 'map editor');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize();

            Ifly.App.getInstance().trackEvent('act', 'map editor');

            if (this._saved) {
                this._saved(serialized);
                this._saved = null;
            }

            this.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): MapAnnotationsModal {
            if (!this._instance) {
                this._instance = new MapAnnotationsModal();
            }

            return this._instance;
        }
    }
}