/// <reference path="Typings/jquery.d.ts" />
/// <reference path="Typings/knockout.d.ts" />
/// <reference path="App.ts" />
/// <reference path="Models/Presentation.ts" />
/// <reference path="Models/Slide.ts" />
/// <reference path="Models/UI/PresentationSettingsModal.ts" />
/// <reference path="Models/UI/SlideSettingsModal.ts" />
/// <reference path="Models/UI/SlideManager.ts" />
/// <reference path="Models/UI/GalleryManager.ts" />
/// <reference path="Models/UI/CompositionManager.ts" />
/// <reference path="Models/UI/PublishManager.ts" />
/// <reference path="Models/UI/UserContextMenu.ts" />

module Ifly {
    /** Represents an editor. */
    export class Editor extends Ifly.EventSource {
        /** Gets or sets the current instance of the editor. */
        private static _instance: Editor;

        /** Gets or sets the initial payload for the editor. */
        private _payload: any;

        /** Gets or sets the sync error modal. */
        private _syncErrorModal: any;

        /** Gets or sets the unsupported browser modal. */
        private _unsupportedBrowserModal: any;

        /** Gets or sets the session ensure timer. */
        private _sessionEnsureTimer: number;

        /** Gets or sets the editor container. */
        public container: any;

        /** Gets or sets the current presentation. */
        public presentation: Ifly.Models.Presentation;

        /** Gets or sets value indicating whether editor is active. */
        public isActive: KnockoutObservable<boolean>;

        /** Gets or sets the slide manager. */
        public slides: Models.UI.SlideManager;

        /** Gets or sets the gallery manager. */
        public gallery: Models.UI.GalleryManager;

        /** Gets or sets the composition manager. */
        public composition: Models.UI.CompositionManager;

        /** Gets or sets the publish manager. */
        public publishing: Models.UI.PublishManager;

        /** Gets or sets the sharing manager. */
        public collaboration: Models.UI.CollaborationManager;

        /** Gets or sets the user context menu. */
        public userMenu: Models.UI.UserContextMenu;

        /** Gets or sets the theme manager. */
        public themes: Models.UI.ThemeManager;

        /** Gets or sets template manager. */
        public templates: Models.UI.TemplateManager;

        /** Gets or sets application user. */
        public user: Models.User;

        /** Represents a help manager. */
        public help: Models.Help.HelpManager;

        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this.presentation = new Ifly.Models.Presentation();
            this.isActive = ko.observable(false);

            this.slides = new Models.UI.SlideManager(this);
            this.gallery = new Models.UI.GalleryManager(this);
            this.composition = new Models.UI.CompositionManager(this);
            this.publishing = new Models.UI.PublishManager(this);
            this.userMenu = new Models.UI.UserContextMenu($('.user-menu'));
            this.themes = new Models.UI.ThemeManager(this);
            this.templates = new Models.UI.TemplateManager(this);
            this.collaboration = new Models.UI.CollaborationManager(this);
            this.help = new Models.Help.HelpManager(this);

            this.user = new Models.User();

            this.container = $('.editor');

            this.presentation.selectedSlideIndex.subscribe(v => {
                var host = this.composition.host;

                if (host.length) {
                    host.find('.canvas').toggleClass('no-slide', v < 0);
                    host.find('.dimmed').toggle(v < 0);
                    host.find('.slide').toggle(v >= 0);
                }
            });
        }

