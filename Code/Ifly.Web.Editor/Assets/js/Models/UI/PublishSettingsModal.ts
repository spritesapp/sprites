/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../PublishConfiguration.ts" />

module Ifly.Models.UI {
    /** Represents image export format. */
    export enum ImageExportFormat {
        /** JPG. */
        jpg = 0,

        /** PDF. */
        pdf = 1
    }

    /** Represents publish type. */
    export enum PublishType {
        /** Web. */
        web = 0,

        /** Image. */
        image = 1,

        /** Video. */
        video = 2,

        /** Present. */
        present = 3
    }

    /** Represents publish target. */
    export enum PublishTarget {
        /** URL. */
        url = 0,

        /** IFrame. */
        iframe = 1,

        /** WordPress. */
        wordPress = 2
    }

    /** Represents YouTube upload settings. */
    export class YouTubeUploadSettings extends Ifly.EventSource {
        /** Gets or sets value indicating whether upload is enabled. */
        public enabled: KnockoutObservable<boolean>;

        /** Gets or sets access token. */
        public accessToken: KnockoutObservable<string>;

        /** Gets or sets the YouTube user Id. */
        public userId: KnockoutObservable<string>;

        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this.accessToken = ko.observable<string>();
            this.userId = ko.observable<string>();
            this.enabled = ko.observable<boolean>(false);
            this.enabled.subscribe(v => {
                var c = Ifly.App.getInstance().components['PublishSettingsModal'],
                    m = PublishSettingsModal.getInstance();

                if (v) {
                    m.data.videoExport.facebookUpload.enabled(false);
                }

                m.modal.updateButtons({
                    primary: {
                        enabled: true,
                        text: c.terminology[!!v && this.accessToken() && this.accessToken().length ? 'createAndSend' : 'createVideo']
                    },
                    secondary: {
                        enabled: true
                    }
                });

                if (!v) {
                    this.accessToken('');
                }
            });
        }

        /**
         * Tries to change "enabled" state for YouTube upload.
         * @param {boolean} enabled "enabled" state value.
         * @param {Function} onComplete A callback which is called when operation completes.
         */
        public tryChangeEnabled(enabled: boolean, onComplete?: (result: any) => any) {
            var youtube = Ifly.App.getInstance().api.google.modules.youtube, callback = (result) => {
                this.accessToken(result.accessToken || '');
                this.userId(result.user ? result.user.id : '');
                this.enabled(result.authorized && result.accessToken && result.accessToken.length);

                (onComplete || function () { })(result);
            };

            if (!enabled) {
                callback({
                    authorized: false,
                    accessToken: ''
                });
            } else {
                if (this.accessToken() && this.accessToken().length) {
                    callback({
                        authorized: true,
                        accessToken: this.accessToken()
                    });
                } else {
                    youtube.load(() => {
                        youtube.ensureAuthorized(callback);
                    });
                }
            }
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {boolean} isPreviousState Indicates whether this is the previous state of the model.
         */
        public load(data: any, isPreviousState?: boolean) {
            this.enabled(false);
        }

        /** Returns destination definition for this task. */
        public toDestinationDefinition(): string {
            var ret = 'YouTube:', params = [], p = Ifly.Editor.getInstance().presentation;

            params[params.length] = 'UserId=' + encodeURIComponent(this.userId());
            params[params.length] = 'AccessToken=' + encodeURIComponent(this.accessToken());
            params[params.length] = 'Title=' + encodeURIComponent(p.title());
            
            return ret + params.join('&');
        }
    }

    /** Represents Facebook upload settings. */
    export class FacebookUploadSettings extends Ifly.EventSource {
        /** Gets or sets value indicating whether upload is enabled. */
        public enabled: KnockoutObservable<boolean>;

        /** Gets or sets access token. */
        public accessToken: KnockoutObservable<string>;

        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this.accessToken = ko.observable<string>();
            this.enabled = ko.observable<boolean>(false);
            this.enabled.subscribe(v => {
                var c = Ifly.App.getInstance().components['PublishSettingsModal'],
                    m = PublishSettingsModal.getInstance();

                if (v) {
                    m.data.videoExport.youtubeUpload.enabled(false);
                }

                m.modal.updateButtons({
                    primary: {
                        enabled: true,
                        text: c.terminology[!!v && this.accessToken() && this.accessToken().length ? 'createAndSend' : 'createVideo']
                    },
                    secondary: {
                        enabled: true
                    }
                });

                if (!v) {
                    this.accessToken('');
                }
            });
        }

        /**
         * Tries to change "enabled" state for Facebook upload.
         * @param {boolean} enabled "enabled" state value.
         * @param {Function} onComplete A callback which is called when operation completes.
         */
        public tryChangeEnabled(enabled: boolean, onComplete?: (result: any) => any) {
            var facebook = Ifly.App.getInstance().api.facebook, callback = (result) => {
                this.accessToken(result.accessToken || '');
                this.enabled(result.authorized && result.accessToken && result.accessToken.length);

                (onComplete || function () { })(result);
            };

            if (!enabled) {
                callback({
                    authorized: false,
                    accessToken: ''
                });
            } else {
                if (this.accessToken() && this.accessToken().length) {
                    callback({
                        authorized: true,
                        accessToken: this.accessToken()
                    });
                } else {
                    facebook.load(() => {
                        facebook.ensureAuthorized(callback);
                    });
                }
            }
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {boolean} isPreviousState Indicates whether this is the previous state of the model.
         */
        public load(data: any, isPreviousState?: boolean) {
            this.enabled(false);
        }

        /** Returns destination definition for this task. */
        public toDestinationDefinition(): string {
            var ret = 'Facebook:', params = [], p = Ifly.Editor.getInstance().presentation;

            params[params.length] = 'AccessToken=' + encodeURIComponent(this.accessToken());
            params[params.length] = 'Title=' + encodeURIComponent(p.title());

            return ret + params.join('&');
        }
    }

