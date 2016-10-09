/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="Control.ts" />

module Ifly.Models.UI {
    /** Represents a font selector. */
    export class FontSelector extends Control {
        /** Gets or sets the selected font. */
        public font: KnockoutObservable<string>;

        /** Gets or sets the list of currently matching fonts. */
        public matchingFonts: KnockoutObservableArray<string>;

        /** Value indicating whether to show drop-down list. */
        public showDropDown: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether fonts has loaded. */
        public fontsLoaded: KnockoutObservable<boolean>;

        /** Gets or sets font query timer. */
        private _fontQueryTimer: number;

        /** Gets or sets value indicating whether font was selected from drop-down list. */
        private _fontSelectedFromDropDown: boolean;

        /** Gets or sets the previously selected font. */
        private _previouslySelectedFont: string;

        /** Gets or sets the cached fonts. */
        private _cachedFonts: string[];

        /** Gets or sets the cached font styles. */
        private _cachedFontStyles: {};

        /** Gets or sets the default fonts. */
        private _defaultFonts: string[];

        /** Gets or sets font preview timer. */
        private _fontPreviewTimer: any;

        /** Gets or sets value indicating whether user is awaiting for the preview. */
        private _isOnPreview: boolean;

        /** 
         * Initializes a new instance of an object.
         * @param {object} container Control container.
         */
        constructor(container?: any) {
            this.font = ko.observable<string>();
            this.showDropDown = ko.observable<boolean>();
            this.fontsLoaded = ko.observable<boolean>();

            this._defaultFonts = [
                'Open Sans',
                'Roboto',
                'Lato',
                'Oswald',
                'Slabo 27px',
                'Lora',
                'Roboto Condensed',
                'PT Sans',
                'Raleway',
                'Droid Sans'
            ];

            this.matchingFonts = ko.observableArray<string>(ko.utils.arrayMap(this._defaultFonts, font => font));

            this.font.subscribe((v) => {
                this.dispatchEvent('fontChanged', { font: v });

                if (!this.showDropDown()) {
                    this._fontSelectedFromDropDown = true;
                    this._previouslySelectedFont = v;
                }
            });

            super(container);

            this.enabled.subscribe(v => {
                if (!v) {
                    this.container.attr('disabled', 'disabled');
                } else {
                    this.container.removeAttr('disabled');
                }
            });

            this.container.unbind('click').bind('click', e => {
                var $target = $(e.target);

                if (!$target.hasClass('dropdown-menu') &&
                    !$target.parents('.dropdown-menu').length &&
                    (
                        $target.hasClass('dropdown') ||
                        $target.hasClass('dropdown-active') ||
                        $target.hasClass('dropdown-arrow') ||
                        $target.parents('.dropdown-active').length > 0
                    )) {

                    e.preventDefault();
                    e.stopPropagation();

                    this.showDropDown(true);

                    setTimeout(() => {
                        this.container.find('.search-box').focus();
                    }, 10);
                }
            });
        }
        
        /**
         * Returns loadable font definition.
         * @param {string} font Font.
         */
        public getLoadableFontDefinition(font: string): { font: string; style: string } {
            var ret = {
                    font: font,
                    style: null
                },
                styles = [];

            if (this._cachedFontStyles && this._cachedFontStyles[font]) {
                if (ko.utils.arrayFilter(this._cachedFontStyles[font], item => {
                    return item === 'regular';
                }).length === 0) {
                    styles = ko.utils.arrayFilter(this._cachedFontStyles[font], item => {
                        return item === '300';
                    });

                    if (!styles.length) {
                        styles = ko.utils.arrayFilter(this._cachedFontStyles[font], item => {
                            return item === '700';
                        });
                    }

                    if (styles.length) {
                        if (styles.length) {
                            ret.style = styles[0];
                        }
                    }
                }
            }

            return ret;
        }

        /** 
         * Occurs when font is changing.
         * @param {string} font Font.
         * @param {Event} e Event object.
         */
        private onFontChanging(font: string, e: Event) {
            var $target = e ? $(e.target) : null;

            if ($target && ($target.hasClass('preview') || $target.parents('.preview').length > 0)) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                this.font(font);

                this._fontSelectedFromDropDown = true;
                this._previouslySelectedFont = font;

                this.onHideFontPreview();

                if (e) {
                    $(e.target).parents('.dropdown').removeClass('has-focus').blur()
                        .find('.search-box').blur();

                    e.stopPropagation();
                }
            }
        }

        /** Occurs when search box got focus. */
        private onSearchBoxGotFocus() {
            setTimeout(() => {
                if (!this.container.hasClass('has-focus')) {
                    this.showDropDown(true);

                    setTimeout(() => {
                        this.container.find('.search-box').focus();
                    }, 10);
                }
            }, 30);
        }

