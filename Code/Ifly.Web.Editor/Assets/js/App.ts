/// <reference path="Typings/jquery.d.ts" />
/// <reference path="Typings/q.d.ts" />

module Ifly {
    /** Represents Google Analytics dimension. */
    export interface IGoogleAnalyticsDimension {
        /** Gets or sets dimension Id. */
        id: string;

        /** Gets or sets dimension name. */
        name: string;

        /** Gets or sets dimension description. */
        description: string;
    }

    /** Represents Google Analytics metric. */
    export interface IGoogleAnalyticsMetric {
        /** Gets or sets metric Id. */
        id: string;

        /** Gets or sets metric name. */
        name: string;

        /** Gets or sets metric description. */
        description: string;
    }

    /** Represents basic API module settings. */
    export interface IBasicApiModuleSettings {
        /** Loads the module. */
        load: (onComplate: () => any) => any;

        /** Performs authorization. */
        authorize: (onComplate: (result: any) => any) => any;

        /** Ensures that the client is authorized. */
        ensureAuthorized: (onComplete: (result: any) => any) => any;
    }

    /** Represents Google API module settings. */
    export interface IGoogleApiModuleSettings extends IBasicApiModuleSettings {
        /** Gets or sets authorization URL. */
        url: string;

        /** Checks authorization status. */
        checkAuthorizationStatus: (onComplete: (result: any) => any) => any;
    }

    /** Represents Google Analtyics API module settings. */
    export interface IGoogleAnalyticsApiModuleSettings extends IGoogleApiModuleSettings {
        /** Ensures that the metadata is loaded. */
        ensureMetadata: (onComplete: () => any) => any;

        /** Returns available Analytics dimensions. */
        getDimensions: (onComplete: (dimensions: IGoogleAnalyticsDimension[]) => any) => any;

        /** Returns available Analytics metrics. */
        getMetrics: (onComplete: (metrics: IGoogleAnalyticsMetric[]) => any) => any;
    }

    /** Represents Google API scopes. */
    export interface IGoogleApiModuleSetSettings {
        /** Gets or sets Analytics settings. */
        analytics: IGoogleAnalyticsApiModuleSettings;

        /** Gets or sets YouTube settings. */
        youtube: IGoogleApiModuleSettings;

        /** Gets or sets Drive settings. */
        drive: IGoogleApiModuleSettings;
    }

    /** Represents Facebook API settings. */
    export interface IFacebookApiSettings extends IBasicApiModuleSettings { }

    /** Represents Google API settings. */
    export interface IGoogleApiSettings {
        /** Gets or sets the API key. */
        apiKey: string;

        /** Gets or sets client Id. */
        clientId: string;

        /** Gets or sets value indicating whether API is loaded. */
        loaded: boolean;

        /** Gets or sets API scopes. */
        modules: IGoogleApiModuleSetSettings;
    }

    /** Represents app context. */
    export interface IAppContext {
        /** Gets or sets the current presentation. */
        presentation: any;
    }

    /** Represents browser information. */
    export interface IBrowserInfo {
        /** Gets or sets value indicatin gwhether Internet Explorer is used. */
        ie: boolean;

        /** Gets or sets value indicating whether Chrome is used. */
        chrome: boolean;

        /** Gets or sets value indicating whether Firefox is used. */
        firefox: boolean;

        /** Gets or sets value indicating whether user agent on Mac computer is used. */
        mac: boolean;

        /** Gets or sets value indicating whether mobile device was decected. */
        mobile: boolean;
    }

    /** Represents an event source. */
    export class EventSource {
        private _callbacks: any;

        /** Initializes a new instance of an object. */
        constructor() {
            this._callbacks = {};
        }

        /** 
         * Subscribes to a given event.
         *
         * @param {string} eventName Event name.
         * @param {Function} callback Callback to execute.
         * @param {boolean} priority Value indicating whether the callback should be prioritized.
         */
        public addEventListener(eventName: string, callback: Function, priority?: boolean) {
            var evt = (eventName || '').toLowerCase();

            if (callback) {
                if (!this._callbacks[evt]) {
                    this._callbacks[evt] = [];
                }

                if (priority) {
                    this._callbacks[evt].unshift(callback);
                } else {
                    this._callbacks[evt].push(callback);
                }
            }
        }

        /** 
         * Unsubscribes from a given event.
         *
         * @param {string} eventName Event name.
         * @param {Function} callback Callback to execute.
         */
        public removeEventListener(eventName: string, callback?: Function) {
            var evt = (eventName || '').toLowerCase(), index = -1;

            if (this._callbacks[evt]) {
                if (callback) {
                    for (var i = 0; i < this._callbacks[evt].length; i++) {
                        if (this._callbacks[evt][i] == callback) {
                            index = i;
                            break;
                        }
                    }

                    if (index >= 0) {
                        this._callbacks[evt].splice(index, 1);
                    }
                } else {
                    this._callbacks[evt] = [];
                }
            }
        }

        /** 
         * Dispatches the given event to all subscribers.
         *
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

        /**
         * Creates arguments object.
         * @param data {object=} Arguments data.
         * @param cancellable {boolean=} Value indicating whether the corresponding event's default behavior can be cancelled.
         */
        static createArguments(data?: any, cancellable?: boolean) {
            var ret = data || {};

            if (cancellable) {
                ret.preventDefault = false;
            }

            return ret;
        }
    }

    /** Represents a modal window. */
    export class ModalWindow extends EventSource {
        /** Gets or sets the modal window content Id. */
        public contentId: string;

        /** Gets or sets the window options. */
        public options: any;

        /** Gets or sets value indicating whether dialog is open. */
        public isOpen: boolean;

        /** Gets or sets the data associated with this modal. */
        public data: any;

        private _overlay: any;
        private _container: any;
        private static _current: ModalWindow[];
        private static _initialized: boolean;
        
        /** 
         * Initializes a new instance of an object.
         * @param {object} options Window options.
         */
        constructor(options: any) {
            super();

            this.isOpen = false;
            this.options = options || {};

            if (typeof (this.options.closeOnEscape) == 'undefined' || this.options.closeOnEscape == null) {
                this.options.closeOnEscape = true;
            }

            this.data = options.data;
        }

        /**
         * Updates the state of all given buttons button.
         * @param {object} options Options.
         */
        public updateButtons(options?: any) {
            options = options || {};

            this.updatePrimaryButton(options.primary);
            this.updateSecondaryButton(options.secondary);
        }

        /**
         * Updates the state of the primary button.
         * @param {object} options Options.
         */
        public updatePrimaryButton(options?: any) {
            this.updateButton(0, options);
        }

        /**
         * Updates the state of the secondary button.
         * @param {object} options Options.
         */
        public updateSecondaryButton(options?: any) {
            this.updateButton(1, options);
        }