        /** 
         * Initializes the editor.
         * @param {object} options Editor options.
         */
        public initialize(options?: any) {
            var app = null;

            options = options || {};

            if (options.user) {
                this.user.load(options.user);
            }
            
            Utils.BindingHandlerFactory.initializeAllHandlers();

            ko.applyBindings(this, this.container[0]);

            this.isActive(true);

            this.slides.addEventListener('slideSelected', (sender, args) => {
                if (!args.slide && this.gallery.isOpen()) {
                    this.gallery.toggleVisibility();
                }
            });

            this.container.find('.canvas-container').click(() => {
                if (this.gallery.isOpen()) {
                    this.gallery.toggleVisibility();
                }

                if (this.gallery.elementProperties.isOpen() && !this.composition.selectedElement.isBouncing) {
                    this.gallery.elementProperties.toggleVisibility();
                }

                this.composition.clearSelection();
            });

            /* Hiding user context menu when user has clicked outside of it. */
            $(document.body).mousedown((e) => {
                var t = $(e.target);

                if (!t.hasClass('user-menu-activator') && !t.parents('.user-menu-activator').length &&
                    !t.hasClass('user-menu') && !t.parents('.user-menu').length) {

                    this.userMenu.isOpen(false);
                }
            });

            $(document.body).keyup((e) => {
                var code = e.keyCode || e.charCode || e.which,
                    t = $(e.target);

                if (code == 27 && !ModalWindow.getCurrent()) {
                    if (this.gallery.elementProperties.isOpen()) {
                        /* Hiding element properties on ESC */
                        this.gallery.elementProperties.toggleVisibility();
                    }

                    /* Clearing current selection on ESC. */
                    this.composition.clearSelection();
                } else if (code == 8 || code == 46) {
                    if (t.hasClass('element') || t.parents('.element').length) {
                        if (this.composition.getSelection().length) {
                            /* Deleting the current selection. */
                            this.composition.tryDeleteSelection();
                        } else {
                            /* Deleting an element if it's currently active */
                            this.composition.tryDeleteElement(this.composition.findElement(t));
                        }
                    }
                }
            });

            Utils.Input.configureShortcuts(document.body, {
                left: () => { this.composition.selectNextElement(); },
                right: () => { this.composition.selectPreviousElement(); },
                up: () => { this.composition.promoteCurrentElement(); },
                down: () => { this.composition.demoteCurrentElement(); },
                space: () => { this.composition.toggleShowGrid(); },
                paste: e => {
                    var tag = (e.target.tagName || e.target.nodeName || '').toLowerCase();

                    /* Trying to paste the element onto the currently selected slide. */
                    if (tag != 'input' && tag != 'textarea') {
                        this.gallery.pasteElement();
                    }
                },
                del: e => {
                    var tag = (e.target.tagName || e.target.nodeName || '').toLowerCase();

                    /* Trying to delete the currently selected element. */
                    if (tag != 'input' && tag != 'textarea') {
                        if (this.composition.selectedElement && this.composition.selectedElement.element) {
                            this.composition.tryDeleteElement(this.composition.selectedElement.element);
                        }
                    }
                }
            });

            /* In case user navigates through the history, loading the correct presentation */
            window.onpopstate = () => {
                this.reloadPresentation();
            };

            this.onResize();

            $(window).resize(() => {
                this.onResize();
            });

            /* Disabling "Back" history action on Backspace. */
            $(document).on('keydown keypress', e => {
                if (e.keyCode == 8 && !/input|textarea/i.test((<any>e.target).nodeName)) {
                    return false;
                }
            });

            app = Ifly.App.getInstance();

            app.api.onError = (xhr: JQueryXHR) => {
                if (xhr.status == 403) {
                    clearTimeout(this._sessionEnsureTimer);

                    if (!this._syncErrorModal) {
                        this._syncErrorModal = app.openModal({
                            content: $('#sync-error-modal'),
                            replaceCurrent: true,
                            buttons: [
                                {
                                    text: app.terminology.reload,
                                    click: () => {
                                        this._syncErrorModal.updateButtons({
                                            primary: {
                                                enabled: false,
                                                text: app.terminology.oneMoment
                                            }
                                        });

                                        location.href = location.href;
                                    },
                                }
                            ],
                            closeOnEscape: false

                        });
                    } else {
                        this._syncErrorModal.open();
                    }
                }
            };

            if (!app.browser.chrome && !app.browser.firefox) {
                if (!this._unsupportedBrowserModal) {
                    this._unsupportedBrowserModal = app.openModal({
                        content: $('#not-supported-browser-modal'),
                        replaceCurrent: true,
                        buttons: [
                            {
                                text: app.terminology.ok,
                                click: () => {
                                    this._unsupportedBrowserModal.close();
                                },
                            }
                        ],
                        closeOnEscape: true,
                        calculatePosition: true

                    });
                } else {
                    this._unsupportedBrowserModal.open();
                }
            }

            /* Lifting the global progress bar above "Please upgrade" message. */
            if ($('#toolbar-upgrade-link').length) {
                $('.progress-global').addClass('progress-global-lift');
            }

            this._sessionEnsureTimer = setInterval(() => {
                app.api.ping();
            }, 15000);

            /** Initializing the collaboration manager (loading sharing multi-status). */
            this.collaboration.initialize();

            /* Initializing file drag and drop. */
            Models.UI.FileDragAndDropManager.getInstance().initialize(this);

            this.beginReloadPresentation();
        }

