/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents voice-over edit settings. */
    export class VoiceOverEditSettings implements IModel {
        /** Gets or sets the container. */
        public container: JQuery;

        /** Gets or sets the count-down. */
        public countDown: KnockoutObservable<number>;

        /** Gets or sets  recorder status. */
        public recorderStatus: KnockoutObservable<RecorderStatus>;

        /** Gets or sets the recorder. */
        public recorder: IAudioRecorderSuite;

        /** Gets or sets the time remaining to play the entire presentation. */
        public timeRemaining: KnockoutObservable<string>;

        /** Gets or sets value indicating whether system is capturing recording. */
        public isCapturingRecording: KnockoutObservable<boolean>;

        /** Gets or sets the voice-over data. */
        private _data: Blob;

        /** Gets or sets the player. */
        private _player: Ifly.Models.Embed.Player;

        /** Gets or sets value indicating whether user is recording. */
        private _isRecording: boolean;

        /** Gets or sets time ticker. */
        private _timeTicker: any;

        /** Gets or sets the recording. */
        private _recording: any;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {object} container DOM element which corresponds to a view container.
         */
        constructor(data?: any, container?: any, options?: any) {
            this.container = $(container);
            this.countDown = ko.observable<number>();
            this.recorderStatus = ko.observable<RecorderStatus>();
            this.timeRemaining = ko.observable<string>();
            this.isCapturingRecording = ko.observable<boolean>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.countDown(5);
            this.recorderStatus(RecorderStatus.unknown);
        }

        /**  Serializes object state. */
        public serialize(): any {
            return {
                data: this._data
            };
        }

        /**
         * Begins recording.
         * @param {boolean=} restart Value indicating whether to restart an infographic.
         */
        public beginRecording(restart?: boolean) {
            var controls = this.container.find('.presentation-view-controls'),
                m = VoiceOverEditModal.getInstance(),
                timeRemaining = 0;

            this.container.find('.presentation-view-start-recording').hide().removeClass('showing');
            this.container.find('.presentation-view-controls').removeClass('showing').css('visibility', 'hidden');

            this._isRecording = true;
            this._recording = null;

            clearInterval(this._timeTicker);

            /* Hiding "Save" button. */
            m.modal.updateButtons({
                primary: {
                    visible: false
                }
            });

            if (restart) {
                setTimeout(() => {
                    this._player.stop();
                    this._player.clear();
                }, 100);
            }

            this.runCountDown(() => {
                if (this._isRecording) {
                    /* Starting to show equzlier data. */
                    this.recorder.equalizer.refresh();
                    this.recorder.recorder.startRecording();

                    /* Showing "Save" button. */
                    m.modal.updateButtons({
                        primary: {
                            visible: true
                        }
                    });

                    /* Showing controls overlay. */
                    controls.css('visibility', 'visible').addClass('showing');

                    /* Calculating the overall playback time. */
                    timeRemaining = Utils.TimeHandling.getPresentationPlaybackTime();
                    this.timeRemaining(Utils.TimeHandling.formatTime(timeRemaining));

                    timeRemaining--;

                    /* The timer controls the "Time remaining" ticker. */
                    this._timeTicker = setInterval(() => {
                        this.timeRemaining(Utils.TimeHandling.formatTime(timeRemaining));

                        if (timeRemaining > 0) {
                            timeRemaining--;
                        } else {
                            clearInterval(this._timeTicker);
                        }
                    }, 1000);

                    /* Hiding the closing slide (if displayed). */
                    if (restart) {
                        this._player.closing.hide();
                    }

                    /* Starting the playback. */
                    this._player.beginPlaying(!!restart, {
                        autoPlay: true
                    });
                }
            });
        }

        /**
         * Captures the current recording and returns is via the given callback.
         * @param callback {Function} Callback.
         * @return {boolean} Value indicating whether recording can be captured at this time.
         */
        public captureRecording(callback?: Function) {
            var ret = true;

            if (!this._recording) {
                this.recorder.recorder.removeEventListener('audio');

                this.recorder.recorder.addEventListener('audio', (sender, args) => {
                    this._recording = args.audio;

                    if (callback) {
                        callback(this._recording);
                    }
                });

                if (this._isRecording) {
                    /* Stopping current recording. */
                    this.recorder.recorder.stopRecording();
                } else {
                    ret = false;
                }
            } else if (callback) {
                callback(this._recording);
            }

            return ret;
        }

        /**
         * Occurs when presentation playback is finished.
         */
        public onPresentationPlaybackFinished() {
            /* Stopping to show equzlier data. */
            this.recorder.equalizer.stop();

            /* Capturing the recording. */
            this.captureRecording();
        }

        /** Stops the presentation and recording. */
        public stop() {
            if (this._player) {
                this._player.stop();
            }

            /* Stopping to show equzlier data. */
            this.recorder.equalizer.stop();

            clearInterval(this._timeTicker);

            this.timeRemaining('0:00');
        }

        /**
         * Runs the count-down.
         * @param callback {Function} A callback which is executed when count-down is depleted.
         */
        public runCountDown(callback: () => any) {
            var countDownContainer = this.container.find('.presentation-view-countdown'),
                nextCountDown = this.countDown(),

                spin = () => {
                    var animatingElements = [],
                        transformStyles = ['-webkit-transform', '-ms-transform', 'transform'],
                        countDownElement = this.container.find('.presentation-view-countdown .count-down'),
                        countDownValue = countDownElement.find('.inset span');

                    if (this._isRecording) {
                        if (nextCountDown < 1) {
                            countDownContainer.addClass('hiding');

                            setTimeout(() => {
                                countDownContainer.hide();

                                setTimeout(() => {
                                    countDownContainer.removeClass('hiding');

                                    ko.utils.arrayForEach(animatingElements, elm => {
                                        for (var i in transformStyles) {
                                            elm.css(transformStyles[i], 'rotate(0deg)');
                                        }
                                    });

                                    callback();
                                }, 30);
                            }, 325);
                        } else {
                            animatingElements = [
                                countDownElement.find('.circle .fill, .circle .mask.full'),
                                countDownElement.find('.circle .fill.fix')
                            ];

                            ko.utils.arrayForEach(animatingElements, elm => {
                                elm.addClass('no-animate');
                            });

                            setTimeout(() => {
                                ko.utils.arrayForEach(animatingElements, elm => {
                                    for (var i in transformStyles) {
                                        elm.css(transformStyles[i], 'rotate(0deg)');
                                    }
                                });

                                setTimeout(() => {
                                    ko.utils.arrayForEach(animatingElements, elm => {
                                        elm.removeClass('no-animate');
                                    });

                                    setTimeout(() => {
                                        for (var index = 0; index < animatingElements.length; index++) {
                                            for (var i in transformStyles) {
                                                animatingElements[index].css(transformStyles[i], 'rotate(' + (180 * (index + 1)) + 'deg)');
                                            }
                                        }

                                        setTimeout(() => {
                                            nextCountDown = this.countDown() - 1;

                                            setTimeout(() => {
                                                if (nextCountDown > 0) {
                                                    this.countDown(nextCountDown);
                                                }
                                            }, 30 * 2);

                                            spin();
                                        }, 1000);
                                    }, 30);
                                }, 30);
                            }, 30);
                        }
                    } else {
                        callback();
                    }
                };

            this.countDown(3);

            countDownContainer.show();

            spin();
        }

        /*
         * Initializes audio recorder.
         */
        public initializeRecorder() {
            this.recorderStatus(RecorderStatus.initializing);

            if (this.recorder) {
                this.recorder.equalizer.stop();

                this.recorder.recorder.removeEventListener('ready');
                this.recorder.recorder.removeEventListener('error');
            }

            this.recorder = AudioRecorder.createSuite(this.container.find('.presentation-view-controls .equalizer canvas'));

            this.recorder.recorder.addEventListener('ready', () => {
                this.recorderStatus(RecorderStatus.ready);
            });

            this.recorder.recorder.addEventListener('error', () => {
                this.recorderStatus(RecorderStatus.error);
            });
        }

        /** Starts loading the presentation. */
        public beginLoadPresentation() {
            var timer = null,
                app = Ifly.App.getInstance(),
                presentationView = this.container.find('.presentation-view'),
                startRecording = this.container.find('.presentation-view-start-recording'),
                presentationViewOverlay = this.container.find('.presentation-view-overlay');

            setTimeout(() => {
                /* Loading the presentation (embed code). */
                presentationView.append($('<script>').attr({
                    type: 'text/javascript',
                    src: location.protocol + '//' + location.host + '/view/embed/' + Ifly.Editor.getInstance().presentation.id() + '?_vo=1'
                }));

                timer = setInterval(() => {
                    var frame = presentationView.find('iframe');

                    if (frame && frame.length && frame.get(0).contentWindow.Sprites &&
                        frame.get(0).contentWindow.Sprites.Player) {

                        clearInterval(timer);

                        this._player = frame.get(0).contentWindow.Sprites.Player.getInstance();

                        /* When playback is finished, capturing recording. */
                        this._player.addEventListener('playbackFinished', (sender, args) => {
                            setTimeout(() => {
                                this.onPresentationPlaybackFinished();
                            }, 1000);
                        });

                        this._player.addEventListener('infographicSelected', (sender, args) => {
                            args.preventDefault = true;

                            /* Hiding "Loading presentation" overlay. */
                            presentationViewOverlay.addClass('hiding');

                            setTimeout(() => {
                                /* Completing animaiton (rather than hiding element, moving out - otherwise, progress animation freezes on next run). */
                                presentationViewOverlay.css({
                                    left: '-999999px',
                                    top: '-999999px'
                                });

                                /* Enabling "Start recording" button. */
                                startRecording.show();

                                setTimeout(() => {
                                    /* Showing "Start recording" button. */
                                    startRecording.addClass('showing');

                                    /* Initializing recorder (requesting permissions). */
                                    this.initializeRecorder();
                                }, 25);
                            }, 310);
                        });
                    }
                }, 50);
            }, 350);
        }

        /** Resets the settings. */
        public reset() {
            var m = VoiceOverEditModal.getInstance(),
                app = Ifly.App.getInstance(),
                c = app.components['VoiceOverEditModal'];

            m.modal.updateButtons({
                primary: {
                    enabled: true,
                    visible: false,
                    text: c.terminology.save
                },
                secondary: {
                    enabled: true
                }
            });

            this._player = null;
            this._isRecording = false;
            this._recording = null;

            this.isCapturingRecording(false);

            Ifly.App.getInstance().api.hideProgress();

            clearInterval(this._timeTicker);

            this.container.find('.presentation-view').empty();
            this.container.find('.presentation-view-countdown').hide().removeClass('hiding');
            this.container.find('.presentation-view-start-recording').removeClass('showing').hide();
            this.container.find('.presentation-view-overlay').removeClass('hiding').css({ left: 0, top: 0 });
            this.container.find('.presentation-view-controls').removeClass('showing').css('visibility', 'hidden');

            this.countDown(5);

            if (this.recorder) {
                this.recorder.equalizer.stop();
            }
        }
    }

    /** Represents a voice-over edit modal. */
    export class VoiceOverEditModal extends ModalForm<VoiceOverEditSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: VoiceOverEditModal;

        /** Gets or sets an optional callback that is called when data is saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#voice-over-edit', () => {
                return new VoiceOverEditSettings(null, this.container);
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['VoiceOverEditModal'];

            super.load(data);

            this._saved = o.save;
            
            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    replaceCurrent: true,
                    buttons: [
                        {
                            text: c.terminology.save,
                            click: () => { this.save(); },
                            visible: function () { return false; }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this.cancel(); }
                        }
                    ]
                });
            } else {
                this.modal.open();
            }

            this.data.reset();

            this.enabled(true);
            this.data.beginLoadPresentation();

            Ifly.App.getInstance().trackEvent('discover', 'voice-over');
        }

        /** Saves the data. */
        public save() {
            var c = Ifly.App.getInstance().components['VoiceOverEditModal'];

            Ifly.App.getInstance().trackEvent('act', 'voice-over');
            
            if (this._saved) {
                this.modal.updateButtons({
                    primary: {
                        enabled: false,
                        text: c.terminology.saving
                    },
                    secondary: {
                        enabled: false
                    }
                });

                this.data.stop();
                this.data.isCapturingRecording(true);

                this.data.captureRecording(recording => {
                    this._saved({ recording: recording });
                    this._saved = null;

                    this.close();
                });
            }
        }

        /** Closes the window. */
        public close() {
            this.data.reset();

            super.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): VoiceOverEditModal {
            if (!this._instance) {
                this._instance = new VoiceOverEditModal();
            }

            return this._instance;
        }
    }
}