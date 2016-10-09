/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents presentation settings. */
    export class ClonePresentationSettings implements IModel {
        /** Gets or sets presentation Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the presentation title. */
        public title: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.title = ko.observable<string>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.id(data.id);
            this.title(data.title);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                title: this.title()
            };
        }
    }

    /** Represents a presentation settings modal dialog. */
    export class ClonePresentationModal extends ModalForm<ClonePresentationSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: ClonePresentationModal;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#clone-presentation-modal', () => { return new ClonePresentationSettings(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {}, c = app.components['ClonePresentationModal'];

            data = data || {};

            data.title = data.title + ' #2';

            super.load(data);

            if (!o.focus) {
                o.focus = 'title';
            }

            if (!this.modal) {
                this.modal = app.openModal({
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
                this.modal.open();
            }

            this.enabled(true);

            setTimeout(() => {
                try {
                    $('#clone-presentation-' + o.focus).focus();
                } catch (ex) { }
            }, 100);

            Ifly.App.getInstance().trackEvent('discover', 'clone presentation');
        }

        /** Saves the data. */
        public save() {
            var app = Ifly.App.getInstance(), c = app.components['ClonePresentationModal'],
                serialized = this.data.serialize();

            Ifly.App.getInstance().trackEvent('act', 'clone presentation');

            if (this.enabled()) {
                this.enabled(false);

                this.modal.updateButtons({
                    primary: {
                        text: c.terminology.saving,
                        enabled: false
                    },
                    secondary: {
                        enabled: false
                    }
                });

                app.api.post('presentations/{id}/clone', serialized, (success, data) => {
                    location.href = '/edit/' + data ? (data.id || data.Id) : '';
                });
            }
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): ClonePresentationModal {
            if (!this._instance) {
                this._instance = new ClonePresentationModal();
            }

            return this._instance;
        }
    }
}