        /**
         * Updates the state of the button.
         * @param {number} index Button index.
         * @param {object} options Options.
         */
        private updateButton(index: number, options?: any) {
            var $cmd = null, prev = null;

            var hasOption = (o, isNotNull) => {
                return typeof (options[o]) != 'undefined' &&
                    (!isNotNull || options[o] != null);
            };

            var defaultText = () => {
                prev = $cmd.attr('data-text-previous');

                if (prev && prev.length) {
                    $cmd.text(prev);
                    $cmd.removeAttr('data-text-previous');
                }
            };

            var defaultEnabled = () => {
                prev = $cmd.attr('data-enabled-previous');

                if (prev && prev.length) {
                    $cmd[0].disabled = prev != 'true';
                    $cmd.removeAttr('data-enabled-previous');
                }
            };

            options = options || {};

            if (this._container) {
                $cmd = $(this._container.find('div.modal-buttons button').not('.modal-button-nested')[index]);

                if (index == 0) {
                    $cmd.addClass('primary');
                }

                if (hasOption('visible', false)) {
                    if (hasOption('visible', true)) {
                        $cmd.toggle(!!options['visible']);
                    } else {
                        $cmd.show();
                    }
                }

                if (hasOption('text', false)) {
                    if (hasOption('text', true)) {
                        $cmd.attr('data-text-previous', $cmd.text()).text(options['text']);
                    } else {
                        defaultText();
                    }
                } else {
                    defaultText();
                }

                if (hasOption('enabled', false)) {
                    if (hasOption('enabled', true)) {
                        $cmd.attr('data-enabled-previous', !$cmd[0].disabled)[0].disabled = !options['enabled'];
                    } else {
                        defaultEnabled();
                    }
                } else {
                    defaultEnabled();
                }
            }
        }

        /** 
         * Opens the window.
         * @param {object} options Custom options.
         */
        public open(options?: any) {
            var currentlyOpened = 0, title = '';

            ModalWindow.initialize();

            if (options) {
                if (typeof (options['data']) != 'undefined') {
                    this.data = options['data'];
                }
            }

            this.ensureLayout(() => {
                ModalWindow.setActive(this, !!this.options['replaceCurrent']);

                if (this.options.buttons) {
                    this._container.find('div.modal-buttons button').not('.modal-button-nested').each((i, btn) => {
                        var isVisible = false, $btn = $(btn);

                        if (i == 0) {
                            $btn.addClass('primary');
                        }

                        if (typeof (this.options.buttons[i].text) != 'undefined') {
                            $btn.text(Ifly.App.unwrap(this.options.buttons[i].text));
                        }

                        if (typeof (this.options.buttons[i].visible) == 'function') {
                            isVisible = this.options.buttons[i].visible();

                            if (isVisible) {
                                $btn.show();
                            } else {
                                $btn.hide();
                            }
                        }
                    });
                }

                title = (options || {}).title || this.options.title;
                
                if (title) {
                    this._container.find('h3.modal-title').text(Ifly.App.unwrap(title));;
                }

                if (this.options.cssClass) {
                    this._container.addClass(this.options.cssClass);
                }

                if (!this.isOpen) {
                    this.isOpen = true;

                    if (!this._container.hasClass('modal-show')) {
                        currentlyOpened = $('.modal-window.modal-show').length;

                        this._container.css({ zIndex: 2000 + currentlyOpened });
                        this._container.addClass('modal-show');

                        if (!this._overlay.hasClass('modal-show')) {
                            this._overlay.addClass('modal-show');
                        }
                    }

                    if (!!this.options.calculatePosition) {
                        ModalWindow.reposition(this, true);
                    }
                }
            });
        }

        /** Closes the window. */
        public close() {
            ModalWindow.removeActive(this, !!this.options['replaceCurrent']);

            this.isOpen = false;

            if (this._container) {
                this._container.removeClass('modal-show');
                this._overlay.removeClass('modal-show');

                this._container.css({ zIndex: 2000 });

                this.dispatchEvent('closed');
            }
        }

        /** Fades out the window while keeping it open. */
        public fadeOut() {
            if (this._container) {
                this._container.addClass('modal-fade');

                setTimeout(() => {
                    this._container.addClass('modal-fade-applied');
                }, 1);
            }
        }

        /** Fades in the window. */
        public fadeIn() {
            this._container.removeClass('modal-fade-applied');

            setTimeout(() => {
                this._container.removeClass('modal-fade');
            }, 350);
        }

        /**
         * Ensures that the window layout is created.
         * @param {object} onComplete A function that is called when layout is created.
         */
        private ensureLayout(onComplete: any) {
            var wnd = this;

            var callback = () => {
                if (this._container) {
                    (onComplete || function () { })();
                }
            };

            var tryCreateLayout = (content, buttons) => {
                var bc = null, bce = null, ec = null, c = null;

                if (!buttons || !buttons.length) {
                    buttons = [{
                        text: Ifly.App.getInstance().terminology.close,
                        click: (sender, e) => {
                            (<ModalWindow>sender).close();
                        }
                    }];
                }

                if (typeof (content) == 'string') {
                    content = $($('<div />').html(content).children()[0]);
                }

                if (content && content.length) {
                    ec = $('#' + content[0].id);

                    if (!wnd.contentId) {
                        wnd.contentId = content[0].id;
                    }

                    if (!ec.length || !ec.hasClass('modal-content')) {
                        c = $('<div />').addClass('modal-content-outer');

                        this._container = $('<div />').addClass('modal-window').addClass(content.attr('class')).insertAfter(content).append(c);

                        c.append($('<h3>').addClass('modal-title').text(Ifly.App.unwrap(this.options.title) || content.attr('title')));
                        c.append(content.addClass('modal-content').removeAttr('title').show());

                        if (buttons && buttons.length) {
                            bc = $('<div />').addClass('modal-buttons').appendTo(c);

                            for (var i = 0; i < buttons.length; i++) {
                                ((b, index) => {
                                    bce = $('<button />').text(Ifly.App.unwrap(b.text)).bind('click', (e) => {
                                        if (typeof (b.click) != 'undefined') {
                                            b.click(wnd, { event: e });
                                        }

                                        this.dispatchEvent('buttonClicked', {
                                            button: {
                                                text: Ifly.App.unwrap(b.text),
                                                index: index
                                            },
                                            event: e
                                        });
                                    });

                                    bc.append(bce);
                                })(buttons[i], i);
                            }
                        }
                        
                        this._container.css({
                            'top': (Math.round($(window).height() / 2) -
                                Math.round(this._container.height() / 2)) + 'px'
                        });

                        this._container.find('.modal-close-button').unbind('click').bind('click', e => {
                            this.close();
                        });
                    } else {
                        this._container = ec.parents('.modal-window');
                    }
                }
            };

            if (!this._overlay || !this._overlay.length) {
                this._overlay = $('.modal-overlay');
                if (!this._overlay.length) {
                    this._overlay = $('<div />').addClass('modal-overlay').appendTo(document.body);
                }
            }

            if (!this._container || !this._container.length) {
                if (this.options && this.options.content) {
                    if (typeof (this.options.content) == 'function') {
                        this.options.content((c) => {
                            tryCreateLayout(c, this.options.buttons);
                            callback();
                        });
                    } else {
                        tryCreateLayout(this.options.content, this.options.buttons);
                        callback();
                    }
                }
            } else {
                callback();
            }
        }

