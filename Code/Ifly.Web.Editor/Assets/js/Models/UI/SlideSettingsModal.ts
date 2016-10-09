/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Slide.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents slide settings. */
    export class SlideSettings implements IModel {
        /** Gets or sets the slide Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the slide title. */
        public title: KnockoutObservable<string>;

        /** Gets or sets the slide description. */
        public description: KnockoutObservable<string>;

        /** Gets or sets templates. */
        public templates: TemplateSelector;

        /** Gets or sets the slide play time. */
        public playbackTime: KnockoutObservable<number>;

        /** Gets or sets value indicating whether th show playback settings. */
        public showPlaybackSettings: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether new slide is being created. */
        public isNew: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether to use description. */
        public useDescription: KnockoutObservable<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.title = ko.observable<string>();
            this.description = ko.observable<string>();
            this.templates = new TemplateSelector($('#template-selector'));
            this.playbackTime = ko.observable<number>();
            this.isNew = ko.observable<boolean>(true);
            this.showPlaybackSettings = ko.observable<boolean>();
            this.useDescription = ko.observable<boolean>();

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
            this.isNew(data.id <= 0);
            this.description(data.description);
            this.playbackTime(data.playbackTime);
            this.showPlaybackSettings(data.playbackTime > 0);
            this.templates.selectedTemplate(this.templates.templates()[0]);
            this.useDescription(Ifly.Editor.getInstance().presentation.useSlideDescription() == PresentationSlideDescriptionType.always);

            if (!this.useDescription() && this.description() && this.description().length) {
                this.useDescription(true);
            }
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                title: this.title(),
                description: this.description(),
                playbackTime: this.playbackTime(),
                template: this.templates.selectedTemplate() ? this.templates.selectedTemplate().id : null,
                useDescription: this.useDescription()
            };
        }

        /** Begins cloning slide. */
        public beginCloneSlide() {
            SlideSettingsModal.getInstance().modal.close();

            Ifly.Editor.getInstance().slides.beginCloneSlide(this);
        }
    }

    /** Represents a slide settings modal dialog. */
    export class SlideSettingsModal extends ModalForm<SlideSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: SlideSettingsModal;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#slide-settings', () => { return new SlideSettings(); });

            this.enabled.subscribe((v) => {
                this.data.templates.enabled(v);
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['SlideSettingsModal'];

            super.load(data);

            if (!o.focus) {
                o.focus = 'title';
            }

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    title: () => { return this.data.id() > 0 ? c.terminology.editSlide : c.terminology.newSlide; },
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
                    $('#slide-' + o.focus).focus();
                } catch (ex) { }
            }, 100);

            Ifly.App.getInstance().trackEvent('discover', 'slide settings');
        }

        /** Saves the data. */
        public save() {
            var editor = Ifly.Editor.getInstance(), isNew = this.data.id() <= 0,
                c = Ifly.App.getInstance().components['SlideSettingsModal'], onUpdated = null;

            Ifly.App.getInstance().trackEvent('act', 'slide settings');

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

                editor.slides.saveSlide(this.data, (slide: any) => {
                    onUpdated = () => {
                        this.enabled(true);
                        this.modal.updateButtons();

                        this.close();
                    };

                    editor.slides.onSlideUpdated(slide);

                    if (isNew && this.data.templates.selectedTemplate() != null) {
                        editor.slides.applySlideTemplate(this.data.templates.selectedTemplate(), onUpdated);
                    } else {
                        onUpdated();
                    }
                });
            }
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): SlideSettingsModal {
            if (!this._instance) {
                this._instance = new SlideSettingsModal();
            }

            return this._instance;
        }
    }
}