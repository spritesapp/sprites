/// <reference path="../Typings/q.d.ts" />

module Ifly.Utils {
    /** Represents script load options. */
    export interface IScriptLoadOptions {
        /** Gets or sets the custom Id of the script. */
        scriptId?: string;

        /** Gets or sets value indicating whether to disable browser caching when loading a script. */
        disableBrowserCaching?: boolean;
    }

    /** Represents script loader. */
    export class ScriptLoader {
        /** Gets or sets global script Id suffix. */
        private static _scriptIdSuffix: number;

        /**
         * Loads the given script.
         * @param url {string} Script URL.
         * @param options {IScriptLoadOptions} Script load options.
         * @returns {Q.Promise} A promise which, when resolves, indicates of a successful load.
         */
        public static loadScript(url: string, options?: IScriptLoadOptions): Q.Promise<string> {
            var script = null,
                scriptId = '',
                onError = null,
                loadedStatus = null,
                scriptLoaded = false,
                appendCallbacks = null,
                onReadyStateChanged = null,
                deferred = Q.defer<string>(),
                loadStatusAttributeName = 'data-load-status',
                loadError = new Error('Failed to load script: ' + url);

            options = options || {};

            /* Making sure our global id suffix has initial value. */
            if (!ScriptLoader._scriptIdSuffix) {
                ScriptLoader._scriptIdSuffix = 1;
            }

            /* Composing script Id (using either the provided Id or auto-generated and globally-unique one). */
            scriptId = options.scriptId || ('script_' + (new Date().getTime() + '_' + (ScriptLoader._scriptIdSuffix++)));

            /**
             * Occurs when ready state of the given script changes.
             */
            onReadyStateChanged = function () {
                if (!scriptLoaded) {
                    if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                        scriptLoaded = true;

                        /* Marking this script as successfully loaded. */
                        script.setAttribute(loadStatusAttributeName, 'success');

                        /* Preventing memory leak in IE. */
                        script.onload = script.onreadystatechange = null;
                        script.parentNode.removeChild(script);

                        deferred.resolve(scriptId);
                    } else if (this.readyState === 'error') {
                        /* Marking this script as failed to load. */
                        script.setAttribute(loadStatusAttributeName, 'error');

                        onError();
                    }
                }
            };

            /**
             * Occurs when script load fails.
             */
            onError = function () {
                deferred.reject(loadError);
            };

            /** Appends script callbacks. */
            appendCallbacks = () => {
                var callbacks = {
                    'onload': onReadyStateChanged,
                    'onreadystatechange': onReadyStateChanged,
                    'onerror': onError
                };

                Object.keys(callbacks).forEach(key => {
                    var origCallback = script[key];

                    script[key] = function () {
                        /* Calling original callback. */
                        if (origCallback) {
                            origCallback.apply(this, arguments);
                        }

                        /* Calling the current callback. */
                        callbacks[key].apply(this, arguments);
                    };
                });
            };

            /* Trying to see if the given script has already been put for loading. */
            script = document.getElementById(scriptId);
            
            if (script) {
                /* Reading out the script load status. */
                loadedStatus = script.getAttribute('data-load-status');

                if (loadedStatus === 'success') {
                    /* Script was successfully loaded earlier. */
                    deferred.resolve(scriptId);
                } else if (loadedStatus === 'error') {
                    /* Script failed to load earlier. */
                    deferred.reject(loadError);
                } else {
                    /* Appending new set of callbacks. */
                    appendCallbacks();
                }
            } else {
                script = document.createElement('script');

                script.id = scriptId;
                script.async = true;

                /* Adding cache killer to the URL (timestamp which will force user agent to load script from the server every time). */
                script.src = url + (options.disableBrowserCaching ? ((url.indexOf('?') > 0 ? '&' : '?') + '_t=' + new Date().getTime()) : '');
                
                /* Initializing the callbacks. */
                appendCallbacks();
                
                document.body.appendChild(script);
            }

            return deferred.promise;
        }
    }
}