        /** Initializes all instances of the window. */
        private static initialize() {
            if (!this._initialized) {
                $(document.body).keyup((e) => {
                    /* "setTimeout" allows other event handlers to execute first 
                    (some of them will be cancelled depending on whether modal window is open). */
                    setTimeout(() => {
                        var code = e.keyCode || e.charCode || e.which,
                            c = this.getCurrent();

                        if (code == 27 && c && !!Ifly.App.unwrap(c.options.closeOnEscape)) {
                            c.close();
                        }
                    }, 10);
                });

                this._initialized = true;
            }
        }

        /** Returns the currently active window. */
        public static getCurrent(): ModalWindow {
            return this._current && this._current.length ? this._current[this._current.length - 1] : null;
        }

        /** Returns all active windows. */
        public static getAll(): ModalWindow[] {
            return this._current;
        }

        /** 
         * Updates the position of the given modal window.
         * @param {object} modal Modal.
         */
        private static reposition(w: ModalWindow, calc?: boolean) {
            var m = w._container, modalWidth = !!calc ? m.outerWidth() : 700 /* Sometimes the calc is off by ~10px so the modal is not centered :-| */;

            m.css({
                top: parseInt(<any>(($(window).height() / 2) - (m.height() / 2)), 10) + 'px',
                left: parseInt(<any>(($(window).width() / 2) - (modalWidth / 2)), 10) + 'px'
            });
        }

        /**
         * Removes the given window from the list of active windows.
         * @param {ModalWindow} window Window to remove. 
         * @param {boolean} wasReplacingCurrent Value indicating whether the window was replacing previous.
         */
        private static removeActive(window: ModalWindow, wasReplacingCurrent?: boolean) {
            var list = [], prev = null;

            if (window && this._current && this._current.length) {
                for (var i = 0; i < this._current.length; i++) {
                    if (this._current[i] != window && this._current[i].contentId != window.contentId) {
                        list.push(this._current[i]);
                    }
                }

                this._current = list;

                if (wasReplacingCurrent && this._current.length) {
                    prev = this._current[this._current.length - 1];
                    prev.fadeIn();
                }
            }
        }

        /**
         * Adds the given window to the list of active windows.
         * @param {ModalWindow} window Window to add. 
         * @param {boolean} replaceCurrent Value indicating whether to replace currently active window.
         */
        private static setActive(window: ModalWindow, replaceCurrent?: boolean) {
            var prev = null;

            if (!this._current) {
                this._current = [];
            }

            if (!this._current.length || this._current[this._current.length - 1] != window) {
                this._current.push(window);

                if (this._current.length > 1 && replaceCurrent) {
                    prev = this._current[this._current.length - 2];
                    prev.fadeOut();
                }
            }
        }
    }

    /** Represents an API endpoint. */
    export class ApiEndpoint {
        private _timeout: number;
        private _queue: any;
        private static _autoId: number;

        /** Gets or sets Facebook API. */
        public facebook: IFacebookApiSettings;

        /** Gets or sets Google API. */
        public google: IGoogleApiSettings;

        /** Gets or sets the session Id. */
        public sessionId: string;

        /** Gets or sets the root URL. */
        public root: string;

        /** Gets or sets value indicating whether API is running in demo mode. */
        public demo: boolean;

        /** Gets or sets the queue flush timeout. */
        public queueFlushTimeout: number;

        /** Gets or sets the default queue flush timeout. */
        public defaultQueueFlushTimeout: number;

        /** Gets or sets a callback which is executed whenever API error occurs. */
        public onError: (xhr?: JQueryXHR, status?: string, er?: string, url?: string, settings?: any) => any;