    /** Represents video export task. */
    export enum VideoExportTask {
        /** Create video. */
        create = 0,

        /** Publish video. */
        publish = 1
    }

    /** Represents presenter mode settings. */
    export class PresenterModeSettings implements IModel {
        /** Gets or sets the infographic URL. */
        public url: KnockoutObservable<string>;

        /** Gets or sets the Id of the related presentation. */
        public presentationId: KnockoutObservable<number>;

        /** Gets or sets the availability of the element/slide animations. */
        public animations: KnockoutObservable<PresenterModeAnimationAvailability>;

        /** Gets or sets value indicating whether Sprites is allowed to ask for fullscreen mode. */
        public allowFullscreen: KnockoutObservable<boolean>;

        /** Initializes a new instance of an object. */
        constructor() {
            this.url = ko.observable<string>();
            this.presentationId = ko.observable<number>();
            this.animations = ko.observable<PresenterModeAnimationAvailability>();
            this.allowFullscreen = ko.observable<boolean>(true);

            Utils.Input.makeCheckable(this, 'animations', true);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {boolean} isPreviousState Indicates whether this is the previous state of the model.
         */
        public load(data: any, isPreviousState?: boolean) {
            var animations = null,
                allowFullscreen = null;

            data = data || {};
            
            this.url(data.url || data.Url || (this.url() || ''));
            this.presentationId(data.presentationId || data.PresentationId || 0);
            
            animations = data.animations || data.Animations;
            allowFullscreen = typeof (data.allowFullscreen) !== 'undefined' ? data.allowFullscreen : data.AllowFullscreen;
            
            if (typeof (animations) != 'undefined' && animations != null) {
                this.animations(animations);
            } else {
                this.animations(PresenterModeAnimationAvailability.minimal);
            }

            if (typeof (allowFullscreen) != 'undefined' && allowFullscreen != null) {
                this.allowFullscreen(allowFullscreen);
            } else {
                this.allowFullscreen(true);
            }
        }

        /** Serializes object state. */
        public serialize() {
            return {
                url: this.url(),
                presentationId: this.presentationId(),
                animations: this.animations(),
                allowFullscreen: this.allowFullscreen()
            };
        }
    }

    /** Represents video export settings. */
    export class VideoExportSettings extends Ifly.EventSource {
        /** Gets or sets value indicating whether export is in progress. */
        public isExporting: KnockoutObservable<boolean>;

        /** Gets or sets the current task. */
        public currentTask: KnockoutObservable<VideoExportTask>;

        /** Gets or sets value indicating whether an error occured during export. */
        public wasError: KnockoutObservable<boolean>;

        /** Gets or sets the export width. */
        public width: KnockoutObservable<number>;

        /** Gets or sets the estimated video length. */
        public estimatedVideoLength: KnockoutObservable<number>;

        /** Gets or sets value indicating whether audio file has been selected. */
        public audioFileSelected: KnockoutObservable<boolean>;

        /** Gets or sets the remaining time. */
        public timeRemaining: KnockoutObservable<string>;

        /** Gets or sets YouTube upload settings. */
        public youtubeUpload: YouTubeUploadSettings;

        /** Gets or sets Facebook upload settings. */
        public facebookUpload: FacebookUploadSettings;

        /** Gets or sets the voice-over audio blob. */
        public voiceOver: Blob;

        /** Gets or sets voice over download link. */
        public voiceOverDownloadLink: KnockoutObservable<string>;

        /** Gets or sets the export check interval. */
        private _exportCheckInterval: number;

        /** Gets or sets the export delayed timer. */
        private _exportDelayedTimer: number;

        /** Gets or sets value indicating export check was issued. */
        private _exportCheckRequestIssued: boolean;

        /** Gets or sets the export key. */
        private _exportKey: string;

        /** Gets or sets the audio file field. */
        private _audioFileField: any;

        /** Gets or sets the "Time remaining" timer. */
        private _timeRemainingTimer: any;

        /** Gets or sets export download base URL. */
        private _exportDownloadBaseUrl: string;

