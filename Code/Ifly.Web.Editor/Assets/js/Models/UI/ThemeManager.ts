/// <reference path="../../Editor.ts" />
/// <reference path="Component.ts" />

module Ifly.Models.UI {
    /** Represents custom theme source. */
    export enum CustomThemeSource {
        /** URL. */
        url = 1
    }

    /** Represents a theme manager. */
    export class ThemeManager extends Component {
        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);
        }

        /** 
         * Returns the custom theme passed to the application.
         * @param {CustomThemeSource} source Theme source. If omitted, all available source will be examined (in pre-defined order).
         */
        public getCustomTheme(source?: CustomThemeSource): string {
            return this.getCustomThemeFromUrl();
        }

        /** Returns the custom theme passed to the application via URL. */
        private getCustomThemeFromUrl(): string {
            var ret = '', search = location.search,
                themeMatch = null, themeUrl = '', ext = -1, fn = -1;

            if (search && search.length) {
                themeMatch = /(\?|&)theme=([^&]+)/gi.exec(search.indexOf('?') != 0 ?
                    ('?' + search) : search);

                if (themeMatch && themeMatch.length > 2) {
                    themeUrl = themeMatch[2];

                    fn = themeUrl.lastIndexOf('/');

                    if (fn > 0) {
                        ret = themeUrl.substr(fn + 1);
                        ext = ret.lastIndexOf('.');

                        if (ext > 0) {
                            ret = ret.substr(0, ext);
                        }

                        ret = ret.toLowerCase().replace(/[^a-zA-Z0-9\-_]/gi, '');
                    }
                }
            }

            return ret;
        }
    }
} 