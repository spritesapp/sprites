/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Slide.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents slide settings. */
    export class CloneSlideSettings implements IModel {
        /** Gets or sets the source slide Id. */
        public sourceSlideId: KnockoutObservable<number>;

        /** Gets or sets the slide title. */
        public title: KnockoutObservable<string>;

        /** Gets or sets existing presentations. */
        public existingPresentations: KnockoutObservableArray<ExistingPresentationListItem>;

        /** Gets or sets value indicating whether to show "Target infographic" drop-down list. */
        public showTargetPresentationDropDown: KnockoutObservable<boolean>;

        /** Gets or sets the target presentation Id. */
        public targetPresentationId: KnockoutObservable<number>;

        /** Gets or sets the target presentation title. */
        private targetInfographicTitle: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.sourceSlideId = ko.observable<number>();
            this.title = ko.observable<string>();
            this.existingPresentations = ko.observableArray<ExistingPresentationListItem>();
            this.showTargetPresentationDropDown = ko.observable<boolean>();
            this.targetPresentationId = ko.observable<number>();
            this.targetInfographicTitle = ko.observable<string>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var p = Ifly.Editor.getInstance().presentation;

            data = data || {};

            this.sourceSlideId(data.sourceSlideId);
            this.title(data.title);

            this.targetPresentationId(p.id());
            this.targetInfographicTitle(p.title());

            this.existingPresentations.removeAll();
            this.showTargetPresentationDropDown(false);

            ko.utils.arrayForEach(PresentationSettings.getExistingPresentations(), p => {
                this.existingPresentations.push(p);
            });
        }

        /** Serializes object state. */
        public serialize() {
            return {
                sourceSlideId: this.sourceSlideId(),
                targetPresentationId: this.targetPresentationId(),
                title: this.title()
            };
        }

        /** 
         * Occurs when existing presentation is selected.
         * @param {object} data Data.
         * @param {object} e Event object.
         */
        public onPresentationSelected(data: any, e: any) {
            var t = $(e.target);

            t.parents('.dropdown').blur().find('.dropdown-active').text(t.text());

            this.targetPresentationId(data.id);
            this.targetInfographicTitle(data.name);
        }
    }

    /** Represents a slide settings modal dialog. */
    export class CloneSlideModal extends ModalForm<CloneSlideSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: CloneSlideModal;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#clone-slide-modal', () => { return new CloneSlideSettings(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {}, c = app.components['CloneSlideModal'],
                p = Ifly.Editor.getInstance().presentation, cloneNumber = 0, t = '';

            data = data || {};

            if (p && p.slides().length) {
                for (var i = 0; i < p.slides().length; i++) {
                    t = (p.slides()[i].title() || '').toLowerCase();

                    if (t == (data.title || '').toLowerCase()) {
                        cloneNumber++;
                    }
                }
            }

            data.title = data.title + ' #' + (cloneNumber + 1);

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
                    $('#clone-slide-' + o.focus).focus();
                } catch (ex) { }
            }, 100);

            Ifly.App.getInstance().trackEvent('discover', 'clone slide');
        }

        /** Saves the data. */
        public save() {
            var editor = Ifly.Editor.getInstance(),
                currentPresentationId = editor.presentation.id(),
                c = Ifly.App.getInstance().components['CloneSlideModal'];

            Ifly.App.getInstance().trackEvent('act', 'clone slide');

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

                editor.slides.cloneSlide(this.data, (slide: any) => {
                    this.enabled(true);
                    this.modal.updateButtons();

                    this.close();

                    if (!this.data.targetPresentationId() || this.data.targetPresentationId() == currentPresentationId) {
                        editor.slides.onSlideUpdated(slide);
                    }
                });
            }
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): CloneSlideModal {
            if (!this._instance) {
                this._instance = new CloneSlideModal();
            }

            return this._instance;
        }
    }
}