        /** Initializes a new instance of an object. */
        constructor() {
            var c = null;

            super();

            this.width = ko.observable<number>();
            this.isExporting = ko.observable<boolean>();
            this.wasError = ko.observable<boolean>();
            this.estimatedVideoLength = ko.observable<number>();
            this.audioFileSelected = ko.observable<boolean>();
            this.timeRemaining = ko.observable<string>();
            this.youtubeUpload = new YouTubeUploadSettings();
            this.facebookUpload = new FacebookUploadSettings();
            this.currentTask = ko.observable<VideoExportTask>(VideoExportTask.create);
            this.voiceOverDownloadLink = ko.observable<string>();

            this._exportDownloadBaseUrl = Ifly.App.getInstance().options.overrideExportUrl;
            if (!this._exportDownloadBaseUrl || !this._exportDownloadBaseUrl.length) {
                this._exportDownloadBaseUrl = 'export/video/download';
            }

            (<any>this.isExporting).isDelayed = ko.observable<boolean>();

            (<any>this.estimatedVideoLength).formatted = ko.computed<string>(() => {
                var result = '', v = this.formatTime(this.estimatedVideoLength()), sec = '', comp = [],
                    format = (v: number, one: string, many: string) => {
                        var str = v.toString();
                        return str + ' ' + (v == 1 ? one : many);
                };

                if (!c) {
                    c = Ifly.App.getInstance().components['PublishSettingsModal'].terminology.timing;
                }

                comp = v.split(':');
                sec = comp[1];

                if (sec.indexOf('0') == 0 && sec.length > 1) {
                    sec = sec.substr(1);

                    if (sec == '0') {
                        sec = '';
                    }
                }

                if (comp[0].indexOf('0') == 0) {
                    result = format(parseInt(sec, 10), c.second, c.seconds);
                } else {
                    result = format(parseInt(comp[0], 10), c.minute, c.minutes);

                    if (sec.length) {
                        result += (' ' + format(parseInt(sec, 10), c.second, c.seconds));
                    }
                }

                return result;
            });
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {boolean} isPreviousState Indicates whether this is the previous state of the model.
         */
        public load(data: any, isPreviousState?: boolean) {
            var length = 0;

            this.width(1280);
            this.isExporting(false);
            (<any>this.isExporting).isDelayed(false);
            this.wasError(false);
            this.voiceOver = null;
            this.voiceOverDownloadLink('');

            this._exportCheckRequestIssued = false;
            this._exportKey = null;

            clearTimeout(this._exportDelayedTimer);
            clearInterval(this._exportCheckInterval);

            this.estimatedVideoLength(0);
            this.audioFileSelected(false);
            this.currentTask(VideoExportTask.create);
            this._audioFileField = null;

            length = Utils.TimeHandling.getPresentationPlaybackTime();

            /* For the "Created with" screen. */
            length += 4;

            this.estimatedVideoLength(length);

            this.youtubeUpload.load(data, isPreviousState);
            this.facebookUpload.load(data, isPreviousState);

            setTimeout(() => {
                Utils.UploadButtonHandler.resetInput(PublishSettingsModal
                    .getInstance().container.find('.audio-file'));
            }, 10);
        }

        /** 
         * Formats the time.
         * @param {number} v Value.
         */
        private formatTime(v: number): string {
            return Utils.TimeHandling.formatTime(v);
        }

        /** 
         * Occurs when export width is changing.
         * @param {ChartType} width Export width.
         * @param {Event} e Event object.
         */
        private onWidthChanging(width: number, e: Event) {
            this.width(width);
            $(e.target).parents('.dropdown').blur();
        }

        /**
         * Opens voice-over edit modal.
         */
        public openVoiceOverEditModal() {
            var wnd = <any>window;

            Ifly.Models.UI.VoiceOverEditModal.getInstance().open({
                data: this.voiceOver
            }, {
                save: (args) => {
                    this.voiceOver = args.recording;

                    this.voiceOverDownloadLink('');

                    if (this.voiceOver) {
                        this.voiceOverDownloadLink((wnd.URL || wnd.webkitURL).createObjectURL(this.voiceOver));
                    }
                }
            });
        }

        /** Removes the voice-over. */
        public removeVoiceOver() {
            this.voiceOver = null;
            this.voiceOverDownloadLink('');
        }

        /** Begins export. */
        public beginExport() {
            var initialTime = 0, vl = 0;

            this.wasError(false);

            this._exportCheckRequestIssued = false;
            this._exportKey = null;

            clearTimeout(this._exportDelayedTimer);
            clearInterval(this._exportCheckInterval);
            clearInterval(this._timeRemainingTimer);

            this.currentTask(VideoExportTask.create);

            vl = this.estimatedVideoLength();

            if (this.width() < 1600) {
                vl *= 2;
            }

            if (this.facebookUpload.enabled() || this.youtubeUpload.enabled()) {
                vl += 10;
            }

            if (this.voiceOver) {
                vl += 15;
            }

            vl += 10;

            initialTime = vl;
            this.timeRemaining(this.formatTime(initialTime--));

            this._timeRemainingTimer = setInterval(() => {
                this.timeRemaining(this.formatTime(initialTime));

                if (initialTime > 0) {
                    initialTime--;
                } else {
                    clearInterval(this._timeRemainingTimer);
                }
            }, 1000);

            this.isExporting(true);
            (<any>this.isExporting).isDelayed(false);

            this._exportDelayedTimer = setTimeout(() => {
                (<any>this.isExporting).isDelayed(true);
            }, (vl + 5) * 1000);

            Ifly.App.getInstance().api.showProgress();
            this.createExportTask();
        }

        /** Cancels export. */
        public cancelExport() {
            this.onExportFinished(null);
        }

        /** Creates export task. */
        private createExportTask() {
            this.uploadAudioFilesIfProvided(n => {
                if (n != null) {
                    Ifly.App.getInstance().api.post('export/video/create', {
                        width: this.width(),
                        presentationId: Ifly.Editor.getInstance().presentation.id(),
                        audio: n
                    }, (result, data) => {
                        var key = data ? (data.key || data.Key || '') : '';

                        if (key && key.length) {
                            this._exportKey = key;
                            setInterval(() => this.checkExportStatus(), 5000);
                        } else {
                            this.onExportFinished(null);
                        }
                    }, true);
                } else {
                    this.onExportFinished(null);
                }
            });
        }

        /** Checks export status. */
        private checkExportStatus() {
            var continuation = this.youtubeUpload.enabled() ? this.youtubeUpload.toDestinationDefinition() :
                (this.facebookUpload.enabled() ? this.facebookUpload.toDestinationDefinition() : '');

            if (this.currentTask() == VideoExportTask.publish) {
                continuation = '';
            }

            if (!this._exportCheckRequestIssued) {
                this._exportCheckRequestIssued = true;

                Ifly.App.getInstance().api.get('export/video/status?key=' + encodeURIComponent(this._exportKey) +
                    '&continuation=' + encodeURIComponent(continuation) + '&task=' + encodeURIComponent(VideoExportTask[this.currentTask()]), null, (result, data) => {

                    var key = data ? (data.key || data.Key || '') : '';

                    this._exportCheckRequestIssued = false;

                    if (key == this._exportKey) {
                        this.onExportFinished(data);
                    } else if (data && (data.task || data.Task || '').toLowerCase() == 'publish') {
                        this.currentTask(VideoExportTask.publish);

                        clearTimeout(this._exportDelayedTimer);
                        (<any>this.isExporting).isDelayed(false);
                    }
                }, true);
            }
        }

        /** 
         * Called when export is finished.
         * @param {object} result Export result.
         */
        private onExportFinished(result: any) {
            var key = '', success = false, extraData = null;

            if (result) {
                key = result.key || result.Key || '';
                success = typeof (result.success) != 'undefined' ? !!result.success : !!result.Success;
            }

            Ifly.App.getInstance().api.hideProgress();

            this._exportKey = null;
            this._exportCheckRequestIssued = false;
            
            clearTimeout(this._exportDelayedTimer);
            clearInterval(this._exportCheckInterval);
            clearInterval(this._timeRemainingTimer);
            this.currentTask(VideoExportTask.create);

            this.isExporting(false);
            (<any>this.isExporting).isDelayed(false);
            this.wasError(!result || !success);

            this.dispatchEvent('exportFinished');

            if (result && success) {
                if (result.extraData || result.ExtraData) {
                    try {
                        extraData = JSON.parse(result.extraData || result.ExtraData);
                    } catch (ex) { }
                }

                if (!extraData || !(extraData.url || extraData.Url)) {
                    /* This will not redirect but rather serve the "Save as" dialog. */
                    location.href = this._exportDownloadBaseUrl + '?key=' + encodeURIComponent(key);
                } else {
                    window.open(extraData.url || extraData.Url, 'wnd_' + new Date().getTime(), 'width=1024,height=768,toolbar=on,menubar=on,location=on,status=on');
                }
            }
        }

        /** 
         * Occurs when the audio file is selected.
         * @param {object} e Event object.
         */
        private onFileSelected(e: any) {
            this.audioFileSelected(true);
            this._audioFileField = $(e.target);
        }

        /** Occurs when the audio file is cleared. */
        private onFileCleared() {
            this.audioFileSelected(false);
            Utils.UploadButtonHandler.resetInput(this._audioFileField.parent());
            this._audioFileField = null;
        }

        /** 
         * Uploads audio files.
         * @param {Function} onComplete A callback which is called when audio files are uploaded.
         */
        private uploadAudioFilesIfProvided(onComplete: (name: string) => any) {
            var app = Ifly.App.getInstance(),
                audioFilesCurrent = 0,
                audioFilesTotal = 0,
                uploadResult = null,
                audioFiles = [],
                modal = null,

                /**
                 * Executes next upload task.
                 * @param callback {Function} Callback.
                 */
                uploadNextTask = (callback: Function) => {
                    var task = audioFiles[audioFilesCurrent],
                        prevResult = uploadResult;

                    if (task) {
                        audioFilesCurrent++;
                        uploadResult = null;

                        uploadNextAudio(task, audioFilesCurrent, audioFilesTotal, prevResult, n => {
                            if (n == null && uploadResult != null) {
                                removeCurrentAudio();
                            }

                            uploadResult = n;

                            if (uploadResult != null) {
                                uploadNextTask(callback);
                            } else {
                                callback();
                            }
                        });
                    } else {
                        callback();
                    }
                },

                /** Removes the currently uploaded audio file. */
                removeCurrentAudio = () => {
                    app.api.post('export/video/removeaudio?name=' + encodeURIComponent(uploadResult), null, null, true);
                },

                /**
                 * Uploads next audio.
                 * @param file {object} File.
                 * @param current {number} Current file index.
                 * @param total {number} Total files.
                 * @param prev {string} Previous file.
                 * @param callback {Function} Callback.
                 */
                uploadNextAudio = (file, current, total, prev, callback) => {
                    app.api.upload('export/video/addaudio' +
                        '?current=' + current +
                        '&total=' + total +
                        '&prev=' + encodeURIComponent(prev || '') + 
                        '&id=' + Ifly.Editor.getInstance().presentation.id(), file.data, (n) => {
                            
                        if (n != null && n.length > 0) {
                            callback(n);
                        } else {
                            modal = app.openModal({
                                content: $('#audio-upload-error'),
                                replaceCurrent: true,
                                buttons: [
                                    {
                                        text: app.terminology.ok,
                                        click: () => { modal.close(); },
                                    }
                                ]
                            });

                            callback(null);
                        }
                    }, true);
                };

            /* Adding background music. */
            if (this.audioFileSelected()) {
                if (this._audioFileField) {
                    audioFiles.push({
                        data: this._audioFileField.get(0)
                    });
                }
            }

            /* Adding voice-over. */
            if (this.voiceOver) {
                audioFiles.push({
                    data: {
                        files: [this.voiceOver]
                    }
                });
            }

            audioFilesTotal = audioFiles.length;

            if (audioFilesTotal > 0) {
                uploadNextTask(() => {
                    if (uploadResult != null) {
                        /* Clean up. */
                        ko.utils.arrayForEach(audioFiles, file => {
                            if (file.onUploaded) {
                                file.onUploaded(uploadResult != null && uploadResult.length > 0);
                            }
                        });
                    }

                    onComplete(uploadResult);
                });
            } else {
                onComplete('');
            }
        }
    }

