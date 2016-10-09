/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    export class ElementLinkSettings implements IModel {
        /** Gets or sets the element Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the slide Id. */
        public slideId: KnockoutObservable<number>;

        /** Gets or sets the zero-based slide index. */
        public slide: KnockoutObservable<number>;

        /** Gets or sets the total number of slides available. */
        public totalSlides: KnockoutObservable<number>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.slideId = ko.observable<number>();
            this.slide = ko.observable<number>();
            this.totalSlides = ko.observable<number>();

            (<any>this.slide).editable = ko.observable<string>();
            (<any>this.slide).editable.subscribe((v) => {
                var parsed = parseInt(v && v.length ? v : null, 10);

                if (!isNaN(parsed)) {
                    if (parsed <= 0) {
                        parsed = 1;
                    } else if (parsed > this.totalSlides()) {
                        parsed = this.totalSlides();
                    }

                    this.slide(parsed - 1);
                } else {
                    this.slide(-1);
                }
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.id(data.id || data.Id || 0);
            this.slideId(data.slideId || data.SlideId || 0);
            this.slide(data.slide != null ? data.slide : (data.Slide != null ? data.Slide : -1));
            this.totalSlides(data.totalSlides || data.TotalSlides || 0);
            (<any>this.slide).editable(this.slide() >= 0 && this.slide() < this.totalSlides() ? (this.slide() + 1).toString() : '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                slideId: this.slideId(),
                slide: this.slide(),
                totalSlides: this.totalSlides()
            };
        }
    }

    /** Represents an element link edit modal. */
    export class ElementLinkModal extends ModalForm<ElementLinkSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: ElementLinkModal;

        /** Gets or sets an optional callback that is called when selection is made. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#element-link-edit', () => { return new ElementLinkSettings(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['ElementLinkModal'];

            super.load(data);

            this._saved = o.save;

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
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize();

            if (this._saved) {
                this._saved(serialized);
                this._saved = null;
            }

            this.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): ElementLinkModal {
            if (!this._instance) {
                this._instance = new ElementLinkModal();
            }

            return this._instance;
        }
    }
}