        /** Initializes a new instance of an object. */
        constructor() {
            var self = this,
                ensureGoogleApi = function (name, version, callback) {
                    var gaLoadTimer = null, cont = () => {
                        if (typeof (window['gapi'].client[name]) !== 'undefined') {
                            if (callback) {
                                callback();
                            }
                        } else {
                            window['gapi'].client.load(name, version, callback);
                        }
                    };

                    if (!self.google.loaded) {
                        gaLoadTimer = setInterval(() => {
                            if (self.google.loaded) {
                                clearInterval(gaLoadTimer);
                                cont();
                            }
                        }, 25);
                    } else {
                        cont();
                    }
                },
                ensureGoogleAnalytics = function (callback) {
                    ensureGoogleApi('analytics', 'v3', callback);
                }, ensureGoogleDrive = function (callback) {
                    ensureGoogleApi('drive', 'v2', () => {
                        window['gapi'].load('picker', { callback: callback });
                    });
                };

            this.root = '/';
            this.demo = false;

            this.queueFlushTimeout = this.defaultQueueFlushTimeout = 500;

            this.facebook = {
                _scope: 'publish_actions',

                load: function (callback) {
                    var script = null,
                        curWaitChecks = 0,
                        maxWaitChecks = 100,
                        waitInterval = null,
                        checkCompletion = () => {
                            var result = false;

                            if (window['fbAsyncInitStatus'] === 'complete') {
                                result = true;
                                callback();
                            }

                            return result;
                        },
                        startCheckCompletion = () => {
                            waitInterval = setInterval(() => {
                                if (checkCompletion() || (++curWaitChecks > maxWaitChecks)) {
                                    clearInterval(waitInterval);
                                }
                            }, 50);
                        };

                    if (!checkCompletion()) {
                        if (window['fbAsyncInitStatus'] === 'pending') {
                            startCheckCompletion();
                        } else {
                            window['fbAsyncInitStatus'] = 'pending';
                            window['fbAsyncInit'] = () => {
                                window['FB'].init({
                                    appId: '521113044653315',
                                    xfbml: true,
                                    version: 'v2.1'
                                });

                                window['fbAsyncInitStatus'] = 'complete';
                            };

                            script = document.createElement('script');
                            script.id = 'facebook-jssdk';
                            script.src = 'https://connect.facebook.net/en_US/sdk.js';

                            document.body.appendChild(script);

                            startCheckCompletion();
                        }
                    }
                },

                authorize: function (onComplete) {
                    window['FB'].login(function (response) {
                        if (response.authResponse) {
                            onComplete({
                                authorized: true,
                                accessToken: response.authResponse.accessToken
                            });
                        } else {
                            onComplete({
                                authorized: false
                            });
                        }
                    }, { scope: this._scope });
                },

                ensureAuthorized: function (onComplete) {
                    var self = this;

                    window['FB'].getLoginStatus(function (response) {
                        if (response.status === 'connected') {
                            window['FB'].api('/me/permissions', function (permResponse) {
                                var permsMap = {},
                                    requiresLogin = false,
                                    perms = permResponse.data || [],
                                    scopes = self._scope.split(',');

                                for (var i = 0; i < perms.length; i++) {
                                    if (perms[i].status === 'granted') {
                                        permsMap[perms[i].permission] = true;
                                    }
                                }

                                for (var i = 0; i < scopes.length; i++) {
                                    if (!permsMap[scopes[i]]) {
                                        requiresLogin = true;
                                        break;
                                    }
                                }

                                if (!requiresLogin) {
                                    onComplete({
                                        authorized: true,
                                        accessToken: response.authResponse.accessToken
                                    });
                                } else {
                                    self.authorize(onComplete);
                                }
                            });
                        } else {
                            self.authorize(onComplete);
                        }
                    });
                }
            };

            this.google = {
                loaded: false,
                apiKey: 'AIzaSyAI3z4sG6-DJlFguwED-vbnK0qEvt8OuwA',
                clientId: '732432655752-sc8rnb18i0os9s6gg9ru3fnvbdghc6mf.apps.googleusercontent.com',

                modules: {
                    youtube: {
                        url: '',
                        load: function (callback) {
                            (callback || function () { })();
                        },
                        authorize: function (onComplete) {
                            this._authorizeInternal(false, onComplete);
                        },
                        ensureAuthorized: function (onComplete) {
                            var self = this;

                            this.checkAuthorizationStatus(function (result) {
                                if (!result.authorized || !result.accessToken || !result.accessToken.length) {
                                    self.authorize(onComplete);
                                } else {
                                    onComplete(result);
                                }
                            });
                        },
                        checkAuthorizationStatus: function (onComplete) {
                            this._authorizeInternal(true, onComplete);
                        },
                        _authorizeInternal: function (immediate, onComplete) {
                            var completeWrapper = function (r, u?) {
                                onComplete({
                                    authorized: r && !r.error,
                                    accessToken: r ? r.access_token : null,
                                    user: u
                                });
                            };

                            window['gapi'].auth.authorize({ client_id: self.google.clientId, scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/youtube.upload'], immediate: immediate }, function (result) {
                                if (result && result.access_token && !result.error) {
                                    window['gapi'].client.request({
                                        path: '/oauth2/v1/userinfo?alt=json'
                                    }).then(function (response) {
                                        completeWrapper(result, response.result);
                                    });
                                } else {
                                    completeWrapper(result);
                                }
                            });
                        }
                    },

                    drive: {
                        url: '',
                        load: ensureGoogleDrive,
                        authorize: function (onComplete) {
                            this._authorizeInternal(false, onComplete);
                        },
                        ensureAuthorized: function (onComplete) {
                            var self = this;

                            this.checkAuthorizationStatus(function (result) {
                                if (!result.authorized || !result.accessToken || !result.accessToken.length) {
                                    self.authorize(onComplete);
                                } else {
                                    onComplete(result);
                                }
                            });
                        },
                        checkAuthorizationStatus: function (onComplete) {
                            this._authorizeInternal(true, onComplete);
                        },
                        _authorizeInternal: function (immediate, onComplete) {
                            var completeWrapper = function (r, u?) {
                                onComplete({
                                    authorized: r && !r.error,
                                    accessToken: r ? r.access_token : null,
                                    user: u
                                });
                            };

                            window['gapi'].auth.authorize({ client_id: self.google.clientId, scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/drive'], immediate: immediate }, function (result) {
                                if (result && result.access_token && !result.error) {
                                    window['gapi'].client.request({
                                        path: '/oauth2/v1/userinfo?alt=json'
                                    }).then(function (response) {
                                            completeWrapper(result, response.result);
                                        });
                                } else {
                                    completeWrapper(result);
                                }
                            });
                        }
                    },

                    analytics: {
                        _timer: null,
                        _columns: [],
                        _metrics: [],
                        _dimensions: [],
                        _columnsLoading: false,
                        _columnsLoaded: false,
                        _getAuthorizationResult: function (data) {
                            return {
                                authorized: data ? (data.authorized || data.Authorized || false) : false,
                                accessToken: data ? (data.accessToken || data.AccessToken || '') : ''
                            };
                        },
                        _getUserId: function () {
                            var result = 0, ctx = (<any>Ifly.App.getInstance().getContext());

                            if (ctx && ctx.presentation && ctx.presentation.userId) {
                                result = ctx.presentation.userId;
                            } else {
                                ctx = Ifly.App.getInstance().options.data;

                                if (ctx && ctx.userId) {
                                    result = ctx.userId;
                                }
                            }

                            return result;
                        },
                        url: '',
                        load: ensureGoogleAnalytics,
                        authorize: function (onComplete) {
                            var userId = this._getUserId(), delay = 250, self = this,
                                maxElapsed = delay * 100, isLoading = false, elapsed = 0, timer = null;

                            if (userId > 0) {
                                window.open(this.url);

                                if (this._timer) {
                                    clearInterval(this._timer);
                                }

                                this._timer = setInterval(() => {
                                    if (elapsed < maxElapsed) {
                                        if (!isLoading) {
                                            isLoading = true;

                                            $.post('/oauth/googleanalytics/status?userId=' + userId, data => {
                                                var r = self._getAuthorizationResult(data);

                                                isLoading = false;
                                                elapsed += delay;

                                                if (r.authorized) {
                                                    clearInterval(this._timer);
                                                    onComplete(r);
                                                }
                                            });
                                        }
                                    } else {
                                        clearInterval(this._timer);
                                        onComplete({});
                                    }
                                }, delay);
                            } else {
                                onComplete({});
                            }
                        },
                        ensureAuthorized: function (onComplete) {
                            var userId = this._getUserId(), self = this;

                            if (userId > 0) {
                                $.post('/oauth/googleanalytics/ensure?userId=' + userId, data => {
                                    onComplete(self._getAuthorizationResult(data));
                                });
                            } else {
                                onComplete({ accessToken: '' });
                            }
                        },
                        checkAuthorizationStatus: function (onComplete) {
                            var userId = this._getUserId(), self = this;

                            if (userId > 0) {
                                $.post('/oauth/googleanalytics/status?userId=' + userId, data => {
                                    onComplete(self._getAuthorizationResult(data));
                                });
                            } else {
                                onComplete({ accessToken: '' });
                            }
                        },
                        getDimensions: function (onComplete: (dimensions: IGoogleAnalyticsDimension[]) => any) {
                            var o = this

                            if (this._dimensions.length) {
                                onComplete(this._dimensions);
                            } else {
                                this.ensureMetadata(columns => {
                                    o._dimensions = [];

                                    for (var i = 0; i < columns.length; i++) {
                                        if (columns[i].attributes) {
                                            if ((columns[i].attributes.type || '').toLowerCase() == 'dimension' &&
                                                (columns[i].attributes.status || '').toLowerCase() == 'public') {

                                                    o._dimensions[o._dimensions.length] = {
                                                        id: columns[i].id,
                                                        name: columns[i].attributes.group + ': ' + columns[i].attributes.uiName,
                                                        description: columns[i].attributes.description
                                                    };
                                            }
                                        }
                                    }

                                    onComplete(o._dimensions);
                                });
                            }
                        },
                        getMetrics: function (onComplete: (metrics: IGoogleAnalyticsMetric[]) => any) {
                            var o = this

                            if (this._metrics.length) {
                                onComplete(this._metrics);
                            } else {
                                this.ensureMetadata(columns => {
                                    o._metrics = [];

                                    for (var i = 0; i < columns.length; i++) {
                                        if (columns[i].attributes) {
                                            if ((columns[i].attributes.type || '').toLowerCase() == 'metric' &&
                                                (columns[i].attributes.status || '').toLowerCase() == 'public') {

                                                o._metrics[o._metrics.length] = {
                                                    id: columns[i].id,
                                                    name: columns[i].attributes.group + ': ' + columns[i].attributes.uiName,
                                                    description: columns[i].attributes.description
                                                };
                                            }
                                        }
                                    }

                                    onComplete(o._metrics);
                                });
                            }
                        },
                        ensureMetadata: function (onComplete: (columns: any) => any) {
                            var o = this, loadedWatcher = null;

                            if (this._columns.length) {
                                onComplete(this._columns);
                            } else {
                                ensureGoogleAnalytics(() => {
                                    if (!o._columnsLoading) {
                                        o._columnsLoading = true;

                                        window['gapi'].client.analytics.metadata.columns.list({
                                            'reportType': 'ga'
                                        }).execute(results => {
                                            o._columns = results ? (results.items || []) : [];
                                            o._columnsLoaded = true;

                                            onComplete(o._columns);
                                        });
                                    } else {
                                        loadedWatcher = setInterval(() => {
                                            if (o._columnsLoaded) {
                                                clearInterval(loadedWatcher);
                                                onComplete(o._columns);
                                            }
                                        }, 25);
                                    }
                                });
                            }
                        }
                    }
                },
                onLoad: function () {
                    window['gapi'].client.setApiKey(self.google.apiKey);

                    self.google.loaded = true;
                }
            };
        }
        
