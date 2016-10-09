/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />
/// <reference path="DataTableView.ts" />

module Ifly.Models.UI {
    /** Represents a progress bars data. */
    export class ProgressBars implements IModel {
        /** Gets or sets progress bars. */
        public bars: DataTableView;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {object} container DOM element which corresponds to a view container.
         */
        constructor(data?: any, container?: any) {
            this.bars = new DataTableView(null, container);

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var c = Ifly.App.getInstance().components['ProgressBarsModal'];

            data = data || {};

            this.bars.load({
                data: {
                    columns: [
                        { name: c.terminology.columnDescription, cssClass: 'progress-description' },
                        { name: c.terminology.columnPercentage, cssClass: 'progress-percentage', inputType: DataColumnCellInputType.percentage },
                        { name: c.terminology.columnColor, cssClass: 'progress-color', inputType: DataColumnCellInputType.color }
                    ],

                    rows: ko.utils.arrayMap(data.bars || data.Bars || [], (b: any) => {
                        return {
                            cells: [
                                { value: b.description || b.Description || '' },
                                { value: b.percentage || b.Percentage || 0 },
                                { value: b.color || b.Color || 0 }
                            ]
                        };
                    })
                }
            });
        }

        /**  Serializes object state. */
        public serialize() {
            var tab = this.bars.serialize(),
                rows = ko.utils.arrayFilter(tab.data.rows, (r: any) => {
                    return (r.cells[0].value != null && r.cells[0].value.length > 0) ||
                        (r.cells[1].value != null && r.cells[1].value.length > 0);
                });

            return {
                bars: ko.utils.arrayMap(rows, r => {
                    var cells = r.cells;

                    return {
                        description: cells[0].value,
                        percentage: parseInt(cells[1].value, 10),
                        color: parseInt(cells[2].value, 10)
                    };
                })
            };
        }
    }

    /** Represents a progress bars modal. */
    export class ProgressBarsModal extends ModalForm<ProgressBars> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: ProgressBarsModal;

        /** Gets or sets an optional callback that is called when progress bars are saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#progress-bars', () => {
                return new ProgressBars(null, this.container.find('.data-table-view'));
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['ProgressBarsModal'];

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

            Ifly.App.getInstance().trackEvent('discover', 'progress bar editor');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize();

            Ifly.App.getInstance().trackEvent('act', 'progress bar editor');

            if (this._saved) {
                this._saved(serialized);
                this._saved = null;
            }

            this.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): ProgressBarsModal {
            if (!this._instance) {
                this._instance = new ProgressBarsModal();
            }

            return this._instance;
        }
    }
}