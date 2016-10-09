/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents feedback data. */
    export class FeedbackData implements IModel {
        /** Gets or sets the user name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the user email. */
        public email: KnockoutObservable<string>;

        /** Gets or sets the feedback text. */
        public text: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.name = ko.observable<string>();
            this.email = ko.observable<string>();
            this.text = ko.observable<string>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var user = Ifly.Editor.getInstance().user;

            data = data || {};

            this.name(data.name || data.Name || user.name());
            this.email(data.email || data.Email || user.email());
            this.text(data.text || data.Text || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                name: this.name(),
                email: this.email(),
                text: this.text()
            };
        }
    }

    /** Represents feedback modal. */
    export class FeedbackModal extends ModalForm<FeedbackData> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: FeedbackModal;

        /** Gets or sets an optional callback that is called when feedback is sent. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#feedback-modal', () => { return new FeedbackData(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['FeedbackModal'];

            super.load(data);

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    buttons: [
                        {
                            text: c.terminology.send,
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
                    $('#feedback-text').focus();
                } catch (ex) { }
            }, 100);

            Ifly.App.getInstance().trackEvent('discover', 'contact form');
        }

        /** Saves the data. */
        public save() {
            var c = Ifly.App.getInstance().components['FeedbackModal'],
                serialized = this.data.serialize();

            Ifly.App.getInstance().trackEvent('act', 'contact form');

            if (this.enabled()) {
                this.enabled(false);

                this.modal.updateButtons({
                    primary: {
                        text: c.terminology.oneMoment,
                        enabled: false
                    },
                    secondary: {
                        enabled: false
                    }
                });

                Ifly.App.getInstance().api.post('sessions/feedback', serialized, (success, data) => {
                    this.enabled(true);
                    this.modal.updateButtons();

                    this.close();
                });
            }
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): FeedbackModal {
            if (!this._instance) {
                this._instance = new FeedbackModal();
            }

            return this._instance;
        }
    }
} 