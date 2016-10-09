module Ifly.Utils {
    /** Represents font loader. */
    export class FontLoader {
        /**
         * Loads all custom fonts defined in all themes.
         * @param {Function=} onComplete A callback.
         */
        public static loadCustomFontsFromAllThemes(onComplete?: Function) {
            var links = document.getElementsByTagName('link'),
                hasQueued = false,
                queue = [];

            for (var i = 0; i < links.length; i++) {
                (url => {
                    if ((url || '').toLowerCase().indexOf('css/themes') >= 0) {
                        hasQueued = true;

                        queue.push(resolve => {
                            this.loadCustomFonts(url, resolve);
                        });
                    }
                })(links[i].href);
            }

            this.processQueue(queue, onComplete);
        }

        /**
         * Loads custom fonts by using the given font URL as origin.
         * @param {string} url Font URL.
         * @param {Function=} onComplete A callback.
         */
        public static loadCustomFonts(url: string, onComplete?: Function) {
            this.ensureLoader(() => {
                $.get(url, css => {
                    var fonts = [],
                        match = null,
                        fontUrl = '',
                        webFontPayload = null,
                        fontDefinition = null,
                        trimChars = ['\'', '"'],
                        rx = /@import\s+url\s*\(([^\)]+)\)/gi;

                    while ((match = rx.exec(css)) !== null) {
                        fontUrl = match[1] || '';

                        for (var i = 0; i < trimChars.length; i++) {
                            fontUrl = this.trim(fontUrl);

                            if (fontUrl.indexOf(trimChars[i]) === 0 &&
                                fontUrl.lastIndexOf(trimChars[i]) === (fontUrl.length - 1)) {

                                fontUrl = fontUrl.substr(1, fontUrl.length - 2);
                            }
                        }

                        fontUrl = this.trim(fontUrl);

                        fontDefinition = this.getFontDefinitionFromImport(fontUrl);

                        if (fontDefinition) {
                            fonts.push(fontDefinition);
                        }
                    }

                    if (fonts.length) {
                        webFontPayload = {};

                        for (var i = 0; i < fonts.length; i++) {
                            if (typeof (webFontPayload[fonts[i].type]) === 'undefined') {
                                webFontPayload[fonts[i].type] = {
                                    families: []
                                };
                            }

                            for (var j = 0; j < fonts[i].families.length; j++) {
                                webFontPayload[fonts[i].type].families.push(fonts[i].families[j]);
                            }
                        }

                        if (onComplete) {
                            webFontPayload.active = onComplete;
                        }

                        window['WebFont'].load(webFontPayload);
                    } else {
                        (onComplete || function () { })();
                    }
                });
            });
        }

        /**
         * Ensures that the Web Font Loader is available.
         * @param {Function} onComplete A callback.
         */
        public static ensureLoader(onComplete: Function) {
            var script = null,
                scriptLoaded = false,
                scriptId = 'typekit-webfont-loader';

            if (document.getElementById(scriptId)) {
                onComplete();
            } else {
                script = document.createElement('script');
                script.type = 'text/javascript';

                script.src = ('https:' == document.location.protocol ? 'https' : 'http') +
                '://ajax.googleapis.com/ajax/libs/webfont/1.5.6/webfont.js';

                script.onload = script.onreadystatechange = function () {
                    if (!scriptLoaded && (!this.readyState || this.readyState === 'loaded'
                        || this.readyState === 'complete')) {

                        scriptLoaded = true;

                        /* Preventing memory leak in IE. */
                        script.onload = script.onreadystatechange = null;
                        script.parentNode.removeChild(script);

                        onComplete();
                    }
                };

                document.body.appendChild(script);
            }
        }

        /**
         * Normalizes font styles.
         * @param {string[]} styles Original styles.
         */
        public static normalizeFontStyles(styles: string[]): string[]{
            var ret = [];

            /* Normalizing fonts. */
            for (var i = 0; i < styles.length; i++) {
                if (styles[i] === '100') {
                    ret.push('n1');
                } else if (styles[i] === '100italic') {
                    ret.push('i1');
                } else if (styles[i] === '300') {
                    ret.push('n3');
                } else if (styles[i] === '300italic') {
                    ret.push('i3');
                } else if (styles[i] === '400') {
                    ret.push('n4');
                } else if (styles[i] === '400italic') {
                    ret.push('i4');
                } else if (styles[i] === '500') {
                    ret.push('n5');
                } else if (styles[i] === '500italic') {
                    ret.push('i5');
                } else if (styles[i] === '700') {
                    ret.push('n7');
                } else if (styles[i] === '700italic') {
                    ret.push('i7');
                } else if (styles[i] === '900') {
                    ret.push('n9');
                } else if (styles[i] === '900italic') {
                    ret.push('i9');
                }
            }

            return ret;
        }

        /**
         * Returns Web Font Loader font defimition from the given font import URL.
         * @param {string} url Font import URL.
         */
        private static getFontDefinitionFromImport(url): { type: string; families: string[] } {
            var ret = null,
                family = null,
                fontName = '',
                fontStyles = [],
                fontStylesNormalized = [];

            /* Currently, we only understand Google Fonts. */
            if (url.toLowerCase().indexOf('fonts.googleapis.com') >= 0) {
                family = /(\?|&)family=([^\?&]+)/gi.exec(url);

                if (family && family.length > 2) {
                    fontName = decodeURIComponent(family[2]);

                    if (fontName.indexOf(':') > 0) {
                        fontStyles = fontName.substr(fontName.indexOf(':') + 1).toLowerCase().split(',');
                        fontName = fontName.substr(0, fontName.indexOf(':'));
                        fontStylesNormalized = this.normalizeFontStyles(fontStyles);

                        if (fontStylesNormalized.length) {
                            fontName += (':' + fontStylesNormalized.join(','));
                        }
                    }

                    ret = {
                        type: 'google',
                        families: [fontName]
                    };
                }
            }

            return ret;
        }

        /** 
         * Removes leading and trailing whitespaces fro mthe given string.
         * @param {string} input Input.
         */
        private static trim(input: string): string {
            return input.replace(/^\s+|\s+$/g, '');
        }

        /**
         * Processes the given async tasks sequentially.
         * @param {Function[]} tasks Task activators.
         * @param {Function=} onComplete A callback.
         */
        private static processQueue(tasks: Function[], onComplete?: Function) {
            if (!tasks.length) {
                (onComplete || function () { })();
            } else {
                tasks[0](() => {
                    this.processQueue(tasks.slice(1), onComplete);
                });
            }
        }
    }
}