    /** Represents image export settings. */
    export class ImageExportSettings extends Ifly.EventSource {
        /** Gets or sets value indicating whether export is in progress. */
        public isExporting: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether an error occured during export. */
        public wasError: KnockoutObservable<boolean>;

        /** Gets or sets the slide to export. */
        public slide: KnockoutObservable<number>;

        /** Gets or sets the total number of slide. */
        public totalSlides: KnockoutObservable<number>;

        /** Gets or sets the export width. */
        public width: KnockoutObservable<number>;

        /** Gets or sets image export format. */
        public format: KnockoutObservable<ImageExportFormat>;

        /** Gets or sets the export check interval. */
        private _exportCheckInterval: number;

        /** Gets or sets the export delayed timer. */
        private _exportDelayedTimer: number;

        /** Gets or sets value indicating export check was issued. */
        private _exportCheckRequestIssued: boolean;

        /** Gets or sets the export key. */
        private _exportKey: string;

        /** Gets or sets the slide change lock. */
        private _slideChangeLock: boolean;

        /** Gets or sets export download base URL. */
        private _exportDownloadBaseUrl: string;

        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this.slide = ko.observable<number>();
            this.totalSlides = ko.observable<number>();
            this.width = ko.observable<number>();
            this.isExporting = ko.observable<boolean>();
            this.wasError = ko.observable<boolean>();
            this.format = ko.observable<ImageExportFormat>();

