/// <reference path="Typings/jquery.d.ts" />

module Ifly {
    /** Represents an event source. */
    export class EventSource {
        private _callbacks: any;

        /** Initializes a new instance of an object. */
        constructor() {
            this._callbacks = {};
        }

        /** 
         * Subscribes to a given event.
         * @param {string} eventName Event name.
         * @param {Function} callback Callback to execute.
         */
        public addEventListener(eventName: string, callback: Function) {
            var evt = (eventName || '').toLowerCase();

            if (callback) {
                if (!this._callbacks[evt]) {
                    this._callbacks[evt] = [];
                }

                this._callbacks[evt].push(callback);
            }
        }

        /** 
         * Dispatches the given event to all subscribers.
         * @param {string} eventName Event name.
         * @param {object} args Event arguments.
         */
        public dispatchEvent(eventName: string, args?: any) {
            var e = args || {};
            var evt = (eventName || '').toLowerCase();

            if (this._callbacks[evt]) {
                for (var i = 0; i < this._callbacks[evt].length; i++) {
                    this._callbacks[evt][i](this, e);
                }
            }
        }
    }

    /** Represents an application. */
    export class App extends EventSource {
        private static _instance: App;

        private _ready: boolean;

        /** Initializes a new instance of an object. */
        constructor() {
            super();
        }

        /**
         * Initializes the application.
         * @param {object} options Initialization options.
         */
        public initialize(options?: any) {
            var body = null;

            this.dispatchEvent('loading');

            $(document).ready(() => {
                this.dispatchEvent('loaded');
            });

            window.onload = () => {
                if (!this._ready) {
                    body = $(document.body);

                    setTimeout(() => {
                        body.removeAttr('style').addClass('active');

                        this.dispatchEvent('ready');
                    }, 10);
                }
            };
        }

        /** Returns an instance of the current application. */
        public static getInstance(): App {
            if (!this._instance) {
                this._instance = new App();
            }

            return this._instance;
        }
    }
}