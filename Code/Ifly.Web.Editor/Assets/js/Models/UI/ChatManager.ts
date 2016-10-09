module Ifly.Models.UI {

    /** Represents a chat SignalR hub. */
    export class ChatHub extends Ifly.EventSource {
        private _chat: any;
        private _isReady: boolean;
        private _onReadyQueue: Function[];

        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this._onReadyQueue = [];
            this._chat = (<any>$).connection.chatHub;

            this._chat.client.onParticipantJoined = (name: string) => {
                this.dispatchEvent('participantJoined', { name: name });
            };

            this._chat.client.onParticipantLeft = (name: string) => {
                this.dispatchEvent('participantLeft', { name: name });
            };

            this._chat.client.onMessageReceived = (name: string, message: string, recipient?: string) => {
                this.dispatchEvent('messageReceived', { name: name, message: message, recipient: recipient });
            };

            Ifly.Editor.getInstance().collaboration.addEventListener('realtimeCommunicationInitialized', (sender, e) => {
                this._isReady = true;

                while (this._onReadyQueue.length > 0) {
                    this._onReadyQueue.splice(0, 1)[0]();
                }
            });
        }

        /**
         * Joins the room.
         * @param {string} room Room name.
         * @param {string} name Participant name.
         */
        public join(room: string, name: string): boolean {
            var ret = this._isReady;

            if (ret) {
                this._chat.server.join(room, name);
            }

            return ret;
        }

        /**
         * Leaves the room.
         * @param {string} room Room name.
         * @param {string} name Participant name.
         */
        public leave(room: string, name: string): boolean {
            var ret = this._isReady;

            if (ret) {
                this._chat.server.leave(room, name);
            }

            return ret;
        }

        /**
         * Sends a message.
         * @param {string} room Room name.
         * @param {string} name Participant name.
         * @param {string} message Message.
         * @param {string} recipient Message recipient.
         */
        public send(room: string, name: string, message: string, recipient?: string): boolean {
            var ret = this._isReady;

            if (ret) {
                this._chat.server.send(room, name, message, recipient);
            }

            return ret;
        }

        /**
         * Registers a callback which is fired when hub is ready.
         * @param {Function} callback A callback.
         */
        public onReady(callback: Function) {
            if (this._isReady) {
                callback();
            } else {
                this._onReadyQueue.push(callback);
            }
        }
    }

    /** Represents chat message. */
    export class ChatMessage implements IModel {
        /** Gets or sets participant name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the message. */
        public message: KnockoutObservable<string>;

        /** Gets or sets value indicating whether to HTML-encode the message. */
        private _htmlEncode: boolean;

        /** Initializes a new instance of an object. */
        constructor(data?: any) {
            this._htmlEncode = true;

            this.name = ko.observable<string>();
            this.message = ko.observable<string>();

            (<any>this.message).htmlEnabled = ko.computed<string>(() => {
                var ret = this.message(),
                    emoticons = [
                        {
                            text: [':-D', ':D'],
                            icon: 'excited'
                        },
                        {
                            text: [':-|', ':|'],
                            icon: 'doh'
                        },
                        {
                            text: [':-)', ':)'],
                            icon: 'happy'
                        },
                        {
                            text: [':-(', ':('],
                            icon: 'unhappy'
                        }
                    ];

                if (this._htmlEncode) {
                    ret = Utils.Input.htmlEncode(ret);

                    ret = ret.replace('&lt;strong&gt;', '<strong>');
                    ret = ret.replace('&lt;/strong&gt;', '</strong>');

                    ret = ret.replace(ChatWindow.emailPattern, '<a target="_blank" href="mailto:$&">$&</a>');
                    ret = ret.replace(ChatWindow.urlPattern, (value) => {
                        var result = value, offset = 0;

                        for (var i = 0; i < arguments.length; i++) {
                            if (typeof (arguments[i]) === 'number') {
                                offset = arguments[i];
                                break;
                            }
                        }

                        if (offset === 0 || ret.charAt(offset - 1) !== '@') {
                            if (result.indexOf('://') < 0) {
                                result = 'http://' + result;
                            }

                            result = '<a target="_blank" href="' + result + '">' + value + '</a>';
                        }

                        return result;
                    });

                    ko.utils.arrayForEach(emoticons, icon => {
                        ko.utils.arrayForEach(icon.text, t => {
                            ret = ret.replace(new RegExp(t
                                .replace(')', '\\)')
                                .replace('(', '\\(')
                                .replace('|', '\\|'), 'gi'),
                                $('<div />').append($('<object />').attr({
                                    'width': '16',
                                    'type': 'image/svg+xml',
                                    'data': '/assets/img/emoticons/' + icon.icon + '.svg'
                                })).html());
                        });
                    });
                }   

                return ret;
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.name(data.name || data.Name || '');
            this.message(data.message || data.Message || '');

            if (typeof (data.htmlEncode) !== 'undefined' && data.htmlEncode !== null) {
                this._htmlEncode = !!data.htmlEncode;
            } else {
                this._htmlEncode = true;
            }
        }

        /** Serializes object state. */
        public serialize() {
            return {
                name: this.name(),
                message: this.message()
            };
        }
    }

    /** Represents a chat window. */
    export class ChatWindow extends Ifly.EventSource {
        /** Gets or sets value indicating whether window is visible. */
        public isVisible: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether there are unread messages in this chat. */
        public containsUnreadMessages: KnockoutObservable<boolean>;

        /** Gets or sets the new message. */
        public newMessage: KnockoutObservable<string>;
         
        /** Gets or sets the list of chat messages. */
        public messages: KnockoutObservableArray<ChatMessage>;

        /** Gets or sets the name of the current participant. */
        public me: KnockoutObservable<string>;

        /** Gets or sets the URL regex pattern. */
        public static urlPattern: RegExp = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;

        /** Gets or sets the email regex pattern. */
        public static emailPattern: RegExp = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gi;

        /** Represents a new instance of an object. */
        constructor() {
            super();

            this.messages = ko.observableArray<ChatMessage>();
            this.newMessage = ko.observable<string>();
            this.isVisible = ko.observable<boolean>();
            this.containsUnreadMessages = ko.observable<boolean>();
            this.me = ko.observable<string>();
        }

        /** Toggles window visibility. */
        public toggleVisibility() {
            this.isVisible(!this.isVisible());

            if (this.isVisible()) {
                this.containsUnreadMessages(false);

                this.refreshScroll();

                setTimeout(() => {
                    var input = $('#chat-window input[type="text"]').get(0);

                    try {
                        input.focus();
                        input.select();
                    } catch (ex) { }
                }, 25);

                Ifly.App.getInstance().trackEvent('discover', 'chat');
            }
        }

        /**
         * Occurs when the given participant joined the chat.
         * @param {string} name Participant name.
         */
        public onParticipantJoined(name: string) {
            this.addMessage(null, Ifly.App.getInstance().components['ChatManager']
                .terminology['participantJoined'].replace(/\{0\}/gi, name, false));
        }

        /**
         * Occurs when the given participant left the chat.
         * @param {string} name Participant name.
         */
        public onParticipantLeft(name: string) {
            this.addMessage(null, Ifly.App.getInstance().components['ChatManager']
                .terminology['participantLeft'].replace(/\{0\}/gi, name, false));
        }
        
        /**
         * Adds new message.
         * @param {string} name Participant name.
         * @param {string} messages Messages.
         * @param {boolean} htmlEncode Value indicating whether to HTML-encode message.
         */
        public addMessage(name: string, message: string, htmlEncode?: boolean) {
            this.messages.push(new ChatMessage({ name: name, message: message, htmlEncode: htmlEncode }));

            if (!this.isVisible()) {
                this.containsUnreadMessages(true);
            } else {
                this.refreshScroll();
            }

            Ifly.App.getInstance().trackEvent('act', 'chat');
        }

        /**
         * Occurs when user is typing new user's email.
         * @param {string} value Current value.
         * @param {KeyboardEvent} event Event.
         */
        public onNewMessageKeyUp(value: string, event: KeyboardEvent) {
            if ((event.keyCode || event.charCode || event.which) == 13) {
                value = Utils.Input.trim(value || '');

                (<any>event).target.value = '';

                if (value && value.length) {
                    this.addMessage(Ifly.App.getInstance().components['ChatManager'].terminology['me'], value);
                    
                    this.dispatchEvent('messageEntered', {
                        message: value
                    });
                }
            }
        }

        /** Refreshes the scroll. */
        private refreshScroll() {
            var messageList = $('#chat-window .message-list');

            messageList.get(0).nanoscroller = null;
            (<any>messageList).nanoScroller({ scroll: 'bottom' });
        }
    }

    /** Represents a chat manager. */
    export class ChatManager extends Component {
        /** Gets or sets value indicating whether manager has been initialized. */
        private _initialized: boolean;

        /** Gets or sets the chat hub. */
        private _hub: ChatHub;

        /** Gets or sets the current room name. */
        private _room: string;

        /** Gets or sets the current participant. */
        private _me: string;

        /** Gets or sets the current chat session. */
        public currentSession: ChatWindow;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);

            this.currentSession = new ChatWindow();
        }

        /** Initializes the object. */
        public initialize() {
            var c = Ifly.App.getInstance().components['ChatManager'];

            if (!this._initialized) {
                this._initialized = true;

                /* Room Id is presentation Id for simplicity. */
                this._room = this.editor.presentation.id().toString();

                /* Resolving the name of the current participant. */
                this._me = Utils.Input.trim(this.editor.user.name() || '');

                if (!this._me || !this._me.length) {
                    this._me = Utils.Input.trim(this.editor.user.email() || '');

                    /* Generating the name of anonymous user. */
                    if (!this._me || !this._me.length) {
                        this._me = c.terminology['anonymous'] + ('_') + new Date().getTime().toString().split(/\d/gi).reverse().slice(0, 5).join('');
                    }
                }

                this._hub = new ChatHub();
                this.currentSession.me(this._me);

                /* When someone joins the chat, showing this. */
                this._hub.addEventListener('participantJoined', (sender, e) => {
                    if (e.name !== this._me) {
                        this.currentSession.onParticipantJoined(e.name);

                        /* Telling the user that we're up for a chat. */
                        this._hub.send(this._room, null, c.terminology['participantOnline'].replace(/\{0\}/gi, this._me), e.name);
                    }
                });

                /* When someone leaves the chat, showing this. */
                this._hub.addEventListener('participantLeft', (sender, e) => {
                    if (e.name !== this._me) {
                        this.currentSession.onParticipantLeft(e.name);
                    }
                });

                /* When someone sends a message, displaying it. */
                this._hub.addEventListener('messageReceived', (sender, e) => {
                    if (e.name !== this._me && (!e.recipient || e.recipient === this._me)) {
                        this.currentSession.addMessage(e.name, e.message);
                    }
                });

                this._hub.onReady(() => {            
                    /* Joining the chat. */
                    this._hub.join(this._room, this._me);

                    /* When the message is entered into the chat window, broadcasting it. */
                    this.currentSession.addEventListener('messageEntered', (sender, e) => {
                        this._hub.send(this._room, this._me, e.message);
                    });

                    /* Leaving when window unloads (close/follow link). */
                    $(window).on('beforeunload', () => {
                        this._hub.leave(this._room, this._me);
                    });
                });
            }
        }
    }
} 