            Ifly.Utils.Input.makeCheckable(this, 'format', true);

            this._exportDownloadBaseUrl = Ifly.App.getInstance().options.overrideExportUrl;
            if (!this._exportDownloadBaseUrl || !this._exportDownloadBaseUrl.length) {
                this._exportDownloadBaseUrl = 'export/image/download';
            }

            (<any>this.isExporting).isDelayed = ko.observable<boolean>();

            (<any>this.slide).editable = ko.observable<string>();
            (<any>this.slide).editable.subscribe((v) => {
                var parsed = parseInt(v && v.length ? v : null, 10);

                if (!this._slideChangeLock) {
                    if (!isNaN(parsed) && v.match(/^[0-9]+$/g)) {
                        if (parsed <= 0) {
                            parsed = 1;
                        } else if (parsed > this.totalSlides()) {
                            parsed = this.totalSlides();
                        }

                        this.slide(parsed - 1);
                        (<any>this.slide).editable(parsed.toString());
                    } else {
                        this.slide(0);
                        (<any>this.slide).editable('1');
                    }
                } 
            });
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {boolean} isPreviousState Indicates whether this is the previous state of the model.
         */
        public load(data: any, isPreviousState?: boolean) {
            this.slide(0);

            this._slideChangeLock = true;
            (<any>this.slide).editable('1');
            this._slideChangeLock = false;

            this.width(1024);
            this.format(ImageExportFormat.jpg);
            this.totalSlides(data.totalSlides || data.TotalSlides || 0);
            this.isExporting(false);
            (<any>this.isExporting).isDelayed(false);
            this.wasError(false);

            this._exportCheckRequestIssued = false;
            this._exportKey = null;

            clearTimeout(this._exportDelayedTimer);
            clearInterval(this._exportCheckInterval);
        }

        /** 
         * Occurs when export width is changing.
         * @param {ChartType} width Export width.
         * @param {Event} e Event object.
         */
        private onWidthChanging(width: number, e: Event) {
            this.width(width);
            $(e.target).parents('.dropdown').blur();
        }

        /** Begins export. */
        public beginExport() {
            this.wasError(false);

            this._exportCheckRequestIssued = false;
            this._exportKey = null;

            clearTimeout(this._exportDelayedTimer);
            clearInterval(this._exportCheckInterval);

            this.isExporting(true);
            (<any>this.isExporting).isDelayed(false);
                
            this._exportDelayedTimer = setTimeout(() => {
                (<any>this.isExporting).isDelayed(true);
            }, 30000);

            Ifly.App.getInstance().api.showProgress();
            this.createExportTask();
        }

        /** Cancels export. */
        public cancelExport() {
            this.onExportFinished(null);
        }

        /** Creates export task. */
        private createExportTask() {
            Ifly.App.getInstance().api.post('export/image/create', {
                slide: this.slide(),
                totalSlides: this.totalSlides(),
                width: this.width(),
                format: this.format(),
                presentationId: Ifly.Editor.getInstance().presentation.id()
            }, (result, data) => {
                var key = data ? (data.key || data.Key || '') : '';

                if (key && key.length) {
                    this._exportKey = key;
                    setInterval(() => this.checkExportStatus(), 2000);
                } else {
                    this.onExportFinished(null);
                }
            }, true);
        }

        /** Checks export status. */
        private checkExportStatus() {
            if (!this._exportCheckRequestIssued) {
                this._exportCheckRequestIssued = true;

                Ifly.App.getInstance().api.get('export/image/status?key=' + encodeURIComponent(this._exportKey), null, (result, data) => {
                    var key = data ? (data.key || data.Key || '') : '';

                    this._exportCheckRequestIssued = false;

                    if (key == this._exportKey) {
                        this.onExportFinished(data);
                    }
                }, true);
            }
        }

        /** 
         * Called when export is finished.
         * @param {object} result Export result.
         */
        private onExportFinished(result: any) {
            var key = '', success = false;

            if (result) {
                key = result.key || result.Key || '';
                success = typeof (result.success) != 'undefined' ? !!result.success : !!result.Success;
            }

            Ifly.App.getInstance().api.hideProgress();

            this._exportKey = null;
            this._exportCheckRequestIssued = false;

            clearTimeout(this._exportDelayedTimer);
            clearInterval(this._exportCheckInterval);

            this.isExporting(false);
            (<any>this.isExporting).isDelayed(false);
            this.wasError(!result || !success);

            this.dispatchEvent('exportFinished');

            if (result && success) {
                /* This will not redirect but rather server the "Save as" dialog. */
                location.href = this._exportDownloadBaseUrl + '?key=' + encodeURIComponent(key);
            }
        }
    }

    /** Represents social sharing settings. */
    export class SocialSharingSettings {
        /** Gets or sets the URL of the shared content. */
        public url: KnockoutObservable<string>;

        /** Gets or sets the title of the shared content. */
        public title: KnockoutObservable<string>;

        /** Gets the Facebook share URL. */
        public facebook: KnockoutComputed<string>;

        /** Gets the Twitter share URL. */
        public twitter: KnockoutComputed<string>;

        /** Gets the Google+ share URL. */
        public googlePlus: KnockoutComputed<string>;

        /** Gets the LinkedIn share URL. */
        public linkedIn: KnockoutComputed<string>;