        /**
         * Establishes the new session.
         * @param {Function} complete A function which is executed when session has been established.
         */
        public createSession(complete?: Function) {
            var callback = complete || function () { }, sid = '', lsKey = 'Ifly.SessionId';

            if (!this.sessionId || !this.sessionId.length) {
                sid = localStorage.getItem(lsKey);

                this.put('sessions/new', {
                    clientId: new Date().getTime(),
                    currentSessionId: sid && sid.length ? sid : null
                }, (error, data) => {
                    this.sessionId = data;
                    localStorage.setItem(lsKey, this.sessionId);

                    callback();
                }, true);
            } else {
                callback();
            }
        }

        public get(url: string, id?: number, complete?: Function, background?: boolean) {
            this.invoke(url, { type: 'get', data: id != null && id > 0 ? { id: id } : null, complete: complete, background: background });
        }

        public post(url: string, data?: any, complete?: Function, background?: boolean) {
            this.invoke(url, { type: 'post', data: data, complete: complete, background: background });
        }

        public put(url: string, data?: any, complete?: Function, background?: boolean) {
            this.invoke(url, { type: 'put', data: data, complete: complete, background: background });
        }

        public delete(url: string, id: number, complete?: Function, background?: boolean) {
            this.invoke(url, { type: 'delete', data: id != null && id > 0 ? { id: id } : null, complete: complete, background: background });
        }

        public update(url: string, data?: any, complete?: Function, background?: boolean) {
            this.invoke(url, { type: (data && (data.id || data.Id) > 0) ? 'put' : 'post', data: data, complete: complete, background: background });
        }

        public ping(complete?: Function) {
            this.invoke('sessions/ensure?instanceId=' + Ifly.App.getInstance().options.instanceId + '&t=' + (new Date().getTime()), { type: 'get', complete: complete, background: true });
        }

        public upload(url: string, file: any, complete?: Function, keepProgress?: boolean) {
            var self = this,
                xhr = new XMLHttpRequest(), 
                form = new FormData(),
                root = this.root + (this.root.lastIndexOf('/') == this.root.length - 1 ? '' : '/'),
                callback = (url) => {
                    if (typeof (keepProgress) == 'undefined' || keepProgress == null || !keepProgress) {
                        self.hideProgress();
                    }

                    if (url == 'null') {
                        url = null;
                    } else if (url && url.length && url.indexOf('"') == 0 && url.lastIndexOf('"') == (url.length - 1)) {
                        url = url.substr(1, url.length - 2);
                    }

                    (complete || function () { })(url);
                };
           
            if (file.files.length) {
                form.append('file', file.files[0]);
            } else {
                callback(null);
            }

            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    callback(xhr.status != 200 ? null : xhr.responseText);
                }
            };

            this.showProgress();
            
            xhr.open('POST', root + 'api/' + url, true);
            xhr.setRequestHeader('Accept', 'application/json');

