/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents shortcut data. */
    export class ShortcutData implements IModel {
        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
        }

        /** Serializes object state. */
        public serialize() {
            return {
            };
        }
    }

    /** Represents shortcut modal. */
    export class ShortcutModal extends ModalForm<ShortcutData> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: ShortcutModal;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#shortcut-modal', () => { return new ShortcutData(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), c = app.components['ShortcutModal'];

            super.load(data);

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    buttons: [
                        {
                            text: c.terminology.close,
                            click: () => { this.cancel(); }
                        }
                    ]
                });
            } else {
                this.modal.updateButtons();
                this.modal.open();
            }

            this.enabled(true);

            setTimeout(() => {
                this.container.find('.keyboard-shortcuts .modifier')
                    .text(Ifly.App.getInstance().browser.mac ? 'Cmd' : 'Ctrl');
            }, 50);
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): ShortcutModal {
            if (!this._instance) {
                this._instance = new ShortcutModal();
            }

            return this._instance;
        }
    }
}  