/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Presentation.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />
/// <reference path="DataSourceSettingsModal.ts" />
/// <reference path="ThemeSelector.ts" />

module Ifly.Models.UI {
    /** Represents existing presentation list item. */
    export interface ExistingPresentationListItem {
        /** Gets or sets presentation Id. */
        id: number;

        /** Gets or sets presentation name. */
        name: string;

        /** Gets or sets presentation URL. */
        url: string;
    }

    /** Represents presentation settings. */
    export class PresentationSettings implements IModel {
        /** Gets or sets the presentation Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the presentation title. */
        public title: KnockoutObservable<string>;

        /** Gets or sets the name of the theme for this presentation. */
        public theme: KnockoutObservable<string>;

        /** Gets or sets the presentation background image. */
        public backgroundImage: KnockoutObservable<string>;

        /** Gets or sets background image selector. */
        public backgroundImageSelector: ImageSelector;

        /** Gets or sets value indicating whether new presentation is being created. */
        public isNew: KnockoutObservable<boolean>;

        /** Gets or sets existing presentations. */
        public existingPresentations: KnockoutObservableArray<ExistingPresentationListItem>;

        /** Gets or sets the theme selector. */
        public themes: ThemeSelector;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.title = ko.observable<string>();
            this.theme = ko.observable<string>();
            this.backgroundImage = ko.observable<string>();
            this.backgroundImageSelector = new ImageSelector();
            this.isNew = ko.observable<boolean>(true);
            this.existingPresentations = ko.observableArray<ExistingPresentationListItem>();
            
            this.backgroundImageSelector.addEventListener('imageChanged', (sender, args) => {
                this.backgroundImage(args.image);
            });

            this.themes = new ThemeSelector($('#theme-selector'));
            this.themes.addEventListener('themeChanged', (sender, args) => {
                this.theme(args.theme);
            });

            (<any>this.existingPresentations).enabled = (v: boolean) => {
                var container = $('#existing-presentations');

                if (!v) {
                    container.attr('disabled', 'disabled');
                } else {
                    container.removeAttr('disabled');
                }
            };

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
            this.theme(data.theme);
            
            this.backgroundImage(data.backgroundImage);
            this.themes.theme(data.theme || 'white');
            this.isNew(data.id <= 0);
            
            this.backgroundImageSelector.image(this.backgroundImage());

            this.existingPresentations.removeAll();

            ko.utils.arrayForEach(PresentationSettings.getExistingPresentations(), p => {
                this.existingPresentations.push(p);
            });
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                title: this.title(),
                theme: this.theme(),
                backgroundImage: this.backgroundImage(),
                slide: null
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

            this.disableAndNavigate(e, data.url);
        }

        /** 
         * Occurs when existing presentation is selected.
         * @param {object} data Data.
         * @param {object} e Event object.
         */
        public onMyAccountClicked(data: any, e: any) {
            this.disableAndNavigate(e, '/account');
        }

        /** Begins cloning presentation. */
        public beginClonePresentation() {
            PresentationSettingsModal.getInstance().modal.close();

            Ifly.Editor.getInstance().clone();
        }

        /**
         * Returns existing presentations.
         */
        static getExistingPresentations(): ExistingPresentationListItem[]{
            var items = null, item = null, ret = [];

            items = $('.user-menu .all-presentations li.presentation-table-row:not(.um-hide) .col-link a');

            if (items.length) {
                for (var i = 0; i < items.length; i++) {
                    item = $(items[i]);

                    if (!item.parents('.archived-presentation').length) {
                        ret.push({
                            name: item.text(),
                            url: item.attr('href'),
                            id: parseInt(item.attr('data-presentation-id'), 10)
                        });
                    }
                }
            }

            return ret;
        }
      
        /**
         * Disables the form and navigates to the given URL.
         * @param {object} e Event object.
         * @param {string} url URL to navigate to.
         */
        private disableAndNavigate(e: any, url: string) {
            var t = $(e.target), app = Ifly.App.getInstance();
            
            t.parents('.modal-content-outer').find('button.primary').attr('disabled', 'disabled').text(app.terminology.oneMoment);

            location.href = url;
        }
    }

    /** Represents a presentation settings modal dialog. */
    export class PresentationSettingsModal extends ModalForm<PresentationSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: PresentationSettingsModal;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#presentation-settings', () => { return new PresentationSettings(); });

            this.enabled.subscribe((v) => {
                this.data.themes.enabled(v);
                (<any>this.data.existingPresentations).enabled(v);
            });
        }

        /**
         * Switches the "visible" state of the modal.
         * @param {boolean} isVisible Value indicating whether modal is visible.
         */
        public setVisible(isVisible: boolean) {
            this.container.parents('.modal-window').css('opacity', isVisible ? 1 : 0);
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         */
        public open(data?: any) {
            var app = Ifly.App.getInstance(),
                c = app.components['PresentationSettingsModal'];

            super.load(data);

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    title: () => { return this.data.id() > 0 ? c.terminology.presentationSettings : c.terminology.newPresentation; },
                    buttons: [
                        {
                            text: () => { return this.data.id() > 0 ? c.terminology.save : c.terminology.createPresentation; },
                            click: () => { this.save(); }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this.cancel(); },
                            visible: () => { return this.data.id() > 0; }
                        }
                    ],

                    closeOnEscape: () => { return this.data.id() > 0; }
                });
            } else {
                this.modal.updateButtons();
                this.modal.open();
            }

            this.enabled(true);

            setTimeout(() => {
                try {
                    $('#presentation-title').focus();
                } catch (ex) { }
            }, 100);

            Ifly.App.getInstance().trackEvent('discover', 'presentation settings');
        }

        /** Saves the data. */
        public save() {
            var c = Ifly.App.getInstance().components['PresentationSettingsModal'],
                editor = Ifly.Editor.getInstance(),
                serialized = this.data.serialize();
            
            Ifly.App.getInstance().trackEvent('act', 'presentation settings');

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

                Ifly.App.getInstance().api.update('presentations/{id}/settings', serialized, (success, data) => {
                    this.enabled(true);
                    this.modal.updateButtons();

                    serialized.id = parseInt((data && (typeof (data.id) != 'undefined' ||
                        typeof (data.Id) != 'undefined') ? (data.id || data.Id) : data), 10) || 0;

                    serialized.slide = data ? (data.slide || data.Slide) : null;

                    this.close();

                    editor.onPresentationAvailable(serialized, true);

                    editor.dispatchEvent('settingsUpdated', {
                        settings: new Ifly.Models.Presentation(serialized)
                    });
                });
            }
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): PresentationSettingsModal {
            if (!this._instance) {
                this._instance = new PresentationSettingsModal();
            }

            return this._instance;
        }
    }
}