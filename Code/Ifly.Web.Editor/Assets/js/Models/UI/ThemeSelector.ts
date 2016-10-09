/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="Control.ts" />

module Ifly.Models.UI {
    /** Represents a theme reference. */
    export interface ThemeReference {
        /** Gets or sets theme name. */
        name: string;

        /** Gets or sets the theme Id. */
        id: string;

        /** Gets or sets theme URL. */
        url?: string;
    }

    /** Represents a theme selector. */
    export class ThemeSelector extends Control {
        /** Gets or sets the selected theme. */
        public theme: KnockoutObservable<string>;

        /** Gets or sets value indicating whether custom theme is being uploaded. */
        public isUploading: KnockoutObservable<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} container Control container.
         */
        constructor(container?: any) {
            this.theme = ko.observable<string>();
            this.isUploading = ko.observable<boolean>();

            this.theme.subscribe((v) => {
                this.dispatchEvent('themeChanged', { theme: v });
            });

            super(container);

            this.enabled.subscribe(v => {
                if (!v) {
                    this.container.attr('disabled', 'disabled');
                } else {
                    this.container.removeAttr('disabled');
                }
            });
        }

        /** Occurs when "create theme" link is clicked. */
        public onCreateThemeClicked() {
            this.blur();

            UI.ThemeBuilderModal.getInstance().open(null, {
                save: (data) => {
                    /* Selecting this theme. */
                    this.theme(data.id);
                    this.dispatchEvent('themeChanged', { theme: data.id });
                }
            });
        }

        /** Removes focus from the drop-down list. */
        public blur() {
            $('.theme-list .dropdown').blur();
        }

        /** 
         * Uploads the given theme when the file is selected.
         * @param {object} e Event object.
         */
        private onFileSelected(e: any) {
            var app = Ifly.App.getInstance(),
                editor = Ifly.Editor.getInstance(),
                modal = null, themeObjParsed = null, themeObj = null;

            this.isUploading(true);

            app.api.upload('themes/upload', e.target, (theme: any) => {
                Utils.UploadButtonHandler.resetInput($(e.target).parent());

                this.isUploading(false);

                if (theme) {
                    try {
                        themeObjParsed = typeof (theme) == 'string' ?
                        ko.utils.parseJson(<string>theme) : theme;
                    } catch (ex) { }

                    if (themeObjParsed != null) {
                        themeObj = {
                            id: themeObjParsed.id || themeObjParsed.Id,
                            name: themeObjParsed.name || themeObjParsed.Name,
                            url: themeObjParsed.url || themeObjParsed.Url
                        };
                    }
                }

                if (themeObj) {
                    editor.composition.addThemeReference(<ThemeReference>themeObj, true);

                    /* Selecting this theme. */
                    this.theme(themeObj.id);
                    this.dispatchEvent('themeChanged', { theme: themeObj.id });
                } else {
                    PresentationSettingsModal.getInstance().setVisible(false);

                    modal = app.openModal({
                        content: $('#theme-upload-error'),
                        buttons: [
                            {
                                text: app.terminology.ok,
                                click: () => {
                                    modal.close();
                                    PresentationSettingsModal.getInstance().setVisible(true);
                                },
                            }
                        ]
                    });
                }
            });
        }

        /**
         * Adds theme reference to the current composition.
         * @param {ThemeReference} theme Theme.
         */
        public addThemeReference(theme: ThemeReference) {
            var container = $('.theme-list .dropdown-menu ul'), separator = null, item = null, data = null, allThemes = null,
                insertAfter = null, referencedThemes = null, label = null, slide = null, previewContainer = null, trim = (s: string) => {
                    return typeof (s.trim) == 'function' ? s.trim() : s.replace(/^\s+|\s+$/g, '');
                }, containsTheme = (): boolean => {
                    var result = false;

                    for (var i = 0; i < allThemes.length; i++) {
                        if ($(allThemes[i]).attr('data-theme-id') == theme.id) {
                            result = true;
                            break;
                        }
                    }

                    return result;
                };

            allThemes = container.find('li');

            if (theme && !containsTheme()) {
                insertAfter = container.find('.separator');

                if (allThemes && allThemes.length) {
                    data = ko.dataFor(allThemes[0]);
                }

                if (!insertAfter.length) {
                    insertAfter = $('<li />').addClass('separator').appendTo(container);
                } else {
                    separator = insertAfter;
                    referencedThemes = insertAfter.nextAll('li');

                    if (referencedThemes.length) {
                        insertAfter = null;

                        for (var i = 0; i < referencedThemes.length; i++) {
                            if (trim($(referencedThemes[i]).text()).localeCompare(theme.name) > 0) {
                                insertAfter = i > 0 ? referencedThemes[i - 1] : separator;
                                break;
                            }
                        }

                        if (!insertAfter) {
                            insertAfter = referencedThemes[referencedThemes.length - 1];
                        }
                    }
                }

                item = $('<li />').attr('data-theme-id', theme.id);

                item.attr('data-bind', 'css: { \'active\': (theme() == \'' + theme.id + '\') }' +
                    ', click: function (data, e) { $data.onThemeChanging(\'' + theme.id + '\', e); }');

                previewContainer = $('<div class="theme-preview-wrapper" />');

                previewContainer.append($('<span />').text(theme.name));

                label = $('<label />').attr('title', theme.name);
                slide = $('<span />').addClass('slide theme-' + theme.id + ' background-image');

                slide.append($('<span />').addClass('accent-1 accent-background'));
                slide.append($('<span />').addClass('accent-2 accent-background'));
                slide.append($('<span />').addClass('accent-3 accent-background'));
                slide.append($('<span />').addClass('accent-4 accent-background'));

                label.append(slide);
                previewContainer.append(label);
                item.append(previewContainer);

                item.insertAfter(insertAfter);
                ko.applyBindings(data, item[0]);
            }
        }

        /** 
         * Occurs when theme is changing.
         * @param {string} theme Theme.
         * @param {Event} e Event object.
         */
        private onThemeChanging(theme: string, e: Event) {
            Ifly.App.getInstance().trackEvent('act', 'theme');

            this.theme(theme);
            $(e.target).parents('.dropdown').blur();
        }
    }
}