/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />
/// <reference path="DataTableView.ts" />

module Ifly.Models.UI {
    /** Represents a data source settings. */
    export class DataSourceSettings implements IModel {
        /** Gets or sets the records. */
        public records: DataTableView;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {object} container DOM element which corresponds to a view container.
         */
        constructor(data?: any, container?: any) {
            this.records = new DataTableView(null, container);

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.records.load({ data: data.records || data.Records || DataTable.createEmpty() }, data.options || {
                allowRichText: Ifly.Editor.getInstance().user.subscription.type() !=
                    SubscriptionType.basic
            });
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                records: DataTable.trim(this.records.data)
            };
        }
    }

    /** Represents a data source settings modal. */
    export class DataSourceSettingsModal extends ModalForm<DataSourceSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: DataSourceSettingsModal;

        /** Gets or sets an optional callback that is called when data is saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#datasource-settings', () => {
                return new DataSourceSettings(null, this.container.find('.data-table-view'));
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['DataSourceSettingsModal'], propagateAllowRichText = obj => {
                    if (obj) {
                        if (!obj.options) {
                            obj.options = {};
                        }

                        obj.options.allowRichText = !!o.allowRichText;
                    }
                };

            propagateAllowRichText(data);
            
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
                this.modal.open();
            }

            this.enabled(true);

            Ifly.App.getInstance().trackEvent('discover', 'table editor');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize(),
                editor = Ifly.Editor.getInstance();
            
            Ifly.App.getInstance().trackEvent('act', 'table editor');

            if (this._saved) {
                this._saved(serialized);
                this._saved = null;
            }
            
            this.close();
        }

        /** Opens data import dialog. */
        public openDataImportDialog() {
            DataImportModal.getInstance().open(null, {
                save: result => {
                    this.data.load({ records: result.data });
                }
            });
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): DataSourceSettingsModal {
            if (!this._instance) {
                this._instance = new DataSourceSettingsModal();
            }

            return this._instance;
        }
    }
}