            xhr.send(form);
        }

        /**
         * Adds a given action to a sync queue.
         * @param {string} url Action URL.
         * @param {Function} action Action to execute.
         */
        public enqueue(url: string, action: Function, timeout?: number) {
            var t = !timeout || timeout <= 0 ? this.queueFlushTimeout : timeout;

            if (!this._queue) this._queue = {};

            if (url && url.length) {
                if (this._queue[url]) {
                    clearTimeout(this._queue[url]);
                    delete this._queue[url];
                }

                this._queue[url] = setTimeout(() => {
                    action(url, this);
                    delete this._queue[url];
                }, t);
            }
        }

        private invoke(url: string, settings: any) {
            var callback = settings.complete || function () { }, embedFix = '/-/', embedFixIndex = -1,
                relativeUrl = url, idEmbedded = false, id = '', idParsed = -1, finalUrl = '',
                root = this.root + (this.root.lastIndexOf('/') == this.root.length - 1 ? '' : '/');

            if (!settings.background && !this.demo) {
                this.hideProgress();
                this.beginShowProgress();
            } 

            if (this.demo) {
                this.displayDemoNotice();
            }

            if (settings.data) {
                id = settings.data.id || settings.data.Id || '';
            }

            if (relativeUrl.indexOf('{id}') >= 0) {
                idEmbedded = true;
                relativeUrl = relativeUrl.replace('{id}', id).replace('//', '/');
            }

            if (settings.type != 'post' && settings.data && !idEmbedded) {
                if (relativeUrl.indexOf(embedFix) < 0) {
                    // If no {id} token was embedded into the URL yet and it does end with "/[number]"
                    // FIXME: The regex needs to be the following: ^[0-9]+$, but too risky to change it without having regression tests.
                    if (relativeUrl.indexOf('/') > 0 && relativeUrl.split('/').slice(-1)[0].match(/[0-9]+/) != null) {
                        relativeUrl = relativeUrl.substr(0, relativeUrl.lastIndexOf('/') + 1) + id;
                    } else {
                        relativeUrl += '/' + id;
                    }
                }
            }

            /* Clearing what has been so far on the queue for this URL - will be overwritten. */
            if (this._queue && settings.type != 'get') {
                delete this._queue[url];
            }
            
            if (!this.demo || (relativeUrl || '').toLowerCase().indexOf('feedback') >= 0) {
                finalUrl = root + 'api/' + relativeUrl;

                // OMG, why don't we have regression tests!?
                embedFixIndex = finalUrl.indexOf(embedFix);

                if (embedFixIndex > 0) {
                    finalUrl = finalUrl.substr(0, embedFixIndex) + ((embedFixIndex + embedFix.length) <
                        finalUrl.length ? finalUrl.substr(embedFixIndex + embedFix.length) : '');
                }

                $.ajax(finalUrl, {
                    type: settings.type,
                    data: settings.data,
                    beforeSend: (xhr) => {
                        xhr.setRequestHeader('X-Ifly-SessionId', this.sessionId);
                    },
                    success: (data, status, xhr) => {
                        if (!settings.background) {
                            this.hideProgress();
                        }

                        if (settings.type != 'get' && relativeUrl.toLowerCase().indexOf('sessions/') < 0) {
                            this.updateLastSynced();
                        }

                        callback(true, data, status, xhr);
                    },
                    error: (xhr, status, er) => {
                        if (!settings.background) {
                            this.hideProgress();
                        }

                        if (this.onError) {
                            this.onError(xhr, status, er, finalUrl, settings);
                        }

                        callback(false, null, status, xhr);
                    }
                });
            } else {
                if (settings.type == 'get' || settings.type == 'delete') {
                    callback(true, {}, null, null);
                } else if (settings.type == 'put') {
                    callback(true, settings.data || { Id: id }, null, null);
                } else if (settings.type == 'post') {
                    idParsed = parseInt(id, 10);

                    if (isNaN(idParsed) || idParsed == null || idParsed <= 0) {
                        if (!ApiEndpoint._autoId) {
                            ApiEndpoint._autoId = 0;
                        }

                        idParsed = (++ApiEndpoint._autoId);
                    }

                    callback(true, idParsed, null, null);
                }

                setTimeout(() => {
                    this.updateDemo();
                }, 100);
            }
        }

        public showProgress() {
            var p = $('#progress');

            if (!p.hasClass('progress-show')) {
                p.addClass('progress-show');
            }
        }

        public hideProgress() {
            var p = $('#progress');

            if (this._timeout) {
                clearTimeout(this._timeout);
                this._timeout = null;
            }

            if (p.hasClass('progress-show')) {
                p.removeClass('progress-show');
            }
        }

        public beginShowProgress() {
            this._timeout = setTimeout(() => {
                this.showProgress();
            }, 500);
        }

        public updateLastSynced() {
            var s = $('#last-synced'), dt = new Date(), dayTime = 'AM',
                hours = dt.getHours(), minutes = dt.getMinutes();

            $('#sync-error').removeClass('active');

            var parLeft = (n) => {
                return n < 10 ? '0' + n : n.toString();
            };

            if (hours > 12) {
                hours = hours - 12;
                dayTime = 'PM';
            }

            s.find('span').text(hours + ':' + parLeft(minutes) + ' ' + dayTime);

            if (!s.hasClass('active')) {
                s.addClass('active');
            }
        }

        /** Returns the demo data. */
        public getDemo(): any {
            var p = localStorage.getItem('Ifly.Demo');
            return p != null && p.length > 0 ? JSON.parse(p) : null;
        }

        /** Displays demo notice. */
        private displayDemoNotice() {
            var s = $('#last-synced');

            if (!s.hasClass('active')) {
                s.addClass('demo-mode').addClass('active');
            }
        }

        /** Updates the demo data within the local storage. */
        private updateDemo() {
            if (typeof (Ifly.Editor) != 'undefined') {
                localStorage.setItem('Ifly.Demo', JSON.stringify(Ifly.Editor.getInstance().presentation.serialize()));
            }
        }

        /**
         * Displays an API error.
         * @param {string} text Error text.
         */
        public showError(text: string) {
            var s = $('#sync-error');

            if (!text || !text.length) {
                text = Ifly.App.getInstance().terminology.unexpectedError;
            }

            text = text.trim();

            $('#last-synced').removeClass('active');

            s.find('span').text(text).attr('title', text);

            if (!s.hasClass('active')) {
                s.addClass('active');
            }
        }
    }

    /** Represents script bundle manager. */
    export class ScriptBundleManager {
        /** Gets or sets global bundle Id suffix. */
        private static _bundleIdSuffix: number;

        /** Gets or sets the bundle map. */
        private _bundles: any;

        /** Initializes a new instance of an object. */
        constructor() {
            this._bundles = {};
        }

        /**
         * Register new bundle.
         * @param url {string} Bundle URL.
         * @param id {string=} Bundle Id. Of imitted, will be generated.
         * @returns {string} Bundle Id.
         */
        public registerBundle(url: string, id?: string) {
            var ret = null;

            /* Making sure our global id suffix has initial value. */
            if (!ScriptBundleManager._bundleIdSuffix) {
                ScriptBundleManager._bundleIdSuffix = 1;
            }

            ret = id || ('bundle_' + new Date().getTime() + '_' + (ScriptBundleManager._bundleIdSuffix++));

            this._bundles[id] = { url: url };

            return ret;
        }

        /**
         * Loads the given bundle.
         * @param id {string} Bundle Id.
         * @returns {Q.Promise} A promise which, when resolves, indicates of a successful load of the given bundle.
         */
        public loadBundle(id: string): Q.Promise<any> {
            return Q.when()
                .then(() => {
                    return this._bundles[id];
                })
                .then((bundle: any) => {
                    return !bundle ?
                        Q.reject(new Error('Bundle with Id "' + id + '" is not registered and therefore cannot be loaded.')) :
                        Utils.ScriptLoader.loadScript(bundle.url, { scriptId: id });
                })
                .catch(err => {
                    return Q.reject(err);
                });
        }
    }

    /** Represents an application. */
    export class App extends EventSource {
        private static _instance: App;

        /** Gets or sets the load status. */
        private _loadStatus: any;

        /** Gets or sets application options. */
        public options: any;

        /** Gets or sets the global terminology. */
        public terminology: any;

        /** Gets or sets the list of all registered components. */
        public components: any;

        /** Gets or sets script bundle manager. */
        public bundles: ScriptBundleManager;

        /** Gets or sets the root URL of the application. */
        public rootUrl: string;

        /** Gets or sets the API endpoint. */
        public api: ApiEndpoint;

        /** Gets or sets browser information. */
        public browser: IBrowserInfo;

        /** Initializes a new instance of an object. */
        constructor() {
            super();

            var ua = navigator.userAgent.toLowerCase(),
                uap = (navigator.platform || '').toLowerCase();

            this.terminology = {};
            this.components = {};
            this.bundles = new ScriptBundleManager();
            this.api = new ApiEndpoint();

            this._loadStatus = {
                document: false,
                fonts: false,
                canvas: false,
                charts: false,
                preloadables: false
            };

            this.rootUrl = location.protocol + '//' + location.hostname + '/';

            this.browser = {
                ie: navigator.appName == 'Microsoft Internet Explorer',
                chrome: !!window['chrome'] || ua.indexOf('chrome') >= 0,
                firefox: ua.indexOf('firefox') >= 0,
                mac: !!uap.match(/(Mac|iPhone|iPod|iPad)/i),
                mobile: !!ua.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i)
            };
        }

        public title(value?: string): string {
            var ret = '';

            if (value && value.length) {
                ret = document.title = value + ' | Sprites';
            } else {
                ret = document.title;
            }

            return ret;
        }

        public registerComponent(name: string, settings?: any) {
            if (!this.components[name]) {
                this.components[name] = settings || {};
            }
        }

        /**
         * Initializes the application.
         * @param {object} options Options.
         */
        public initialize(options?: any) {
            var updateMenuOffsets = () => {
                $('.status').add($('.feedback')).css({
                    right: (($('.canvas').outerWidth(true) - $('.canvas iframe').width()) / 2) +
                        ($('.canvas-container').hasClass('with-help-panel') ? parseInt($('.help-panel').css('width'), 10) : 0) + 'px'
                });
            };

            /* Occurs when load status of a given resource changes. */
            var statusChanged = (resource: string) => {
                var loaded = true;

                this._loadStatus[resource] = true;

                /* Aligning the menus with the canvas. */
                updateMenuOffsets();

                /* Determining whether everything has been loaded */
                for (var p in this._loadStatus) {
                    if (typeof (this._loadStatus[p]) != 'function' && !this._loadStatus[p]) {
                        loaded = false;
                        break;
                    }
                }

                /* All loaded */
                if (loaded) {
                    /* Removing the hash if it's in the URL (can be passed from OAuth providers). */
                    if (window.location.hash && window.location.hash.length > 1) {
                        if (typeof (history.replaceState) != 'undefined') {
                            history.replaceState('', document.title, window.location.pathname);
                        }
                    }

                    $(() => {
                        setTimeout(() => {
                            var onSessionCreated = () => {
                                var overlays = $('#app-loading-overlay, #app-loading-progress-container'),
                                    progress = $('#app-loading-progress-container .progress');

                                progress.removeClass('progress-show');
                                overlays.addClass('hidden');

                                setTimeout(() => {
                                    overlays.hide();

                                    $(document.body).addClass('loaded');
                                    this.dispatchEvent('loaded');
                                }, 350);
                            }

                            if (!options.embedded) {
                                /* Establishing user session. */
                                this.api.createSession(() => {
                                    onSessionCreated();
                                });
                            } else {
                                onSessionCreated();
                            }
                        }, 500);
                    });
                }
            };

            this.options = options = options || {};

            this.terminology = options.terminology || {};
            this.api.root = options.root || '/';
            this.api.demo = !!options.demo;

            if (this.api.demo) {
                $('.user-menu button.icon-plus').hide();
            }

            this.dispatchEvent('loading');

            $(document).ajaxError((e, xhr, settings, error) => {
                var description = xhr.responseText || '', o = null;

                if (!settings || !settings.url || (settings.url || '').toLowerCase().indexOf('spritesapp.com') > 0) {
                    if (description.indexOf('{') == 0) {
                        try {
                            o = $.parseJSON(description);
                        } catch (ex) { }

                        if (o != null && o.ExceptionMessage) {
                            description = o.ExceptionMessage;
                        }
                    }

                    if (description.indexOf('"') == 0 && description.lastIndexOf('"') == description.length - 1) {
                        description = description.substr(1, description.length - 2);
                    }

                    this.api.showError(description);

                    this.dispatchEvent('apiError', {
                        error: error,
                        status: xhr.status,
                        description: description
                    });
                }
            });

            $(document).ready(() => {
                if (options.preload) {
                    App.preloadContent(options.preload, null, () => {
                        /* Loading custom fonts defined in user themes. */
                        Ifly.Utils.FontLoader.loadCustomFontsFromAllThemes(() => {
                            statusChanged('preloadables');
                        });
                    });
                } else {
                    /* Loading custom fonts defined in user themes. */
                    Ifly.Utils.FontLoader.loadCustomFontsFromAllThemes(() => {
                        statusChanged('preloadables');
                    });
                }
            });

            /* Waiting for DOM, images, etc. */
            window.onload = () => { statusChanged('document'); };

            /* Loading fonts */
            window['WebFont'].load({
                google: {
                    families: [
                        'Open+Sans:400italic,700italic,300,400,700',
                        'Open+Sans+Condensed:300,700',
                        'Josefin+Slab:400,700,400italic',
                        'Roboto:400,700,400italic,700italic',
                        'Ubuntu:400,700'
                    ]
                },

                active: () => {
                    statusChanged('fonts');
                }
            });

            /* Loading charts */
            Ifly.Models.Charts.GoogleChartsProvider.load(() => {
                statusChanged('charts');
            });

            if (!this.isExternallyEmbedded() || options.data) {
                setTimeout(() => {
                    var updateDimensions = () => {
                        var dimensions = new Ifly.Models.Embed.Infographic($('.canvas .slide')[0])
                            .getViewportParameters();

                        frame.attr({
                            width: dimensions.width,
                            height: dimensions.height
                        });

                        updateMenuOffsets();
                    }, hostCheckInterval = -1, frame = $('<iframe />');

                    frame.attr({
                        id: 'canvas-frame',
                        frameborder: '0',
                        src: !options.embedded ? '/edit/canvas' : ('/view/embed/' + options.data.id + '/canvas')
                    }).css({
                        background: 'transparent'
                    }).addClass('slide' + (options.embedded ? ' publish' : '')).appendTo($('.canvas'));

                    updateDimensions();
                    $(window).resize(() => updateDimensions());
                    $(window).resize(() => {
                        this.dispatchEvent('resize');
                    });

                    if (!options.embedded) {
                        hostCheckInterval = setInterval(() => {
                            if (Ifly.Editor.getInstance().composition.host) {
                                clearInterval(hostCheckInterval);
                                statusChanged('canvas');
                            }
                        }, 50);
                    } else {
                        hostCheckInterval = setInterval(() => {
                            if (Ifly.Models.Embed.Player.getInstance().canvas) {
                                clearInterval(hostCheckInterval);
                                statusChanged('canvas');
                            }
                        }, 50);
                    }
                }, 50);
            } else {
                statusChanged('canvas');
            }
        }

        /** Returns value indicating whether the app is hosted within the editor. */
        public isEditorHosted(): boolean {
            var ret = false;

            try {
                ret = window.parent != null && window.parent['Ifly'] != null &&
                    window.parent['Ifly'].Editor != null;
            } catch (ex) { }

            return ret;
        }

        /** Gets or sets value indicating whether application is externally embedded. */
        public isExternallyEmbedded(): boolean {
            var ret = false;

            try {
                ret = window.self !== window.top;
            } catch (e) {
                ret = true;
            }

            return ret;
        }

        /** Returns value indicating whether infographic image export parameters are provided. */
        public isImageExportRequested(): boolean {
            var loc = (location.href || '').toLowerCase();
            return loc.indexOf('_cef') >= 0 && loc.indexOf('_cef:animation=0') >= 0;
        }

        /** Returns the current application context. */
        public getContext(): IAppContext {
            var editor = null, ret = { presentation: null },
                tryThis = (op: () => boolean): boolean => {
                    var result = false;

                    try {
                        result = op();
                    } catch (ex) { result = false; }

                    return result;
                }, tryGetContext = (w: Window): boolean => {
                    var result = false;

                    if (w['Ifly'].Editor != null) {
                        ret.presentation = w['Ifly'].Editor.getInstance().presentation.serialize();
                        result = true;
                    } else if (w['Ifly'].Models != null && w['Ifly'].Models.Embed != null) {
                        ret.presentation = w['Ifly'].Models.Embed.Player.getInstance().infographic;
                        result = true;
                    }

                    return result;
                };

            if (!tryThis(() => {
                var result = false;

                if (window.parent != null && window.parent['Ifly'] != null) {
                    result = tryGetContext(window.parent);
                }

                return result;
            })) {
                tryThis(() => {
                    var result = false;

                    if (window['Ifly'] != null) {
                        result = tryGetContext(window);
                    }

                    return result;
                });
            }

            return ret;
        }

        public openModal(options: any): ModalWindow {
            var ret = new ModalWindow(options);

            ret.open();

            return ret;
        }

        /**
         * Tracks the given event.
         * @param {string} category Event category.
         * @param {string} name Event name.
         * @param {number=} metric Event metric.
         */
        public trackEvent(category: string, name?: string, metric?: number) {
            var ga = window['ga'],
                payload = null;

            if (typeof (ga) !== 'undefined') {
                payload = {
                    'hitType': 'event',
                    'eventCategory': category,
                    'eventAction': name || '.',
                    'eventValue': metric
                };

                try {
                    ga('send', payload);
                } catch (ex) { }
            }
        }

        public static getInstance(): App {
            if (!this._instance) {
                this._instance = new App();
            }
           
            return this._instance;
        }

        public static unwrap(value: any) {
            return value ? (typeof(value) == 'function' ? value() : value) : null;
        }

        /**
         * Preloads the given content.
         * @param {Array} content Content to preload.
         * @param {Function} preloaded A callback which is called for every preloaded content.
         * @param {Function} complete A callback which is called when all the content is considered preloaded.
         */
        public static preloadContent(content: any[], preloaded?: (result: any) => any, complete?: () => any): boolean {
            var ret = false, imagesToPreload = [], realtimeDataToPreload = [], c = null, queue = null,
                param = null, successMap = {}, beginPreloadImages = (images: string[]): any => {
                    var c = $('<div />').addClass('image-preloader').css({
                        position: 'absolute',
                        left: '-99999999px',
                        overflow: 'hidden'
                    });

                    for (var i = 0; i < images.length; i++) {
                        c.append($('<div />').css({
                            background: 'url(' + images[i] + ')'
                        }).attr({
                            'data-tag': i.toString()
                        }));
                    }

                    $(document.body).append(c);

                    for (var i = 0; i < images.length; i++) {
                        preloaded({
                            content: images[i],
                            result: {
                                container: c,
                                tag: i.toString()
                            }
                        });
                    }
                };

            complete = complete || function () { };
            preloaded = preloaded || function () { };

            if (content && content.length) {
                imagesToPreload = $.map($.grep(content, (e: any, i) => {
                    return e.type == 'image';
                }), (e, i) => { return e.url; });

                if (imagesToPreload.length) {
                    beginPreloadImages(imagesToPreload);
                }

                realtimeDataToPreload = $.map($.grep(content, (e: any, i) => {
                    return e.type == 'realtime';
                }), (e, i) => {
                    var id = new Date().getTime().toString() + i;

                    if (typeof (e.tag) !== 'undefined') {
                        id = e.tag.toString();
                    }

                    return {
                        id: id,
                        tag: e.tag,
                        url: e.url,
                        preloaded: e.preloaded,
                        parameters: e.parameters,
                        sourceType: e.sourceType,
                        elementType: e.elementType
                    };
                });

                if (realtimeDataToPreload.length) {
                    ret = true;

                    queue = new Utils.AsyncQueue();

                    for (var i = 0; i < realtimeDataToPreload.length; i++) {
                        ((d) => {
                            queue.enqueue((resolve) => {
                                Utils.Input.createDataImportHandler(d.sourceType).importData(d.url, {
                                    complete: (error, xhr, data?) => {
                                        resolve(data);
                                    }, success: (data, size) => {
                                        successMap[d.id] = true;
                                    }
                                }, {
                                    validate: d.elementType,
                                    parameters: d.parameters
                                });
                            }, d.id);
                        })(realtimeDataToPreload[i]);
                    }

                    queue.whenAll(results => {
                        for (var id in results) {
                            if (successMap[id]) {
                                c = $.grep(realtimeDataToPreload, function (e) {
                                    return e.id === id;
                                });

                                if (c && c.length) {
                                    param = {
                                        content: c[0],
                                        result: results[id]
                                    };

                                    preloaded(param);

                                    if ($.isFunction(c[0].preloaded)) {
                                        c[0].preloaded(param);
                                    }
                                }
                            }
                        }

                        complete();
                    });
                } else {
                    complete();
                }
            } else {
                complete();
            }

            return ret;
        }
    }
}