        /** Initializes a new instance of an object. */
        constructor() {
            this.url = ko.observable<string>();
            this.title = ko.observable<string>();

            this.facebook = ko.computed(() => {
                return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(this.url() || '');
            });

            this.twitter = ko.computed(() => {
                var tweet = '', title = this.title();

                if (title && title.length) tweet = '"' + title + '" ';
                tweet += ((this.url() || '') + ' via @spritesapp');

                return 'https://twitter.com/home?status=' + encodeURIComponent(tweet); 
            });

            this.googlePlus = ko.computed(() => {
                return 'https://plus.google.com/share?url=' + encodeURIComponent(this.url() || '');
            });

            this.linkedIn = ko.computed(() => {
                return 'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(this.url() || '') + '&title=' + encodeURIComponent(this.title() || '');
            });
        }
    }

    /** Represents a publish configuration settings. */
    export class PublishConfigurationSettings implements IModel {
        /** Gets or sets publish target. */
        public publishTarget: KnockoutObservable<PublishTarget>;

        /** Gets or sets publish target width. */
        public publishTargetWidth: KnockoutObservable<number>;

        /** Gets or sets the publish target height. */
        public publishTargetHeight: KnockoutComputed<number>;

        /** Gets or sets the publish type. */
        public publishType: KnockoutObservable<PublishType>;

        /** Gets or sets the Id of the related presentation. */
        public presentationId: KnockoutObservable<number>;

        /** Gets or sets the zero-based index of a specific slide to display. */
        public slide: KnockoutObservable<number>;

        /** Gets or sets value indicating whether to display navigation controls. */
        public controls: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether to automatically start playing animations. */
        public autoPlay: KnockoutObservable<boolean>;

        /** Gets or sets the total number of slides available. */
        public totalSlides: KnockoutObservable<number>;

        /** Gets or sets the infographic URL. */
        public url: KnockoutObservable<string>;

        /** Gets or sets embed code. */
        public embedCode: KnockoutComputed<string>;

        /** Gets or sets the infographic title. */
        public title: KnockoutObservable<string>;

        /** Gets or sets value indicating whether to enable social sharing. */
        public enableSocialSharing: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether to enable image export. */
        public enableExport: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether to enable video export. */
        public enableVideoExport: KnockoutObservable<boolean>;

        /** Gets or sets the social sharing settings. */
        public socialSharing: SocialSharingSettings;

        /** Gets or sets the presenter settings. */
        public presenterSettings: PresenterModeSettings;

        /** Gets or sets infographic password. */
        public password: KnockoutObservable<string>;

        /** Gets or sets the image export settings. */
        public imageExport: ImageExportSettings;

        /** Gets or sets the video export settings. */
        public videoExport: VideoExportSettings;

        /** Gets or sets value indicating whether infographic URL is about to be updated. */
        private _isGoingToUpdateUrl: boolean;

        /** Gets or sets the cache key for generating infographic URL. */
        private _cacheKey: string;

        /** Gets or sets value indicating whether previous state of the model is being loaded. */
        private _isLoadingPreviousState: boolean;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            var isDemo = Ifly.App.getInstance().options.demo;

            this.publishTarget = ko.observable<PublishTarget>(PublishTarget.url);
            this.publishTargetWidth = ko.observable<number>(900);
            this.publishTargetHeight = ko.computed(() => {
                return parseInt((this.publishTargetWidth() / 5 * 3).toString(), 10);
            });

            this.publishType = ko.observable<PublishType>(PublishType.web);
            this.presentationId = ko.observable<number>();
            this.slide = ko.observable<number>(-1);
            this.controls = ko.observable<boolean>(true);
            this.autoPlay = ko.observable<boolean>(false);
            this.totalSlides = ko.observable<number>();
            this.url = ko.observable<string>();
            this.title = ko.observable<string>();
            this.socialSharing = new SocialSharingSettings();
            this.presenterSettings = new PresenterModeSettings();
            this.enableSocialSharing = ko.observable<boolean>(!isDemo);
            this.enableExport = ko.observable<boolean>(!isDemo && Ifly.Editor.getInstance().user.subscription.isPro());
            this.enableVideoExport = ko.observable<boolean>(!isDemo && Ifly.Editor.getInstance().user.subscription.isAgency());
            this.password = ko.observable<string>();
            this.imageExport = new ImageExportSettings();
            this.videoExport = new VideoExportSettings();

            (<any>this.password).isEnabled = ko.computed(() => { return !isDemo; });
            (<any>this.password).isInputVisible = ko.observable<boolean>();
            (<any>this.password).isSet = ko.observable<boolean>();
            (<any>this.password).isChanged = ko.observable<boolean>();

            this.password.subscribe(v => (<any>this.password).isChanged(true));

            this.makeCheckable('publishTarget', true);
            this.makeCheckable('publishType', true);
            this.makeCheckable('autoPlay');
            this.makeCheckable('controls');

            (<any>this.slide).editable = ko.observable<string>();
            (<any>this.slide).editable.subscribe((v) => {
                var parsed = parseInt(v && v.length ? v : null, 10);

                if (!isNaN(parsed)) {
                    if (parsed <= 0) {
                        parsed = 1;
                    } else if (parsed > this.totalSlides()) {
                        parsed = this.totalSlides();
                    }

                    this.slide(parsed - 1);
                } else {
                    this.slide(-1);
                }
            });

            for (var p in { 'slide': 1, 'controls': 1, 'autoPlay': 1 }) {
                this[p].subscribe((v) => this.updateUrl());
            }

            this.url.subscribe(v => this.socialSharing.url(v));
            this.title.subscribe(v => this.socialSharing.title(v));
            this.publishTargetWidth.subscribe(v => {
                var str = (v || '').toString(), n = parseInt(str, 10);

                if (isNaN(n) || n === null || n <= 0 || n > 9999 || !/^[0-9]+$/g.test(str)) {
                    this.publishTargetWidth(900);
                }
            });