        /** Occurs when the editor is being resized. */
        public onResize() {
            var f = $('.element-properties .form-outer-wrapper');
            f.height(f.parents('.toolbar-buttons').height() - 70);
        }

        /** Opens "About" modal. */
        public about() {
            Ifly.App.getInstance().openModal({
                content: $('#about-modal')
            });
        }

        /** Opens the presentation settings modal. */
        public settings() {
            Ifly.Models.UI.PresentationSettingsModal.getInstance().open(this.presentation.serialize());
        }

        /** Opens the publish settings modal. */
        public publish() {
            this.publishing.editSettings($.extend(this.presentation.publishSettings().serialize(), {
                totalSlides: this.presentation.slides().length,
                title: this.presentation.title(),
                presenterSettings: this.presentation.presenterSettings().serialize()
            }));
        }

        /** Opens statistics view. */
        public stats() {
            Ifly.Models.UI.PresentationStatsModal.getInstance().open({
                presentationId: this.presentation.id(),
                googleAnalyticsTrackingId: this.presentation.integrationSettings().googleAnalyticsTrackingId()
            });
        }

        /** Opens presentation clone view. */
        public clone() {
            Ifly.Models.UI.ClonePresentationModal.getInstance().open({
                id: this.presentation.id(),
                title: this.presentation.title()
            });
        }

        /** Opens the feedback form. */
        public feedback() {
            Ifly.Models.UI.FeedbackModal.getInstance().open();
        }

        /** Opens the keyboard shortcut help. */
        public keyboardShortcuts() {
            Ifly.Models.UI.ShortcutModal.getInstance().open();
        }

        /** Begins reloadings the presentation. */
        private beginReloadPresentation() {
            var parsedId = this.parsePresentationIdFromUrl();

            if (parsedId > 0) {
                /* Waiting until the startup animation completes - eliminates lags. */
                setTimeout(() => {
                    this.reloadPresentation();
                }, 400);
            } else {
                this.onPresentationAvailable(null);
            }
        }

        /** Reloads the presentation. */
        private reloadPresentation() {
            var parsedId = this.parsePresentationIdFromUrl(),
                app = Ifly.App.getInstance();

            if (parsedId > 0) {
                if (this._payload) {
                    this.onPresentationAvailable(this._payload);
                    this._payload = null;
                } else {
                    app.api.get('presentations', parsedId, (success, data) => {
                        this.onPresentationAvailable(data);
                    }, true);
                }
            } else {
                this.onPresentationAvailable(null);
            }
        }

