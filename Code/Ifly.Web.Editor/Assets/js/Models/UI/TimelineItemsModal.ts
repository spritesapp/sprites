/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />
/// <reference path="DataTableView.ts" />

module Ifly.Models.UI {
    /** Represents a timeline item data. */
    export class TimelineItems implements IModel {
        /** Gets or sets timeline items. */
        public items: DataTableView;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {object} container DOM element which corresponds to a view container.
         */
        constructor(data?: any, container?: any) {
            this.items = new DataTableView(null, container, {
                events: {
                    newRow: cells => {
                        /* This says "Pre-select 'Active' trigger on 'Style' cell." */
                        cells[3].value = TimelineItemStyle.active;
                    }
                }
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var c = Ifly.App.getInstance().components['TimelineItemsModal'];

            data = data || {};

            this.items.load({
                data: {
                    columns: [
                        { name: c.terminology.columnLabel, cssClass: 'timeline-label' },
                        { name: c.terminology.columnDescription, cssClass: 'timeline-description' },
                        { name: c.terminology.columnSize, cssClass: 'timeline-size', inputType: DataColumnCellInputType.percentage },
                        { name: c.terminology.columnStyle, cssClass: 'timeline-style', inputType: DataColumnCellInputType.styles }
                    ],

                    rows: ko.utils.arrayMap(data.items || data.Items || [], (b: any) => {
                        return {
                            cells: [
                                { value: b.label || b.Label || '' },
                                { value: b.description || b.Description || '' },
                                { value: b.size || b.Size || 100 },
                                { value: b.style || b.Style || 0 }
                            ]
                        };
                    }),

                    extensions: {
                        cells: {
                            percentage: 'auto'
                        }
                    }
                }
            });
        }

        /**  Serializes object state. */
        public serialize() {
            var tab = this.items.serialize(),
                rows = ko.utils.arrayFilter(tab.data.rows, (r: any) => {
                    return (r.cells[0].value != null && r.cells[0].value.length > 0) ||
                        (r.cells[1].value != null && r.cells[1].value.length > 0);
                });

            return {
                items: ko.utils.arrayMap(rows, r => {
                    var cells = r.cells;

                    return {
                        label: cells[0].value,
                        description: cells[1].value,
                        size: cells[2].value,
                        style: parseInt(cells[3].value, 10)
                    };
                })
            };
        }
    }

    /** Represents a timeline items modal. */
    export class TimelineItemsModal extends ModalForm<TimelineItems> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: TimelineItemsModal;

        /** Gets or sets an optional callback that is called when timeline items are saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#timeline-items', () => {
                return new TimelineItems(null, this.container.find('.data-table-view'));
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['TimelineItemsModal'];

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

            Ifly.App.getInstance().trackEvent('discover', 'timeline editor');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize();

            Ifly.App.getInstance().trackEvent('act', 'timeline editor');

            if (this._saved) {
                this._saved(serialized);
                this._saved = null;
            }

            this.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): TimelineItemsModal {
            if (!this._instance) {
                this._instance = new TimelineItemsModal();
            }

            return this._instance;
        }
    }
}