            this.embedCode = ko.computed(() => {
                var ret = this.url();

                if (ret && ret.length) {
                    if (this.publishTarget() == PublishTarget.iframe) {
                        ret = '<iframe frameborder="0" width="' + this.publishTargetWidth() +
                        '" height="' + this.publishTargetHeight() + '" src="' + ret + '"></iframe>';
                    } else if (this.publishTarget() == PublishTarget.wordPress) {
                        ret = '[iframe width="' + this.publishTargetWidth() +
                        '" height="' + this.publishTargetHeight() + '" src="' + ret + '"]';
                    }
                } else {
                    ret = Ifly.App.getInstance().components['PublishSettingsModal'].terminology.cannotShare;
                }

                return ret;
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {boolean} isPreviousState Indicates whether this is the previous state of the model.
         */
        public load(data: any, isPreviousState?: boolean) {
            var s = -1, isEmpty = (s: string) => s == null || s.length == 0, pass = '';

            data = data || {};

            s = data.slide || data.Slide || -1;
            pass = this.password() || data.passwordHash || data.PasswordHash;
            
            this._isLoadingPreviousState = !!isPreviousState;

            (<any>this.password).isChanged(false);
            (<any>this.password).isInputVisible(false);
            (<any>this.password).isSet(!isEmpty(pass));

            this.publishType(PublishType.web);
            this.publishTarget(PublishTarget.url);
            this.publishTargetWidth(900);
            this.presentationId(data.presentationId || data.PresentationId || -1);
            this.url(this.enableSocialSharing() ? (data.url || data.Url || '') : '');
            this.title(data.title || data.Title || '');
            this.totalSlides(data.totalSlides || data.TotalSlides || 0);
            this.password(data.password || data.passwordHash || data.PasswordHash || '');

            s = this.valueOrDefault<number>(data, 'slide', 'Slide', -1);
            
            this.slide(s);
            (<any>this.slide).editable(s != null && s >= 0 ? (s + 1).toString() : '');

            this.controls(this.valueOrDefault<boolean>(data, 'controls', 'Controls', true));
            this.autoPlay(data.autoPlay || data.AutoPlay || false);

            this.imageExport.load(data, isPreviousState);
            this.videoExport.load(data, isPreviousState);
            
            this.presenterSettings.load(data.presenterSettings || data.PresenterSettings);

            this._isLoadingPreviousState = false;
        }

        /** Serializes object state. */
        public serialize() {
            return {
                publishType: this.publishType(),
                presentationId: this.presentationId(),
                slide: this.slide(),
                controls: this.controls(),
                autoPlay: this.autoPlay(),
                url: this.url(),
                title: this.title(),
                passwordChanged: (<any>this.password).isChanged(),
                password: this.password(),
                presenterSettings: this.presenterSettings.serialize()
            };
        }

        /** Removes the password. */
        public removePassword() {
            this.password(null);

            (<any>this.password).isSet(false);
            (<any>this.password).isChanged(true);
            (<any>this.password).isInputVisible(false);
        }

        /** 
         * Makes the given property checkable.
         * @param {string} propertyName Property name.
         * @param {boolean} isNumber Value indicating whether the underlying property is number.
         */
        private makeCheckable(propertyName: string, isNumber?: boolean) {
            this[propertyName].checkable = ko.computed({
                read: () => {
                    return (isNumber ? (this[propertyName]() || 0) : ((this[propertyName]() || 0) ? 1 : 0)).toString();
                },
                write: (v) => {
                    if (isNumber) {
                        this[propertyName](parseInt((v || '').toString(), 10));
                    } else {
                        this[propertyName](parseInt((v || '').toString(), 10) > 0);
                    }
                }
            });
        }

        /** 
         * Returns either the specified value or the default one.
         * @param {object} data Data object.
         * @param {string} p1 Property #1 probe.
         * @param {string} p2 Property #2 probe.
         * @param {T} defautValue Default value.
         */
        private valueOrDefault<T>(data: any, p1: string, p2: string, defaultValue: T): T {
            var ret = defaultValue;

            if (typeof (data[p1]) != 'undefined' || typeof (data[p2]) != 'undefined') {
                ret = typeof (data[p1]) != 'undefined' ? data[p1] : data[p2];
            }

            return ret;
        }

        /** 
         * Updates infographic URL.
         * @param {Function} complete A callback which is fired when update finishes.
         */
        private updateUrl() {
            var str = (v): string => { return v != null ? v.toString() : '' },
                key = str(this.slide()) + str(this.controls()) + str(this.autoPlay());

            if (!this._isLoadingPreviousState && !this._isGoingToUpdateUrl &&
                (!this._cacheKey || this._cacheKey != key)) {

                this._cacheKey = key;
                this._isGoingToUpdateUrl = true;

                PublishSettingsModal.getInstance().updateUrl(() => { this._isGoingToUpdateUrl = false; });
            }
        }
    }

    /** Represents a publish settings modal. */
    export class PublishSettingsModal extends ModalForm<PublishConfigurationSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: PublishSettingsModal;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#publish-settings', () => { return new PublishConfigurationSettings(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         */
        public open(data?: any) {
            var app = Ifly.App.getInstance(), c = app.components['PublishSettingsModal'],
                onPublishTypeChanged = (v: PublishType) => {
                    if (v == PublishType.web || v == PublishType.present) {
                        this.modal.updatePrimaryButton({ text: c.terminology.save, enabled: true });
                    } else {
                        this.modal.updatePrimaryButton({
                            text: v == PublishType.image ? c.terminology.downloadImage : (this.data.videoExport.youtubeUpload.enabled() || this.data.videoExport.facebookUpload.enabled() ? c.terminology.createAndSend : c.terminology.createVideo),
                            enabled: v == PublishType.image ? this.data.imageExport.totalSlides() > 0 : (v == PublishType.video ? this.data.videoExport.estimatedVideoLength() > 0 : true)
                        });
                    }

                    this.modal.updateSecondaryButton({ enabled: true });
                }, onExportFinished = () => {
                    if (!this.enabled()) {
                        this.enabled(true);
                        onPublishTypeChanged(this.data.publishType());
                    }
                };
            
            this.container.find('.presentation-share').hide().removeClass('active');
            this.container.find('.share-activator').show().unbind('mouseover click').bind('mouseover click', e => {
                $(e.target).hide().next('.presentation-share').show().addClass('active');
            });

            super.load(data);

            if (!this.modal) {
                this.data.publishType.subscribe(v => {
                    onPublishTypeChanged(v);
                });

                this.data.imageExport.addEventListener('exportFinished', () => { onExportFinished(); });
                this.data.videoExport.addEventListener('exportFinished', () => { onExportFinished(); });

                this.modal = app.openModal({
                    content: this.container,
                    buttons: [
                        {
                            text: c.terminology.save,
                            click: () => { this.save(); }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this.cancel(); }
                        }
                    ]
                });

                this.modal.addEventListener('closed', () => {
                    this.data.imageExport.cancelExport();
                    this.data.videoExport.cancelExport();
                });
            } else {
                this.modal.updateButtons();
                this.modal.open();
            }

            this.enabled(true);

            if (!this.data.url() && !this.data.url().length) {
                this.updateUrl();
            }

            setTimeout(() => {
                try {
                    $('#Publish_Slide').focus();
                } catch (ex) { }
            }, 100);

            Ifly.App.getInstance().trackEvent('discover', 'publishing');
        }