        /**
         * Occurs when new presentation is available.
         * @param {object} presentation Raw presentation data.
         * @param {boolean} onlyBasicSettings Value indicating whether to fill out only basic settings.
         */
        public onPresentationAvailable(presentation: any, onlyBasicSettings?: boolean) {
            var n = '', onSlideButtonActive = null, app = Ifly.App.getInstance(), customTheme = '',
                search = null, pushedSlide = null, isNewPresentation = !this.presentation.id();
            
            if (!this.isActive()) {
                this._payload = presentation;
            } else {
                /* Filling out object state */
                if (onlyBasicSettings) {
                    this.presentation.id(presentation.id || presentation.Id || 0);
                    this.presentation.userId(this.user != null ? this.user.id() : 0);
                    this.presentation.title(presentation.title || presentation.Title || '');
                    this.presentation.theme(presentation.theme || presentation.Theme || '');
                    this.presentation.backgroundImage(presentation.backgroundImage || presentation.BackgroundImage || '');
                } else {
                    customTheme = this.themes.getCustomTheme();

                    /** Automatically applying custom theme (if any). */
                    if (customTheme && customTheme.length) {
                        if (!presentation) {
                            presentation = {};
                        }

                        presentation.theme = customTheme;
                    }

                    this.presentation.load(presentation);
                }
                
                /* For new presentations we're adding new slide automatically. */
                if (isNewPresentation) {
                    pushedSlide = app.options.demo ? (presentation ? {
                        id: 1,
                        presentationId: presentation.id,
                        title: app.terminology.slide1
                    } : null) : (presentation ? (presentation.slide || presentation.Slide) : null);

                    if (pushedSlide) {
                        this.presentation.slides.push(new Ifly.Models.Slide(pushedSlide));

                        /* For all the new presentations we're using Google Charts. */
                        this.presentation.useCharts(Models.PresentationChartProviderType.googleCharts);

                        /* New presentations will not have "Slide description" functionality. */
                        this.presentation.useSlideDescription(Models.PresentationSlideDescriptionType.never);
                    }
                }

                /* Updating the theme and background if there's a current slide. */
                if (this.presentation.selectedSlideIndex() >= 0 || pushedSlide) {
                    this.composition.applyTheme(this.presentation.theme());
                    this.composition.applyBackgroundImage(this.presentation.backgroundImage(), this.presentation.theme());
                }

                /* Refreshing special elements on the slide (maps, charts). */
                this.composition.refresh();

                /* New presentation - user must create it first (specify name & description) */
                if (this.presentation.id() <= 0) {
                    Ifly.App.getInstance().trackEvent('act', 'new presentation');

                    this.settings();
                } else if (typeof (history.pushState) != 'undefined') {
                    n = this.presentation.title();

                    if (!n || !n.length) {
                        n = '[...]';
                    }

                    search = location.search;
                    if (search && search.length) {
                        if (search.indexOf('?') != 0) {
                            search = '?' + search;
                        }
                    }

                    history.replaceState({}, app.title(n), '/edit/' + this.presentation.id().toString() + search);

                    $('#preview-link, #gridlines, #toolbar-upgrade-link').addClass('active');

                    /* Making all slides in the list visible. */
                    this.slides.expand(true);
                    
                    /* Updating user menu. */
                    this.userMenu.onPresentationUpdated(this.presentation);

                    /* Selecting the first slide. */
                    if (this.presentation.slides().length && this.presentation.selectedSlideIndex() < 0) {
                        /* Enables "Elements" to active right away (no flicker). */
                        this.presentation.isSelectingSlide(true);

                        setTimeout(() => {
                            this.presentation.isSelectingSlide(false);
                            this.slides.selectSlide(this.presentation.slides()[0]);
                        }, 400);
                    }

                    if (this.user.subscription.isAgency()) {
                        /* Initializing the chat. */
                        this.collaboration.chat.initialize();

                        /* Initializing collaborative edits. */
                        this.collaboration.collaborativeEdits.initialize(); 

                        /* Initializing realtime communication. */
                        this.collaboration.initializeRealtimeCommunication();

                        /* When we have collaborators, the flush timeout must be shorter so everybody can see changes more quickly. */
                        this.collaboration.addEventListener('teamUpdated', (sender, e) => {
                            app.api.queueFlushTimeout = e.team.length > 1 ? 25 : app.api.defaultQueueFlushTimeout;
                        });
                    }
                }
            }
        }

        /** Parses presentation Id from the URL. */
        private parsePresentationIdFromUrl(): number {
            var ret = 0, tryParse = rx => {
                var result = 0, m = rx.exec(location.href);

                if (m != null && m.length > 1) {
                    result = parseInt(m[1], 10);
                    if (isNaN(result) || result < 0) {
                        result = 0;
                    }
                }

                return result;
            };

            ret = tryParse(/\/edit\/([0-9]+)\/?/g);

            if (!ret) {
                ret = tryParse(/\/embed\/([0-9]+)\/?/g);
            }

            return ret;
        }

        /** Returns the current instance of an editor. */
        public static getInstance(): Editor {
            if (!this._instance) {
                this._instance = new Editor();
            }

            return this._instance;
        }
    }
}

Ifly.App.getInstance().addEventListener('loaded', (sender, args) => {
    Ifly.Editor.getInstance().initialize(sender.options);
});