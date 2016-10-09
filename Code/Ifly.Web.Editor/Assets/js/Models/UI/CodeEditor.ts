/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />

module Ifly.Models.UI {
    /** Represents a rich text editor. */
    export class CodeEditor extends Ifly.EventSource {
        /** Gets or sets the editor container. */
        private _container: JQuery;

        /** Gets or sets the underlying editor. */
        private _underlyingEditor: any;

        /**  Initializes a new instance of an object. */
        constructor() {
            super();
        }

        /**
         * Initializes the editor.
         * @param {JQuery} Editor container.
         */
        public initialize(container: JQuery) {
            this._container = container;

            this._underlyingEditor = window['ace'].edit(this._container.get(0));
            this._underlyingEditor.setTheme("ace/theme/xcode");
            this._underlyingEditor.setFontSize(14);
            this._underlyingEditor.getSession().setMode("ace/mode/javascript");
            this._underlyingEditor.renderer.setShowPrintMargin(false);
        }

        /**
         * Gets or sets the editor HTML contents.
         * @param {string} value HTML contents.
         */
        public value(value?: string): string {
            var ret = value || '';

            if (this._underlyingEditor) {
                if (typeof (value) == 'undefined' || value == null) {
                    ret = this._underlyingEditor.getValue();
                } else {
                    this._underlyingEditor.setValue(ret);

                    setTimeout(() => {
                        this._underlyingEditor.clearSelection();
                    }, 10);
                }
            }

            return ret;
        }
    }
} 