        /** Occurs when search box lost focus. */
        private onSearchBoxLostFocus() {
            var interval = null;
            
            this.showDropDown(false);
            this.onHideFontPreview();

            interval = setInterval(() => {
                if (!this.container.find('.dropdown-menu:visible').length) {
                    clearInterval(interval);

                    if (!this._fontSelectedFromDropDown) {
                        this.onFontChanging(this._previouslySelectedFont, null);
                    }
                }
            }, 25); 
        }

        /** Occurs when search box had input. */
        private onSearchBoxHasInput() {
            this._fontSelectedFromDropDown = false;

            clearTimeout(this._fontQueryTimer);

            this._fontQueryTimer = setTimeout(() => {
                if (this._previouslySelectedFont != this.font()) {
                    if (Utils.Input.trim(this.font()).length) {
                        this.reloadFonts(this.font());
                    } else {
                        this.matchingFonts(ko.utils.arrayMap(this._defaultFonts, font => font));
                    }
                }
            }, 500);
        }

        /** Reloads fonts. */
        private reloadFonts(query: string) {
            var curMatching = 0,
                queryNormalized = (query || '').toLowerCase(),
                onFontsLoaded = () => {
                    var matchingFonts = ko.utils.arrayFilter(this._cachedFonts, font => {
                        var result = false;

                        if (curMatching < 10) {
                            result = font.toLowerCase().indexOf(queryNormalized) >= 0;

                            if (result) {
                                curMatching++;
                            }
                        }

                        return result;
                    });

                    this.matchingFonts.removeAll();
                    this.matchingFonts.push.apply(this.matchingFonts, matchingFonts);
                };

            if (!this._cachedFonts) {
                $.get('https://www.googleapis.com/webfonts/v1/webfonts?fields=items%2Ffamily,items%2Fvariants&key=AIzaSyAI3z4sG6-DJlFguwED-vbnK0qEvt8OuwA', fonts => {
                    this._cachedFonts = ko.utils.arrayMap(fonts.items, (item: any) => item.family);
                    this._cachedFontStyles = {};

                    ko.utils.arrayForEach(fonts.items, (item: any) => {
                        this._cachedFontStyles[item.family] = item.variants;
                    });

                    this.fontsLoaded(true);

                    onFontsLoaded();
                });
            } else {
                onFontsLoaded();
            }
        }

        /** 
         * Occurs when font preview is to be shown.
         * @param {string} font Font.
         * @param {Event} e Event object.
         */
        private onShowFontPreview(font: string, e: MouseEvent) {
            var preview = $('#font-preview'),
                offset = $(e.target).offset(),
                loadableFontDefinition = this.getLoadableFontDefinition(font),
                c = Ifly.App.getInstance().components['FontSelector'].terminology,
                html = '\
                    <style type="text/css">\
                        html, body { margin: 0; padding: 0; font-size: 14px; line-height: 20px; }\
                        p { margin: 0; padding: 5px; padding-top: 6px; opacity: 0; -webkit-transition: opacity 300ms ease; transition: opacity 300ms ease; }\
                        p.active { opacity: 1; }\
                    </style>\
                    <p> ' + c.fontPreviewText + ' </p>\
                    <script type="text/javascript" src="' + location.protocol + '//' + location.host + '/Assets/js/webfont.min.js"></script>\
                    <script type="text/javascript">\
                        WebFont.load({\
                            google: {\
                                families: [\'' + loadableFontDefinition.font + (loadableFontDefinition.style ? (':' + loadableFontDefinition.style) : '') + '\']\
                            },\
                            active: function () { \
                                var p = document.getElementsByTagName(\'p\')[0];\
                                p.style.fontFamily = \'\\\'' + font + '\\\', sans-serif\';\
                                p.className = \'active\';\
                            }\
                        });\
                    </script>';

            this._isOnPreview = true;

            if (!preview.length) {
                clearTimeout(this._fontPreviewTimer);

                this._fontPreviewTimer = setTimeout(() => {
                    if (this._isOnPreview) {
                        preview = $('<div id="font-preview" class="item-preview-overlay">')
                            .append($('<div class="heading">').text(c.example))
                            .append($('<iframe frameborder="0" scrolling="no" src="about:blank"></iframe>').attr('srcdoc', html));

                        $(document.body).append(preview);

                        preview.css({
                            left: (offset.left + 28) + 'px',
                            top: (offset.top + 5) + 'px'
                        });
                    }
                }, 200);
            }
        }

        /** 
         * Occurs when font preview is to be hidden.
         */
        private onHideFontPreview() {
            this._isOnPreview = false;

            $('#font-preview').remove();
        }
    }
}