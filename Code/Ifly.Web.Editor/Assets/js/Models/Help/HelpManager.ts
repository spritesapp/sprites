/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/q.d.ts" />
/// <reference path="../IModel.ts" />

module Ifly.Models.Help {
    /** Represents help manager. */
    export class HelpManager extends Models.UI.Component {
        /** Gets or sets value indicating whether manager components has finished loading. */
        private _hasLoaded: boolean;

        /** Gets or sets value indicating whether manager is being loaded.  */
        private _isLoading: boolean;

        /** Gets or sets the help panel. */
        public panel: HelpPanel;

        /** Gets or sets the help service. */
        public service: HelpService;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);

            this.panel = new HelpPanel();

            this.panel.isOpen.subscribe(v => {
                if (v && !this._hasLoaded) {
                    if (!this._isLoading) {
                        this._isLoading = true;

                        this.panel.isRendering(true);

                        this.load();
                    }
                }
            });
        }

        /**
         * Loads the manager components.
         */
        public load(): Q.Promise<any> {
            return !this._hasLoaded ? Q.when()
                .then(() => {
                    return Ifly.App.getInstance().bundles.loadBundle('help');
                })
                .then(() => {
                    if (!this._hasLoaded) {
                        this._hasLoaded = true;
                        this._isLoading = false;

                        this.panel.isRendering(false);

                        this.service = new HelpService();
                    }
                })
                .catch(err => {
                    return Q.reject(err);
                }) : Q.resolve({});
        }
    }
} 