        /** Saves the data. */
        public save() {
            var v = this.data.publishType();

            if (v == null || v < 0 || v == PublishType.web) {
                Ifly.App.getInstance().trackEvent('act', 'publishing');
                this.savePublishSettings();
            } else if (v == PublishType.present) {
                Ifly.App.getInstance().trackEvent('act', 'publishing');
                this.savePresenterSettings();
            } else if (v == PublishType.image) {
                Ifly.App.getInstance().trackEvent('act', 'download image');
                this.downloadImage();
            } else if (v == PublishType.video) {
                Ifly.App.getInstance().trackEvent('act', 'make video');
                this.downloadVideo();
            }
        }

        /** Downloads presentation as image. */
        private downloadImage() {
            var c = Ifly.App.getInstance().components['PublishSettingsModal'];

            if (this.enabled()) {
                this.enabled(false);

                this.modal.updateButtons({
                    primary: {
                        text: c.terminology.oneMoment,
                        enabled: false
                    }, secondary: {
                        enabled: false
                    }
                });

                this.data.imageExport.beginExport();
            }
        }

        /** Downloads presentation as video. */
        private downloadVideo() {
            var c = Ifly.App.getInstance().components['PublishSettingsModal'];

            if (this.enabled()) {
                this.enabled(false);

                this.modal.updateButtons({
                    primary: {
                        text: c.terminology.oneMoment,
                        enabled: false
                    }, secondary: {
                        enabled: false
                    }
                });

                this.data.videoExport.beginExport();
            }
        }

        /** Saves publish settings. */
        private savePublishSettings() {
            var serialized = null, editor = Ifly.Editor.getInstance(), presentationId = -1,
                c = Ifly.App.getInstance().components['PublishSettingsModal'];

            if (this.enabled()) {
                this.enabled(false);

                this.modal.updateButtons({
                    primary: {
                        text: c.terminology.saving,
                        enabled: false
                    },
                    secondary: {
                        enabled: false
                    }
                });

                serialized = this.data.serialize();
                presentationId = editor.presentation.id();

                serialized.presentationId = presentationId;

                Ifly.App.getInstance().api.put('presentations/' + presentationId + '/publish', serialized, (success, data) => {
                    this.enabled(true);
                    this.modal.updateButtons();

                    this.close();
                    editor.publishing.onSettingsUpdated(serialized);
                });
            }
        }

        /** Saves presenter settings. */
        private savePresenterSettings() {
            var serialized = null, editor = Ifly.Editor.getInstance(), presentationId = -1,
                c = Ifly.App.getInstance().components['PublishSettingsModal'];

            if (this.enabled()) {
                this.enabled(false);

                this.modal.updateButtons({
                    primary: {
                        text: c.terminology.saving,
                        enabled: false
                    },
                    secondary: {
                        enabled: false
                    }
                });

                serialized = this.data.presenterSettings.serialize();
                presentationId = editor.presentation.id();

                serialized.presentationId = presentationId;

                Ifly.App.getInstance().api.put('presentations/' + presentationId + '/present', serialized, (success, data) => {
                    this.enabled(true);
                    this.modal.updateButtons();

                    this.close();
                    editor.publishing.onSettingsUpdated(serialized, 'presenterSettings');
                });
            }
        }

        /** 
         * Updates infographic URL.
         * @param {Function} complete A callback which is fired when update finishes.
         */
        public updateUrl(complete?: Function) {
            var url = !Ifly.App.getInstance().options.demo ? PublishSettingsModal.getPresentationUrl() : '';
            
            this.data.url(url);
            this.data.presenterSettings.url(url.length ? PublishSettingsModal.getPresenterModeUrl() : '');

            (complete || function () { })(url);
        }

        /** Returns the URL of the current presentation. */
        public static getPresentationUrl(): string {
            return location.protocol + '//' + location.host + '/view/embed/' +
                Ifly.Editor.getInstance().presentation.id();
        }

        /** Returns the URL of the current presentation. */
        public static getPresenterModeUrl(): string {
            var ret = this.getPresentationUrl();

            ret += ((ret.indexOf('?') > 0 ? '&' : '?') + 'presenter=1');

            return ret;
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): PublishSettingsModal {
            if (!this._instance) {
                this._instance = new PublishSettingsModal();
            }

            return this._instance;
        }
    }
}