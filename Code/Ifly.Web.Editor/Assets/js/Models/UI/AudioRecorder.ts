module Ifly.Models.UI {
    /** Represents recorder status. */
    export enum RecorderStatus {
        /** Unknown. */
        unknown = 0,

        /** Ready. */
        ready = 1,

        /** Error. */
        error = 2,

        /** Initializing. */
        initializing = 3
    }

    /** Represents native web audio interface. */
    export interface INativeWebAudioInterface {
        /** Gets or sets the audio analyzer. */
        analyzer: any;

        /** Gets or sets the audio context. */
        audioContext: any;

        /** Gets or sets the input point. */
        inputPoint: any;
    }

    /** Represents an audio recorder suite. */
    export interface IAudioRecorderSuite {
        /** Gets or sets the recorder. */
        recorder: AudioRecorder;

        /** Gets or sets the sound wave. */
        soundWave: AudioRecorderSoundWave;

        /** Gets or sets the equalizer. */
        equalizer: AudioRecorderEqualizer;
    }

    /** Represents audio recorder sound wave. */
    export class AudioRecorderSoundWave {
        /** Gets or sets the target <canvas> element (or a jQuery wrapper of it). */
        private _canvas: any;

        /** Gets or sets the 2D context of a canvas. */
        private _context: any;

        /** Gets or sets canvas width. */
        private _width: number;

        /** Gets or sets canvas height. */
        private _height: number;

        /**
         * Initializes a new instance of an object.
         * @param canvas {object|jQuery} HTML <canvas> element (or a jQuery wrapper of it).
         */
        constructor(canvas: any) {
            this._canvas = canvas;
        }

        /**
         * Refreshes the sound wave.
         * @param data {any[]} Sound wave data.
         */
        public refresh(data: any[]) {
            var datum = 0,
                step = 0,
                amp = 0,
                min = 0,
                max = 0;

            this.ensureContext();

            step = Math.ceil(data.length / this._width);
            amp = this._height / 2;

            this._context.fillStyle = 'silver';
            this._context.clearRect(0, 0, this._width, this._height);

            for (var i = 0; i < this._width; i++) {
                min = 1.0;
                max = -1.0;

                for (var j = 0; j < step; j++) {
                    datum = data[(i * step) + j];

                    if (datum < min) {
                        min = datum;
                    }

                    if (datum > max) {
                        max = datum;
                    }
                }

                this._context.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
            }
        }

        /**
         * Ensures that the canvas to draw on is available.
         */
        private ensureContext() {
            var canvas = this._canvas;

            if (!this._context) {
                if (typeof (canvas.getContext) !== 'function' && canvas.length) {
                    canvas = canvas[0];
                }

                this._context = canvas.getContext('2d');
                this._width = canvas.width;
                this._height = canvas.height;
            }
        }
    }

    /** Represents audio recorder equalizer. */
    export class AudioRecorderEqualizer {
        /** Gets or sets the target <canvas> element (or a jQuery wrapper of it). */
        private _canvas: any;

        /** Gets or sets the 2D context of a canvas. */
        private _context: any;

        /** Gets or sets canvas width. */
        private _width: number;

        /** Gets or sets canvas height. */
        private _height: number;

        /** Gets or sets the audio analyzer. */
        private _analyzer: any;

        /** Gets or sets the update timer. */
        private _timer: any;

        /** Gets or sets value indicating whether to refresh equalizer. */
        private _doRefresh: boolean;

        /**
         * Initializes a new instance of an object.
         * @param canvas {object|jQuery} HTML <canvas> element (or a jQuery wrapper of it).
         * @param recorder {AudioRecorder} Audio recorder.
         */
        constructor(canvas: any, recorder: AudioRecorder) {
            this._canvas = canvas;

            /* Waiting for analyzer to be available. */
            recorder.addEventListener('ready', () => {
                this._analyzer = recorder.webAudio.analyzer;
            });
        }

        /** Stops refreshing the equalizer. */
        public stop() {
            window.cancelAnimationFrame(this._timer);

            $(this._canvas).addClass('inactive');

            this._doRefresh = false;
            this._timer = null;
        }

        /**
         * Refreshes the equalizer.
         */
        public refresh(force?: boolean) {
            var x = 0, v = 0, y = 0,
                bufferLength = 0,
                timeData = null,
                sliceWidth = 0;

            if (typeof (force) !== 'boolean') {
                force = true;
            }

            if (this._analyzer && (force || this._doRefresh)) {
                if (force) {
                    this._doRefresh = true;
                }

                this.ensureContext();
                
                $(this._canvas).removeClass('inactive');

                this._context.clearRect(0, 0, this._width, this._height);
                this._context.strokeStyle = '#636363';
                this._context.fillStyle = '#F6D565';
                this._context.lineCap = 'round';
                this._context.lineWidth = 1;

                this._context.beginPath();

                bufferLength = this._analyzer.fftSize;
                timeData = new Uint8Array(bufferLength);

                this._analyzer.getByteTimeDomainData(timeData);

                sliceWidth = this._width * 1.0 / bufferLength;

                for (var i = 0; i < bufferLength; i++) {
                    v = timeData[i] / 128.0;
                    y = v * this._height / 2;

                    if (i == 0) {
                        this._context.moveTo(x, y);
                    } else {
                        this._context.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                this._context.lineTo(this._width, this._height / 2);
                this._context.stroke();
            }

            this._timer = window.requestAnimationFrame(() => { this.refresh(false); });
        }

        /**
         * Ensures that the canvas to draw on is available.
         */
        private ensureContext() {
            var canvas = this._canvas;

            if (!this._context) {
                if (typeof (canvas.getContext) !== 'function' && canvas.length) {
                    canvas = canvas[0];
                }

                this._context = canvas.getContext('2d');
                this._width = canvas.width;
                this._height = canvas.height;
            }
        }
    }

    /** Represents audio recorder input. */
    export class AudioRecorderInput {
        /** Gets or sets the input point. */
        private _inputPoint: any;

        /** Gets or sets the worker node. */
        private _node: any;

        /** Gets or sets the worker. */
        private _worker: any;

        /** Gets or sets the audio context. */
        private _context: any;

        /** Gets or sets value indicating whether audio input is being captured. */
        private _isRecording: boolean;

        /** Gets or sets the current callback for "getBuffers/getAudio". */
        private _currentCallback: Function;

        /**
         * Initializes a new instance of an object.
         * @param recorder {AudioRecorder} Audio recorder.
         */
        constructor(recorder: AudioRecorder) {
            var bufferLength = 4096;

            /* Waiting for input point to be available. */
            recorder.addEventListener('ready', () => {
                this._inputPoint = recorder.webAudio.inputPoint;
                this._context = this._inputPoint.context;

                if (!this._context.createScriptProcessor) {
                    this._node = this._context.createJavaScriptNode(bufferLength, 2, 2);
                } else {
                    this._node = this._context.createScriptProcessor(bufferLength, 2, 2);
                }

                this._worker = new Worker('/Edit/Assets/js/Models/UI/AudioRecorderWorker.js');

                this._worker.postMessage({
                    command: 'init',
                    config: {
                        sampleRate: this._context.sampleRate
                    }
                });

                this._node.onaudioprocess = e => {
                    if (this._isRecording) {
                        this._worker.postMessage({
                            command: 'record',
                            buffer: [
                                e.inputBuffer.getChannelData(0),
                                e.inputBuffer.getChannelData(1)
                            ]
                        });
                    }
                }

                this._worker.onmessage = e => {
                    var blob = e.data;

                    this._currentCallback(blob);
                }

                this._inputPoint.connect(this._node);
                this._node.connect(this._context.destination); 
            });
        }

        /** Starts capturing the input. */
        public startCapturing() {
            this._isRecording = true;
        }

        /** Stops capturing the input. */
        public stopCapturing() {
            this._isRecording = false;
        }

        /** Clear the previously captured input. */
        public clear() {
            this._worker.postMessage({ command: 'clear' });
        }

        /**
         * Requests the buffers from the underlying audio input.
         * @param onBuffers {Function} A callback which is called when buffers become available.
         */
        public getBuffers(onBuffers: (buffers: any[]) => any) {
            this._currentCallback = buffers => onBuffers(buffers);

            this._worker.postMessage({ command: 'getBuffers' });
        }

        /**
         * Requests the audio from the underlying audio input.
         * @param onBuffers {Function} A callback which is called when audio becomes available.
         */
        public getAudio(onAudio: (audio: Blob) => any) {
            this._currentCallback = audio => onAudio(audio);

            this._worker.postMessage({
                command: 'exportMP3'
            });
        }
    }

    /** Represents an audio recorder. */
    export class AudioRecorder extends Ifly.EventSource {
        /** Gets or sets the native web audio interface. */
        public webAudio: INativeWebAudioInterface;

        /** Gets or sets the recorder status. */
        public status: RecorderStatus;

        /** Gets or sets the audio recorder input. */
        private _input: AudioRecorderInput;

        /** Gets or sets value indicating whether recorder has been initialized. */
        private _isReady: boolean;

        /** Gets or sets value indicating whether recorder is being initialized. */
        private _isInitializing: boolean;

        /** Gets or sets value indicating */
        private _isRecording: boolean;

        /** Gets or sets the previous error during initialization. */
        private _isReadyError: Error;

        /** Gets or sets the audio stream. */
        private _stream: any;

        /** Initializes a new instance of an object. */
        constructor() {
            var wnd = <any>window;

            super();

            this.webAudio = {
                analyzer: null,
                audioContext: null,
                inputPoint: null
            };

            this.status = RecorderStatus.unknown;

            wnd.AudioContext = wnd.AudioContext || wnd.webkitAudioContext;

            if (!window['AudioRecorderContext']) {
                window['AudioRecorderContext'] = new wnd.AudioContext();
            }

            this.webAudio.audioContext = window['AudioRecorderContext'];
        }

        /**
        * Requests the buffers from the underlying audio input.
        * @param onBuffers {Function} A callback which is called when buffers become available.
        */
        public getBuffers(onBuffers: (buffers: any[]) => any) {
            this._input.getBuffers(onBuffers);
        }

        /**
         * Requests the audio from the underlying audio input.
         * @param onBuffers {Function} A callback which is called when audio becomes available.
         */
        public getAudio(onAudio: (audio: Blob) => any) {
            this._input.getAudio(onAudio);
        }

        /** Starts recording. */
        public startRecording() {
            if (!this._isRecording && this._input) {
                this._isRecording = true;

                this._input.clear();
                this._input.startCapturing();

                this.dispatchEvent('start', {});
            }
        }

        /** Stops recording. */
        public stopRecording() {
            if (this._isRecording) {
                this._input.stopCapturing();
                this._isRecording = false;

                this.dispatchEvent('stop', {});

                this.getBuffers(buffers => {
                    this.dispatchEvent('buffers', { buffers: buffers });

                    this.getAudio(audio => {
                        this.dispatchEvent('audio', { audio: audio });
                    });
                });
            }
        }

        /** Initializes the audio recorder. */
        public initialize() {
            var nav = <any>navigator,

                /**
                 * Occurs when audio stream has been initialized.
                 * @param stream {object} Audio stream.
                 */
                onStream = (stream) => {
                    var audioInput = null,
                        zeroGain = null;

                    // Stream gets garbage-collected and recording stops. Keeping a reference in a private field.
                    // Credits: http://stackoverflow.com/questions/27547032/recording-in-html5-does-not-work-in-firefox
                    this._stream = stream;

                    this.webAudio.inputPoint = this.webAudio.audioContext.createGain();

                    audioInput = this.webAudio.audioContext.createMediaStreamSource(this._stream);
                    audioInput.connect(this.webAudio.inputPoint);

                    this.webAudio.analyzer = this.webAudio.audioContext.createAnalyser();
                    this.webAudio.analyzer.fftSize = 2048;
                    this.webAudio.inputPoint.connect(this.webAudio.analyzer);

                    zeroGain = this.webAudio.audioContext.createGain();
                    zeroGain.gain.value = 0.0;
                    this.webAudio.inputPoint.connect(zeroGain);
                    zeroGain.connect(this.webAudio.audioContext.destination);

                    this._input = new AudioRecorderInput(this);

                    this.status = RecorderStatus.ready;
                    this._isInitializing = false;
                    this._isReady = true;

                    this.dispatchEvent('ready', {});
                };

            if (!this._isReady) {
                if (!this._isReadyError) {
                    this._isInitializing = true;
                    this.status = RecorderStatus.initializing;

                    this.dispatchEvent('initialize', {});

                    if (!nav.getUserMedia) {
                        nav.getUserMedia = nav.webkitGetUserMedia || nav.mozGetUserMedia;
                    }

                    if (!nav.cancelAnimationFrame) {
                        nav.cancelAnimationFrame = nav.webkitCancelAnimationFrame || nav.mozCancelAnimationFrame;
                    }

                    if (!nav.requestAnimationFrame) {
                        nav.requestAnimationFrame = nav.webkitRequestAnimationFrame || nav.mozRequestAnimationFrame;
                    }

                    nav.getUserMedia(
                        {
                            audio: {
                                mandatory: {
                                    googEchoCancellation: false,
                                    googAutoGainControl: false,
                                    googNoiseSuppression: false,
                                    googHighpassFilter: false
                                },
                                optional: []
                            },
                        }, onStream, err => {
                            this._isReadyError = err;
                            this._isInitializing = false;
                            this.status = RecorderStatus.error;

                            this.dispatchEvent('error', { error: err });
                        });
                } else {
                    this.dispatchEvent('error', { error: this._isReadyError });
                }
            }
        }

        /** 
         * Subscribes to a given event.
         *
         * @param {string} eventName Event name.
         * @param {Function} callback Callback to execute.
         * @param {boolean} priority Value indicating whether the callback should be prioritized.
         */
        public addEventListener(eventName: string, callback: Function, priority?: boolean) {
            if (eventName == 'ready' && this._isReady) {
                callback(this, {});
            } else if (eventName == 'initialize' && this._isInitializing) {
                callback(this, {});
            } else {
                super.addEventListener(eventName, callback, priority);
            }
        }

        /**
         * Creates and returns new audio recorder suite.
         * @param equalizerCanvas {object|jQuery} HTML <canvas> element (or a jQuery wrapper of it) for equalizer renderings.
         * @param waveCanvas {object|jQuery} HTML <canvas> element (or a jQuery wrapper of it) for sound wave renderings.
         */
        static createSuite(equalizerCanvas?: any, waveCanvas?: any): IAudioRecorderSuite {
            var ret = {
                recorder: new AudioRecorder(),
                soundWave: null,
                equalizer: null
            };

            ret.recorder.addEventListener('ready', () => {
                if (equalizerCanvas) {
                    ret.equalizer = new AudioRecorderEqualizer(equalizerCanvas, ret.recorder);
                }

                if (waveCanvas) {
                    ret.soundWave = new AudioRecorderSoundWave(waveCanvas);
                }
            }, true);

            ret.recorder.initialize();

            return ret;
        }
    }
}