/// <reference path="../../Typings/jquery.d.ts" />

module Ifly.Models.Embed {
    /** Represets animation computed stack orientation. */
    export enum AnimationComputedStackOrientation {
        /** Top left. */
        topLeft = 0,
        
        /** Center. */
        center = 1,

        /** Bottom right. */
        bottomRight = 2
    }

    /** Represets animation computed stack flow. */
    export enum AnimationComputedStackFlow {
        /** Vertical. */
        vertical = 0,

        /** Horizontal. */
        horizontal = 1
    }

    /** Represets animation computed stack. */
    export interface IAnimationComputedStack {
        /** Gets or sets the stack name which is unique to all stack elements. */
        name: string;

        /** Gets or sets stack orientation. */
        orientation: AnimationComputedStackOrientation;

        /** Gets or sets stack flow. */
        flow: AnimationComputedStackFlow;
    }

    /** Represents the proposed position of the animation object relative to the viewport center. */
    export enum AnimationObjectViewportPosition {
        /** Center. */
        center = 0,

        /** Top left. */
        topLeft = 1,

        /** Top right. */
        topRight = 2,

        /** Bottom right. */
        bottomRight = 3,

        /** Bottom left. */
        bottomLeft = 4
    }

    /** Represents animation viewport. */
    export interface IAnimationViewport {
        /** Gets or sets the viewport width. */
        width: number;

        /** Gets or sets the viewport height. */
        height: number;

        /** Gets or sets the viewport outer width (window width). */
        outerWidth: number;

        /** Gets or sets the viewport outer height (window height). */
        outerHeight: number;

        /** Gets or sets the reference to DOM node representing the actual viewport. */
        node: JQuery;
    }

    /** Represents animation object offset. */
    export interface IAnimationObjectOffset {
        /** Gets or sets the offset left. */
        left: number;

        /** Gets or sets the offset top. */
        top: number;
    }

    /** Represents animation object. */
    export interface IAnimationObject {
        /** Gets or sets the object width. */
        width: number;

        /** Gets or sets the object height. */
        height: number;

        /** Gets or sets the proposed position of the object relative to the viewport center. */
        position: AnimationObjectViewportPosition;

        /** Gets or sets the reference to DOM node representing this object. */
        node: JQuery;

        /** Gets or sets the object offset relative to the viewport. */
        offset: IAnimationObjectOffset;

        /** Gets or sets the list of computed stack names this object is part of. */
        stacks: string[];

        /** Gets or sets the slide element that corresponds to the given block. */
        element?: any;
    }

    /** Represents animation data. */
    export interface IAnimationData {
        /** Gets or sets the animation viewport. */
        viewport: IAnimationViewport;

        /** Gets or sets the list of all animation objects. */
        objects: IAnimationObject[];

        /** Gets or sets the list of all computed stacks. */
        stacks: IAnimationComputedStack[];

        /** Gets or sets the slide index. */
        slideIndex: number;
    }

    /** Gets or sets animation parameters. */
    export interface IAnimationParameter {
        /** Gets or sets the slide index. */
        slideIndex: number;
    }

    /** Represents device orientation manager. */
    export class DeviceOrientationManager {
        /** 
         * Requests orientation change.
         * @param {Function} orientationChanged A callback which is fired when orientation is changed.
         */
        public static requestOrientationChange(orientationChanged: Function) {
            var timer = null, c = $('.orientation-change');
            
            if (DeviceOrientationManager.isLandscape() || Ifly.App.getInstance().isExternallyEmbedded()) {
                orientationChanged();
            } else {
                c.show();

                setTimeout(() => {
                    c.addClass('active');

                    timer = setInterval(() => {
                        if (DeviceOrientationManager.isLandscape()) {
                            clearInterval(timer);

                            c.hide().removeClass('active');

                            orientationChanged();
                        }
                    }, 50);    
                }, 25);
            }
        }

        /** Returns value indicating whether device has a landscape orientation. */
        public static isLandscape(): boolean {
            var w = $(window);

            return w.width() > w.height();
        }
    }

    /** Represents animation worker. */
    export interface IAnimationWorker {
        /** Stops the worker. */
        stop: () => any;

        /** Restarts the worker. */
        restart: () => any;

        /** Gets or sets value indicating whether worker is running. */
        isRunning: boolean;
    }

    /** Represents animation result. */
    export class AnimationResult {
        /** Gets or sets the appear duration (in milliseconds). */
        public appearDuration: number;

        /** Gets or sets the hide duration (in milliseconds). */
        public hideDuration: number;

        /** Gets or sets animation worker. */
        public worker: IAnimationWorker;

        /**
         * Initializes a new instance of an object.
         * @param {number} appearDuration Appear duration.
         * @param {number} hideDuration Hide duration.
         * @param {IAnimationWorker} worker Worker.
         */
        constructor(appearDuration?: number, hideDuration?: number, worker?: IAnimationWorker) {
            this.appearDuration = appearDuration || 0;
            this.hideDuration = hideDuration || 0;
        }
    }

    /** Represents animation handler. */
    export interface IAnimationHandler {
        /** 
         * Applies animation.
         * @param {IAnimationData} data Animation data.
         */
        applyAnimation(data: IAnimationData): AnimationResult;
    }

    /** Represents simple animation handler. */
    export class SimpleAnimationHandler implements IAnimationHandler {
        /** 
         * Applies animation.
         * @param {IAnimationData} data Animation data.
         */
        public applyAnimation(data: IAnimationData): AnimationResult {
            var t = 0, otherCumulativeDelay = 0, d = null, chartType = null, delayAdded = false,
                addDelay = d => { if (d > otherCumulativeDelay) otherCumulativeDelay = d; }, worker = null;

            for (var i = 0; i < data.objects.length; i++) {
                t = data.objects[i].element.type;

                if (t == Ifly.Models.ElementType.callout) {
                    addDelay(450);
                } else if (t == Ifly.Models.ElementType.progress) {
                    addDelay(800);
                } else if (t == Ifly.Models.ElementType.table || t == Ifly.Models.ElementType.chart) {
                    d = new Ifly.Utils.JsonPlainObjectConverter()
                        .convertFromString(this.getPropertyValue(data.objects[i].element, 'data'));

                    if (t == Ifly.Models.ElementType.chart) {
                        chartType = parseInt(this.getPropertyValue(data.objects[i].element, 'type', '0'), 10) || 0;

                        if (chartType == 1 || chartType == 7) {
                            if (d.rows && d.rows.length > 0 && d.columns && d.columns.length > 0) {
                                addDelay(410 + (d.rows.length * d.columns.length * 50));
                            }
                            
                            delayAdded = true;
                        } 
                    }

                    if (!delayAdded) {
                        if (d && d.rows && d.rows.length > 0) {
                            if (d.rows.length >= 15) {
                                addDelay(1000);
                            } else {
                                addDelay(300 + ((d.rows.length - 1) * 50));
                            }
                        }
                    }
                } else if (t == Ifly.Models.ElementType.timeline) {
                    d = new Ifly.Utils.JsonPlainObjectConverter()
                        .convertFromString(this.getPropertyValue(data.objects[i].element, 'items'));

                    if (d && d.items.length > 0) {
                        if (d.items.length >= 15) {
                            addDelay(1000);
                        } else {
                            addDelay(300 + ((d.items.length - 1) * 50));
                        }
                    }
                } 

                if (t != Ifly.Models.ElementType.callout && t != Ifly.Models.ElementType.line) {
                    if (data.objects[i].element.position == 5) {
                        data.objects[i].node.addClass('element-animate-' + data.objects[i].stacks[0]);
                    }

                    if ((data.slideIndex + 1) % 2 != 0) {
                        data.objects[i].node.addClass('element-animate-allowbounce');
                    }
                }

                data.objects[i].node.addClass('element-animate-after-' + i);
            }

            worker = (() => {
                var timer = null, current = 0;

                return {
                    isRunning: false,
                    stop: function () {
                        this.isRunning = false;

                        current = 0;
                        clearInterval(timer);
                    },
                    restart: function () {
                        var self = this, iteration = function () {
                            if (current >= data.objects.length) {
                                self.stop();
                            } else {
                                data.objects[current].node.addClass('element-animate-appear');
                                current++;
                            }
                        };

                        this.stop();
                        this.isRunning = true;

                        timer = setInterval(function () {
                            iteration();
                        }, 200);

                        iteration();
                    }
                };
            })();

            worker.restart();

            return new AnimationResult(600 + (200 * (data.objects.length - 1)) + otherCumulativeDelay, 300 + (100 * (data.objects.length - 1)), worker);
        }

        /**
         * Returns the value of a given property.
         * @param {object} element Element.
         * @param {string} propertyName Property name.
         * @param {string} defaultValue Default value.
         */
        public getPropertyValue(element: any, propertyName: string, defaultValue?: string): string {
            var ret = defaultValue || '';

            if (element.properties) {
                for (var i = 0; i < element.properties.length; i++) {
                    if (element.properties[i].name == propertyName) {
                        ret = element.properties[i].value;
                        break;
                    }
                }
            }

            return ret;
        }
    }

    /** Represents minimal animation handler. */
    export class MinimalAnimationHandler implements IAnimationHandler {
        /** 
         * Applies animation.
         * @param {IAnimationData} data Animation data.
         */
        public applyAnimation(data: IAnimationData): AnimationResult {
            var worker = null;

            worker = (() => {
                return {
                    isRunning: false,
                    stop: function () {
                        this.isRunning = false;
                    },
                    restart: function () {
                        this.stop();
                        this.isRunning = true;

                        for (var i = 0; i < data.objects.length; i++) {
                            data.objects[i].node.addClass('element-animate-minimal element-animate-appear');
                        }

                        this.stop();
                    }
                };
            })();

            worker.restart();

            return new AnimationResult(550, 25, worker);
        }
    }

    /** Represents slide animation manager. */
    export class SlideAnimationManager {
        /** Gets or sets the associated infographic. */
        public infographic: Infographic;

        /** Gets or sets the animation handler. */
        public handler: IAnimationHandler;

        /**
         * Initializes a new instance of an object.
         * @param {Infographic} infographic Associated infographic.
         */
        constructor(infographic: Infographic) {
            this.infographic = infographic;
            this.handler = new SimpleAnimationHandler();
        }

        /** 
         * Applies animation to the current slide.
         * @param {IAnimationParameter} parameters Animation parameters.
         */
        public applyAnimation(parameters: IAnimationParameter): AnimationResult {
            var data = null, mapResult = (r, c) => c(r), viewport = null, objects = [], vo = null,
                dist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                maxDistanceFromCenter = 0, computedStacks = null, addStack = (e, s) => { if (!$.grep(e, c => c == s).length) e[e.length] = s; },
                getElementsInStack = s => $.grep(objects, o => $.grep(o.stacks, st => st == s).length > 0).length,
                isOppositePosition = (pos: AnimationObjectViewportPosition, stacks: any[]): boolean => {
                    var cont = (s, v) => {
                        return (s.stack || '').toLowerCase().indexOf((v || '').toLowerCase()) >= 0
                    };

                    return ((pos == AnimationObjectViewportPosition.topLeft || pos == AnimationObjectViewportPosition.bottomLeft) && cont(stacks[0], '-bottomright-') && cont(stacks[1], '-topleft-')) ||
                        ((pos == AnimationObjectViewportPosition.topRight || pos == AnimationObjectViewportPosition.bottomRight) && cont(stacks[0], '-topleft-') && cont(stacks[1], '-bottomright-'));
                }, arrayMove = (source, oldIndex, newIndex) => {
                    if (newIndex >= source.length) {
                        var k = newIndex - source.length;
                        while ((k--) + 1) {
                            source.push(undefined);
                        }
                    }

                    source.splice(newIndex, 0, source.splice(oldIndex, 1)[0]);
                };

            mapResult(this.infographic.getViewportParameters(), p => {
                viewport = {
                    width: p.width,
                    height: p.height,
                    outerWidth: p.parentWidth,
                    outerHeight: p.parentHeight,
                    node: $(this.infographic.slide)
                };
            });

            vo = viewport.node.offset();
            maxDistanceFromCenter = viewport.width / 8;

            computedStacks = [
                { name: 'cstack-topleft-vertical', orientation: AnimationComputedStackOrientation.topLeft, flow: AnimationComputedStackFlow.vertical },
                { name: 'cstack-topleft-horizontal', orientation: AnimationComputedStackOrientation.topLeft, flow: AnimationComputedStackFlow.horizontal },
                { name: 'cstack-center-vertical', orientation: AnimationComputedStackOrientation.center, flow: AnimationComputedStackFlow.vertical },
                { name: 'cstack-center-horizontal', position: AnimationComputedStackOrientation.center, flow: AnimationComputedStackFlow.horizontal },
                { name: 'cstack-bottomright-vertical', position: AnimationComputedStackOrientation.bottomRight, flow: AnimationComputedStackFlow.vertical },
                { name: 'cstack-bottomright-horizontal', position: AnimationComputedStackOrientation.bottomRight, flow: AnimationComputedStackFlow.horizontal }
            ];

            mapResult(this.infographic.getAllRememberedElements(), e => {
                var n = null, w = 0, h = 0, p = 0, midWidth = 0, midHeight = 0, offset = null, o = null, closeToMidCenter = [], finalCloseToMidCenter = [],
                    midViewportWidth = viewport.width / 2, midViewportHeight = viewport.height / 2, sortedStacks = [], centerLineProximity = 35, focusedMid = null,
                    focusedMidProximity = 75, stackVerticalOffset = 0, stackHorizontalOffset = 0, eMidWidth = 0, eMidHeight = 0, tmp = null, centerLineMax = 0, centerLineMid = 0,
                    centerLineMin = 999999, thirdViewportHeight = viewport.height / 4, thirdViewportWidth = viewport.width / 4, centerCandidates = [];

                if (e && e.length) {
                    for (var i = 0; i < e.length; i++) {
                        n = $(e[i].node);

                        w = n.outerWidth();
                        h = n.outerHeight();

                        offset = n.offset();
                        offset.top = offset.top - vo.top;
                        offset.left = offset.left - vo.left;

                        midWidth = w / 2;
                        midHeight = h / 2;

                        if (dist(midViewportWidth, midViewportHeight, offset.left + (w / 2), offset.top + (h / 2)) < maxDistanceFromCenter) {
                            p = AnimationObjectViewportPosition.center;
                        } else {
                            if ((h - (midViewportHeight - offset.top)) < midHeight) {
                                if ((w - (midViewportWidth - offset.left)) < midWidth) {
                                    p = AnimationObjectViewportPosition.topLeft;
                                } else {
                                    p = AnimationObjectViewportPosition.topRight;
                                }
                            } else {
                                if ((w - (midViewportWidth - offset.left)) < midWidth) {
                                    p = AnimationObjectViewportPosition.bottomLeft;
                                } else {
                                    p = AnimationObjectViewportPosition.bottomRight;
                                }
                            }
                        }

                        o = {
                            node: n,
                            width: w,
                            height: h,
                            element: e[i].options[0],
                            position: p,
                            offset: offset,
                            stacks: []
                        };

                        eMidWidth = offset.left + (w / 2);
                        eMidHeight = offset.top + (h / 2);

                        // For every of the nine segments there're two possible stacks.
                        if (eMidWidth <= thirdViewportWidth) {
                            if (eMidHeight <= thirdViewportHeight) {
                                addStack(o.stacks, 'cstack-topleft-vertical');
                                addStack(o.stacks, 'cstack-topleft-horizontal');
                            } else if (eMidHeight > thirdViewportHeight && eMidHeight <= (thirdViewportHeight * 3)) {
                                addStack(o.stacks, 'cstack-topleft-vertical');
                                addStack(o.stacks, 'cstack-center-horizontal');
                            } else if (eMidHeight > (thirdViewportHeight * 3)) {
                                addStack(o.stacks, 'cstack-topleft-vertical');
                                addStack(o.stacks, 'cstack-bottomright-horizontal');
                            }
                        } else if (eMidWidth > thirdViewportWidth && eMidWidth <= (thirdViewportWidth * 3)) {
                            if (eMidHeight <= thirdViewportHeight) {
                                addStack(o.stacks, 'cstack-topleft-vertical');
                                addStack(o.stacks, 'cstack-center-vertical');
                            } else if (eMidHeight > thirdViewportHeight && eMidHeight <= (thirdViewportHeight * 3)) {
                                addStack(o.stacks, 'cstack-center-horizontal');
                                addStack(o.stacks, 'cstack-center-vertical');
                            } else if (eMidHeight > (thirdViewportHeight * 3)) {
                                addStack(o.stacks, 'cstack-bottomright-horizontal');
                                addStack(o.stacks, 'cstack-center-vertical');
                            }
                        } else if (eMidWidth > (thirdViewportWidth * 3)) {
                            if (eMidHeight <= thirdViewportHeight) {
                                addStack(o.stacks, 'cstack-topleft-vertical');
                                addStack(o.stacks, 'cstack-bottomright-vertical');
                            } else if (eMidHeight > thirdViewportHeight && eMidHeight <= (thirdViewportHeight * 3)) {
                                addStack(o.stacks, 'cstack-bottomright-vertical');
                                addStack(o.stacks, 'cstack-center-horizontal');
                            } else if (eMidHeight > (thirdViewportHeight * 3)) {
                                addStack(o.stacks, 'cstack-bottomright-vertical');
                                addStack(o.stacks, 'cstack-bottomright-horizontal');
                            }
                        }

                        objects[objects.length] = o;
                    }

                    objects.sort((x, y) => dist(0, 0, x.offset.left, x.offset.top) -
                        dist(0, 0, y.offset.left, y.offset.top));

                    for (var i = 0; i < objects.length; i++) {
                        if (parseInt(objects[i].element.type, 10) == 1 && i > 0) {
                            arrayMove(objects, i, 0);
                            break;
                        }
                    }

                    for (var i = 0; i < objects.length; i++) {
                        if (parseInt(objects[i].element.type, 10) == 2 && i != 1) {
                            arrayMove(objects, i, 1);
                            break;
                        }
                    }

                    for (var i = 0; i < objects.length; i++) {
                        sortedStacks = $.map(objects[i].stacks, s => {
                            return {
                                stack: s,
                                elementCount: getElementsInStack(s)
                            };
                        }).sort((x, y) => y.elementCount - x.elementCount);

                        // Any stack has a priority over "center" stack.
                        if (sortedStacks.length > 1 && sortedStacks[1].elementCount > 0 &&
                            sortedStacks[1].stack.indexOf('-vertical') > 0 && (sortedStacks[0].stack.indexOf('-center-') > 0 ||
                            isOppositePosition(objects[i].position, sortedStacks))) {

                            tmp = sortedStacks[1];
                            sortedStacks[1] = sortedStacks[0];
                            sortedStacks[0] = tmp;
                        }

                        // Primary stack is the one with most elements.
                        objects[i].stacks = $.map(sortedStacks, s => s.stack);
                    }
                    
                    for (var i = 0; i < objects.length; i++) {
                        if ($.grep(objects[i].stacks, s => s == 'cstack-center-horizontal').length) {
                            if (objects[i].offset.top > centerLineMax) {
                                centerLineMax = objects[i].offset.top;
                            }

                            if (objects[i].offset.top < centerLineMin) {
                                centerLineMin = objects[i].offset.top;
                            }

                            centerCandidates[centerCandidates.length] = {
                                index: i,
                                top: objects[i].offset.top
                            };
                        }
                    }

                    if (centerCandidates.length) {
                        centerLineMid = centerLineMin + ((centerLineMax - centerLineMin) / 2);
                        for (var i = 0; i < centerCandidates.length; i++) {
                            if (Math.abs(centerCandidates[i].top - centerLineMid) <= centerLineProximity) {
                                closeToMidCenter[closeToMidCenter.length] = centerCandidates[i].index;
                            }
                        }
                        
                        if (closeToMidCenter.length > 2) {
                            for (var i = 0; i < closeToMidCenter.length; i++) {
                                if (objects[closeToMidCenter[i]].stacks.length > 1 && objects[closeToMidCenter[i]].stacks[0].indexOf('-center-') < 0) {
                                    finalCloseToMidCenter[finalCloseToMidCenter.length] = closeToMidCenter[i];
                                }
                            }

                            if (finalCloseToMidCenter.length > 2) {
                                for (var i = 0; i < finalCloseToMidCenter.length; i++) {
                                    tmp = objects[finalCloseToMidCenter[i]].stacks[0];
                                    objects[finalCloseToMidCenter[i]].stacks[0] = objects[finalCloseToMidCenter[i]].stacks[1].indexOf('-center-') >= 0 ? objects[finalCloseToMidCenter[i]].stacks[1] : 'cstack-center-horizontal';
                                    objects[finalCloseToMidCenter[i]].stacks[1] = tmp;
                                }
                            }
                        } else if (closeToMidCenter.length == 1 && objects[closeToMidCenter[0]].stacks.length > 1 &&
                            objects[closeToMidCenter[0]].stacks[0].indexOf('-center-') > 0) {

                            focusedMid = objects[closeToMidCenter[0]];
                            eMidWidth = focusedMid.offset.left + (focusedMid.width / 2);

                            if (Math.abs(midViewportWidth - eMidWidth) > focusedMidProximity) {
                                tmp = objects[closeToMidCenter[0]].stacks[0];
                                objects[closeToMidCenter[0]].stacks[0] = objects[closeToMidCenter[0]].stacks[1];
                                objects[closeToMidCenter[0]].stacks[1] = tmp;

                                if (objects[closeToMidCenter[0]].stacks[0].indexOf('-center-') > 0) {
                                    objects[closeToMidCenter[0]].stacks[0] = eMidWidth < midViewportWidth ?
                                        'cstack-topleft-vertical' : 'cstack-bottomright-vertical';
                                }
                            }
                        }
                    }
                }
            });

            data = {
                viewport: viewport,
                objects: objects,
                slideIndex: parameters.slideIndex,
                stacks: computedStacks
            };

            return this.handler.applyAnimation(data);
        }
    }

    /** Represents unsafe content warning user response. */
    export enum UnsafeContentWarningUserResponse {
        /** Abort presentation entirely. */
        abort = 0,

        /** Block unsafe content only, allow everything else. */
        blockUnsafeContentOnly = 1,

        /** Proceed and allow unsafe content. */
        proceed = 2
    }

    /** Represents password protection user response. */
    export enum PasswordProtectionUserResponse {
        /** No response. */
        none = 0,

        /** Password is valid. */
        passed = 1,

        /** Incorrect password. */
        incorrectPassword = 2
    }

    /** Represents voice-over adapter. */
    export class VoiceOverAdapter {
        /** Gets or sets the player. */
        public player: Player;

        /** 
         * Initializes a new instance of an object.
         * @param {Player} player An instance of the player.
         */
        constructor(player: Player) {
            this.player = player;
        }

        /** Returns value indicating whether transmitter is connected to the query bus. */
        public isConnected(): boolean {
            return (location.href || '').toLowerCase().indexOf('_vo') >= 0;
        }
    }

    /** Represents CEF adapter. */
    export class CEFAdapter {
        /** Gets or sets the player. */
        public player: Player;

        /** 
         * Initializes a new instance of an object.
         * @param {Player} player An instance of the player.
         */
        constructor(player: Player) {
            this.player = player;

            this.player.addEventListener('cef:playbackStarted', () => {
                this.transmit('PlaybackStarted');
            });

            this.player.addEventListener('slideAnimationFinished', () => {
                this.transmit('SlideAnimationFinished');
            });

            this.player.addEventListener('playbackDimmed', () => {
                this.transmit('PlaybackFinished');
            });
        }

        /** Returns value indicating whether transmitter is connected to the query bus. */
        public isConnected(): boolean {
            return (location.href || '').toLowerCase().indexOf('_cef') >= 0;
        }

        /** Returns value indicating whether to disable animation. */
        public disableAnimation(): boolean {
            return (this.isConnected() && (location.href || '').toLowerCase().indexOf('_cef:animation=0') >= 0);
        }

        /** Returns value indicating whether to fast-forward show all slides. */
        public fastForwardAllSlides(): boolean {
            return (this.isConnected() && (location.href || '').toLowerCase().indexOf('_cef:fastforward=1') >= 0);
        }

        /** 
         * Transmits the given event.
         * @param {string} eventName Event name.
         */
        private transmit(eventName: string) {
            var doTransmit = () => {
                (<any>window.top).cefQuery({
                    request: 'Ifly.Cef.' + eventName,
                    onSuccess: () => { },
                    onFailure: () => { }
                });
            };

            if (this.isConnected()) {
                if ((location.href || '').toLowerCase().indexOf('_cef:debug=1') >= 0) {
                    try {
                        doTransmit();
                    } catch (ex) { if (typeof (console) != 'undefined') console.log(ex); }
                } else {
                    doTransmit();
                }
            }
        }
    }

    /** Represents a closing slide. */
    export class ClosingSlide {
        /** Gets or sets the player. */
        public player: Player;

        /** Gets or sets value indicating whether event handlers have been attached. */
        private _eventHandlersAttached: boolean;

        /** 
         * Initializes a new instance of an object.
         * @param {Player} player An instance of the player.
         */
        constructor(player: Player) {
            this.player = player;

            this.player.addEventListener('infographicSelected', () => {
                this.initialize();
            });

            this.player.addEventListener('playbackFinished', () => {
                this.show();
            });
        }

        /** Initializes the object. */
        public initialize() {
            var shareOptions = $('.sar-share-options'), tweet = '',
                url = $('.sar-share input').attr('data-url'), title = this.player.title;

            if (!this._eventHandlersAttached) {
                $('.sar-repeat button').click(() => {
                    this.hide();
                    this.player.beginPlaying(true);
                });

                this._eventHandlersAttached = true;
            }

            if (title && title.length) tweet = '"' + title + '" ';
            tweet += ((url || '') + ' via @spritesapp');

            shareOptions.find('a.facebook').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url || ''));
            shareOptions.find('a.twitter').attr('href', 'https://twitter.com/home?status=' + encodeURIComponent(tweet));
            shareOptions.find('a.google-plus').attr('href', 'https://plus.google.com/share?url=' + encodeURIComponent(url || ''));
            shareOptions.find('a.linkedin').attr('href', 'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(url || '') + '&title=' + encodeURIComponent(title || ''));
        }

        /** Hides the slide. */
        public hide() {
            $('.share-and-repeat').css({ display: 'none' })
                .removeClass('active dark light').find('.sar-content').removeAttr('style');
        }

        /** Shows the slide. */
        public show() {
            var container = $('.share-and-repeat'), timer = 15,
                viewportParams = null, w = null;

            this.player.controls.toggle(false);
            container.removeAttr('style');

            setTimeout(() => {
                container.addClass('active');
            }, timer);

            if (this.player.cef.isConnected() || this.player.voiceOver.isConnected()) {
                container.addClass(this.player.voiceOver.isConnected() ? 'light' : 'dark').find('.sar-content').hide();
            }

            setTimeout(() => {
                this.player.dispatchEvent('playbackDimmed');
            }, timer + 750);
        }

        /** Retruns value indicating whether closing slide is visible. */
        public isVisible(): boolean {
            return $('.share-and-repeat').hasClass('active');
        }
    }

    /** Represents password protection. */
    export class PasswordProtection {
        /** Gets or sets the player. */
        public player: Player;

        /** Gets or sets the previous user response. */
        public previousResponse: PasswordProtectionUserResponse;

        /** Gets or sets the infographic retrieved during previous password protect challenge. */
        private _previousData: any;

        /** 
         * Initializes a new instance of an object.
         * @param {Player} player An instance of the player.
         */
        constructor(player: Player) {
            this.player = player;
            this.previousResponse = null;
        }

        /** 
         * Begins querying for user response.
         * @param {Function} responseRetrieved A function that is executed when user response is retrieved.
         */
        public beginGetUserResponse(responseRetrieved: (response: PasswordProtectionUserResponse, infographic?: any) => any) {
            var ret = PasswordProtectionUserResponse.none, c = $('.password-protect'), tx = c.find('.password-protect-challenge'),
                btn = c.find('.password-protect-buttons button'), validatePassword = null,
                bg = $('.password-protect-background'), ui = [c, bg], changeState = (act) => {
                    for (var i = 0; i < ui.length; i++) {
                        act(ui[i]);
                    }
                };

            validatePassword = () => {
                var t = btn, passwordText = tx.val(), incorrectPassword = $('.incorrect-password');

                if (passwordText && passwordText.length) {
                    tx.attr('disabled', 'disabled');
                    incorrectPassword.removeClass('incorrect-password-show');
                    t.text(t.attr('data-text-loading')).attr('disabled', 'disabled');

                    $.post('../public/api/presentations/' + this.player.id + '/validatepassword', { password: passwordText }, data => {
                        var p = data != null ? (typeof (data) == 'string' ? $.parseJSON(data) : data) : null;

                        Ifly.App.preloadContent(this.player.getPreloadableContent(p), null, () => {
                            setTimeout(() => {
                                tx.removeAttr('disabled');
                                t.text(t.attr('data-text-normal')).removeAttr('disabled');
                            }, 1000);

                            this._previousData = p;
                            this.previousResponse = p != null ? PasswordProtectionUserResponse.passed : PasswordProtectionUserResponse.incorrectPassword;

                            incorrectPassword.toggleClass('incorrect-password-show', !p);

                            responseRetrieved(this.previousResponse, p);

                            if (this.previousResponse == PasswordProtectionUserResponse.passed) {
                                changeState(u => u.removeClass('active'));
                                setTimeout(() => {
                                    changeState(u => u.hide());
                                }, 300);
                            }

                            if (!p) {
                                tx.val('');

                                setTimeout(() => {
                                    try {
                                        tx.get(0).focus();
                                    } catch (ex) { }
                                }, 1100);
                            }
                        });
                    });
                }
            };

            if (this.previousResponse != null) {
                responseRetrieved(this.previousResponse, this._previousData);
            } else {
                tx.off('keydown').on('keydown', e => {
                    var code = e.keyCode || e.charCode || e.which;

                    if (code == 13) {
                        validatePassword();
                        e.preventDefault();
                    }
                });

                btn.off('click').on('click', e => {
                    validatePassword();
                });

                changeState(u => u.show().addClass('active'));

                setTimeout(() => {
                    try {
                        c.find('input[type="password"]').focus();
                    } catch (ex) { }
                }, 10);
            }

            return ret;
        }
    }

    /** Represents unsafe content warning. */
    export class UnsafeContentWarning {
        /** Gets or sets the player. */
        public player: Player;

        /** Gets or sets the previous user response. */
        public previousResponse: UnsafeContentWarningUserResponse;

        /** 
         * Initializes a new instance of an object.
         * @param {Player} player An instance of the player.
         */
        constructor(player: Player) {
            this.player = player;
            this.previousResponse = null;
        }

        /** 
         * Begins querying for user response.
         * @param {Function} responseRetrieved A function that is executed when user response is retrieved.
         */
        public beginGetUserResponse(responseRetrieved: (response: UnsafeContentWarningUserResponse) => any) {
            var ret = UnsafeContentWarningUserResponse.abort, c = $('.unsafe-content'),
                bg = $('.unsafe-content-background'), ui = [c, bg], changeState = (act) => {
                    for (var i = 0; i < ui.length; i++) {
                        act(ui[i]);
                    }
                };

            if (this.previousResponse != null) {
                responseRetrieved(this.previousResponse);
            } else if (this.player.cef.isConnected()) {
                this.previousResponse = UnsafeContentWarningUserResponse.proceed;
                responseRetrieved(this.previousResponse);
            } else {
                c.find('.unsafe-content-buttons button').off('click').on('click', e => {
                    this.previousResponse = parseInt($(e.target).attr('data-response'), 10);
                    responseRetrieved(this.previousResponse);

                    if (this.previousResponse == UnsafeContentWarningUserResponse.abort) {
                        bg.addClass('simple-response').append($('<div />').text(bg.attr('data-aborted-text')));
                    } else {
                        changeState(u => u.removeClass('active'));
                        setTimeout(() => {
                            changeState(u => u.hide());
                        }, 300);
                    }
                });

                changeState(u => u.show().addClass('active'));
            }

            return ret;
        }
    }

    /** Represents playback controls. */
    export class PlayerControls {
        /** Gets or sets the player. */
        public player: Player;

        /** Gets or sets value indicating whether playback was requested by user. */
        public playRequestedByUser: boolean;

        /** Gets or sets value indicating whether controls are currently hidden. */
        private _controlsHidden: boolean;

        /** 
         * Initializes a new instance of an object.
         * @param {Player} player An instance of the player.
         */
        constructor(player: Player) {
            this.player = player;

            this.player.addEventListener('playbackStarted', () => {
                this.refresh(false);
            });

            this.player.addEventListener('resumed', () => {
                this.refresh(true);
            });

            this.player.addEventListener('stopped', () => {
                this.refresh(false);
            });

            this.player.addEventListener('canvasCleared', () => {
                this.refresh(this.player.isPlaying());
            });

            this.player.addEventListener('cef:playbackStarted', () => {
                this.enableTicker();
            });

            $(window).keydown(e => {
                var code = e.keyCode || e.charCode || e.which;

                if (!this.player.closing.isVisible() && this.player.infographic != null) {
                    if (code == 37) { /* Left arrow */
                        this.backward();
                    } else if (code == 39) { /* Right arrow */
                        this.forward();
                    } else if (code == 32) { /* Space */
                        if (this.player.isPlaying()) {
                            this.pause();
                        } else {
                            this.play();
                        }
                    }
                }
            });
        }

        /** Initializes the player. */
        public initialize() {
            var hideTimeout = null, toggleTentative = (isTentative: boolean) => {
                $('.playback-control').toggleClass('tentative', !!isTentative);
            }, resetHideTimeout = () => {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }

                hideTimeout = setTimeout(() => {
                    toggleTentative(false);
                }, 2000);
            }, onMouseMove = () => {
                setTimeout(() => {
                    toggleTentative(true);
                    resetHideTimeout();
                }, 50);
            };

            $(window).mousemove(onMouseMove);
            $(this.player.canvas.container).mousemove(onMouseMove);
        }

        /**
         * Shows or hides all controls.
         * @param {boolean} showOrHide Value indicating whether to show or hide.
         */
        public toggle(showOrHide: boolean) {
            this._controlsHidden = !showOrHide;

            $('.playback-control').toggle(showOrHide).toggleClass('hidden', !showOrHide);
        }

        /** Shows the "Play" button. */
        public showPlay() {
            $('.playback-control.play').removeClass('hidden').show().addClass('active');
        }

        /** Displays the previous slide. */
        public backward() {
            this.stopBouncing();

            this.player.stop().previousSlide();
            this.refresh(false);
        }

        /** Displays the next slide. */
        public forward() {
            this.stopBouncing();

            this.player.stop().nextSlide();
            this.refresh(false);
        }

        /** Pauses the playback. */
        public pause() {
            this.stopBouncing();

            this.player.stop();
            this.refresh(false);
        }

        /* Applies bouncing animation to "Forward" button. */
        public bounceForward() {
            this.stopBouncing();
            $('.playback-control.forward').addClass('bouncing');
        }

        /* Applies bouncing animation to "Backward" button. */
        public bounceBackward() {
            this.stopBouncing();
            $('.playback-control.backward').addClass('bouncing');
        }

        /* Clears bouncing animation. */
        public stopBouncing() {
            $('.playback-control.bouncing').removeClass('bouncing');
        }

        /** Continues the playback. */
        public play() {
            this.stopBouncing();

            this.playRequestedByUser = true;

            this.player.resume(false);

            if ($('.playback-control.hidden').length > 0) {
                $('.playback-control.play').addClass('hidden');
            }

            this.refresh(true);
        }

        /** 
         * Updates the state of the controls.
         * @param {boolean} playing Value indicating whether playback is in progress.
         */
        public refresh(playing: boolean) {
            var toggleDisabled = (e, disabled) => {
                if (disabled) {
                    e.attr('disabled', 'disabled');
                } else {
                    e.removeAttr('disabled');
                }
            }, play = $('.playback-control.play'),
                pause = $('.playback-control.pause'),
                isLastSlide = this.player.isLastSlide();

            play.removeClass('active');

            this.enableControls(['play', 'pause']);

            if (playing) {
                this.enableControls(['backward', 'forward']);
            }

            if (Ifly.App.getInstance().browser.mobile) {
                $('.playback-control.backward').addClass('mobile-enabled');
                $('.playback-control.forward').addClass('mobile-enabled');
            }

            toggleDisabled($('.playback-control.backward'), !this.player.slide || this.player.isFirstSlide());

            if (!play.hasClass('hidden')) {
                play.toggle(!playing);
            }

            if (!pause.hasClass('hidden')) {
                pause.toggle(playing);
            }

            this.toggleProgress(playing);

            if (playing) {
                this.resetProgress();
            }
        }

        /** Resets and starts the progress. */
        public resetProgress() {
            var fill = $('.playback-progress .playback-progress-fill');

            fill.removeClass('playback-playing').css({width: '0%'});

            setTimeout(() => {
                fill.removeAttr('style').addClass('playback-playing');
            }, 10);
        }

        /**
         * Toggles progress visibility.
         * @param {boolean} isVisible Value indidacting whether progress is visible.
         */
        public toggleProgress(isVisible: boolean) {
            var p = $('.playback-progress');

            if (!p.hasClass('playback-progress-disabled')) {
                p.toggleClass('active', !!isVisible);
            } 
        }

        /**
         * Enables the given control.
         * @param {string} name Control name.
         */
        private enableControls(names: string[]) {
            $('.playback-progress').removeAttr('style');

            if (!this._controlsHidden) {
                $.each(names, (i, n) => {
                    $('.playback-control.' + n).removeAttr('style');
                });
            }
        }

        /** Enables the ticker. */
        private enableTicker() {
            if (this.player.cef.isConnected() && (!this.player.cef.disableAnimation() || this.player.cef.fastForwardAllSlides())) {
                $('.playback-ticker').removeAttr('style').addClass('active');
            }
        }
    }

    /** Represents presenter mode handler. */
    export class PresenterModeHandler extends EventSource {
        /** Gets or sets the player. */
        public player: Player;

        /** Gets or sets value indicating whether presenter mode is enabled. */
        public isEnabled: boolean;

        /**
         * Initializes a new instance of an object.
         * @param {Infographic} player Player.
         */
        constructor(player: Player) {
            super();

            this.player = player;
            this.isEnabled = location.href.toLowerCase().indexOf('presenter=') >= 0;
        }

        /** Returns presenter settings. */
        public getSettings(): any {
            return this.player.infographic ?
                (this.player.infographic.presenterSettings || {}) : {};
        }

        /** Initializes the handler. */
        public initialize() {
            $('.enter-fullscreen').click(() => this.enterFullScreen());
            $('.exit-fullscreen').click(() => this.exitFullScreen());
        }

        /** Prepares view. */
        public prepareView() {
            if (this.getSettings().animations == Ifly.Models.PresenterModeAnimationAvailability.minimal) {
                this.player.slideAnimation.handler = new MinimalAnimationHandler();
            }
        }

        /** Tries to show fullscreen prompt. */
        public tryShowFullscreenPrompt(onResponded?: Function) {
            var c = $('.full-screen-request'),
                bg = $('.full-screen-request-background'),
                ui = [c, bg],
                changeState = (act) => {
                    for (var i = 0; i < ui.length; i++) {
                        act(ui[i]);
                    }
                };

            c.find('.full-screen-request-buttons button').click(() => {
                changeState(u => u.removeClass('active'));
                setTimeout(() => {
                    changeState(u => u.hide());

                    (onResponded || function () { })();
                }, 300);
            });

            if (this.player.infographic &&
                this.player.infographic.presenterSettings &&
                !!this.player.infographic.presenterSettings.allowFullscreen) {

                changeState(u => u.show().addClass('active'));
            } else {
                (onResponded || function () { })();
            }
        }

        /** Enters full screen mode. */
        public enterFullScreen() {
            var element = (<any>document.documentElement),
                vendorMethods = [
                    'requestFullscreen',
                    'mozRequestFullScreen',
                    'webkitRequestFullscreen',
                    'msRequestFullscreen'
                ];

            for (var i = 0; i < vendorMethods.length; i++) {
                if (typeof (element[vendorMethods[i]]) === 'function') {
                    element[vendorMethods[i]]();

                    break;
                }
            }
        }

        /** Exits full screen mode. */
        public exitFullScreen() {
            var element = (<any>document.documentElement),
                vendorMethods = [
                    'exitFullscreen',
                    'mozCancelFullScreen',
                    'webkitExitFullscreen'
                ];

            for (var i = 0; i < vendorMethods.length; i++) {
                if (typeof (element[vendorMethods[i]]) === 'function') {
                    element[vendorMethods[i]]();

                    break;
                }
            }
        }
    }

    /** Represents an infographic player. */
    export class Player extends Ifly.EventSource {
        private static _instance: Player;

        /** Gets or sets the infographic Id. */
        public id: number;

        /** Gets or sets infographic title. */
        public title: string;

        /** Gets or sets the currently selected infographic. */
        public infographic: any;

        /** Gets or sets the currently selected slide. */
        public slide: any;

        /** Gets or sets the object that is responsible for rendering elements on a slide. */
        public canvas: Embed.Infographic;

        /** Gets or sets the controls. */
        public controls: PlayerControls;

        /** Gets or sets the closing slide. */
        public closing: ClosingSlide;

        /** Gets or sets value indicating whether player is running in preview mode. */
        public preview: boolean;

        /** Gets or sets value indicating whether to loop playback of this infographic. */
        public loopPlayback: boolean;

        /** Gets or sets the unsafe content warning. */
        public unsafeContentWarning: UnsafeContentWarning;

        /** Gets or sets password protection. */
        public passwordProtection: PasswordProtection;

        /** Gets or sets the CSS override. */
        public cssOverride: StyleOverride;

        /** Gets or sets the slide animation. */
        public slideAnimation: SlideAnimationManager;

        /** Gets or sets the presenter mode handler. */
        public presenterMode: PresenterModeHandler;

        /** Gets or sets the CEF adapter. */
        public cef: CEFAdapter;

        /** Gets or sets the voice-over adapter. */
        public voiceOver: VoiceOverAdapter;

        /** Gets or sets the timeouts object. */
        private _timeouts: any;

        /** Gets or sets value indicating whether playback has been finished. */
        private _playbackFinished: boolean;

        /** Gets or sets value indicating whether the replay request was issued. */
        private _replay: boolean;

        /** Initializes a new instance of an object. */
        constructor() {
            var refreshTimer = null;

            super();

            try {
                this.preview = window.opener && typeof (window.opener['Ifly']) != 'undefined' &&
                    typeof (window.opener['Ifly'].Editor) != 'undefined';
            } catch (ex) { this.preview = false; }

            this._timeouts = {
                duration: 310,
                beforeAnimate: null,
                afterAnimate: null,
                playback: null
            };

            this.controls = new PlayerControls(this);
            this.closing = new ClosingSlide(this);
            this.unsafeContentWarning = new UnsafeContentWarning(this);
            this.passwordProtection = new PasswordProtection(this);
            this.cssOverride = new StyleOverride(() => document.body);
            this.cef = new CEFAdapter(this);
            this.voiceOver = new VoiceOverAdapter(this);
            this.presenterMode = new PresenterModeHandler(this);

            $(window).resize(() => {
                clearTimeout(refreshTimer);

                refreshTimer = setTimeout(() => {
                    if (this.canvas) {
                        this.canvas.refresh();
                    }
                }, 50);
            });
        }

        /** Occurs when the canvas document has finished loading. */
        public onCanvasLoaded(document: any) {
            this.canvas = new Embed.Infographic($(document).find('.canvas .slide')[0]);
            this.slideAnimation = new SlideAnimationManager(this.canvas);

            this.controls.initialize();
            this.presenterMode.initialize();
        }

        /** Returns a list of resources that represent preloadable content. */
        public getPreloadableContent(infographic: any): any[] {
            var ret = [], url = null, imageProps = ['url', 'icon'], realtimeData = null, prop = (e, p) => {
                var result = null;

                if (e.properties) {
                    for (var k = 0; k < e.properties.length; k++) {
                        if (e.properties[k].name == p) {
                            result = e.properties[k].value;
                            break;
                        }
                    }
                }

                return result;
            };

            if (infographic != null && infographic.slides != null) {
                /* Preloading background image for the entire infographic. */
                if (infographic.backgroundImage && infographic.backgroundImage.length) {
                    if (infographic.backgroundImage.toLowerCase().indexOf('.svg') < 0 && infographic.backgroundImage.indexOf('://') > 0) {
                        ret.push({ type: 'image', url: infographic.backgroundImage });
                    }
                }

                for (var i = 0; i < infographic.slides.length; i++) {
                    if (infographic.slides[i].elements) {
                        for (var j = 0; j < infographic.slides[i].elements.length; j++) {
                            url = null;

                            if (infographic.slides[i].elements[j].type == 3 ||
                                infographic.slides[i].elements[j].type == 4 ||
                                infographic.slides[i].elements[j].type == 8) { /* Fact/Image/Figure */

                                for (var k = 0; k < imageProps.length; k++) {
                                    url = prop(infographic.slides[i].elements[j], imageProps[k]);

                                    if (url && url.length && url.indexOf('/') >= 0) {
                                        ret.push({ type: 'image', url: url });
                                    }
                                }
                            }

                            realtimeData = infographic.slides[i].elements[j].realtimeData;

                            if (realtimeData != null && ((realtimeData.endpoint != null && realtimeData.endpoint.length > 0) ||
                                realtimeData.sourceType == 3) && realtimeData.sourceType > 0) {
                                    ((s, e) => {
                                        ret.push({
                                            type: 'realtime',
                                            tag: {
                                                slideId: s.id,
                                                elementId: e.id,
                                                toString: function () { return s.id + '_' + e.id; }
                                            },
                                            elementType: e.type,
                                            url: realtimeData.endpoint,
                                            sourceType: realtimeData.sourceType,
                                            parameters: realtimeData.parameters,
                                            preloaded: data => {
                                                this._fillRealtimeData(e, data.content, data.result);
                                            }
                                        });
                                    })(infographic.slides[i], infographic.slides[i].elements[j]);
                            }
                        }
                    }
                }
            }

            return ret;
        }

        /** 
         * Selects the given infographic.
         * @param {object} infographic Infographic to select.
         * @param {object} options Infographic options.
         */
        public selectInfographic(infographic: any, options: any): Player {
            var args = Ifly.EventSource.createArguments({}, true);

            DeviceOrientationManager.requestOrientationChange(() => {
                options = options || <any>{};

                this.id = options.id;
                this.title = options.title;
                this.loopPlayback = !!options.loopPlayback;

                this.infographic = this.transformInfographic(infographic);
                this.slide = null;

                this.dispatchEvent('infographicSelected', args);
                
                if (!args.preventDefault) {
                    if (this.infographic || !!options.requiresPassword) {
                        if (!this.cef.isConnected()) {
                            this.beginPlaying();
                        } else {
                            this.dispatchEvent('cef:playbackStarted');

                            $(document.body).addClass('cef-ready');
                            this.beginPlaying();
                        }
                    }
                }
            });

            return this;
        }

        /** 
         * Begins the process of displaying the infographic.
         * @param {boolean} replay Value indicating whether this is a replay request.
         * @param {object} publishSettings Publish settings overrides.
         */
        public beginPlaying(replay?: boolean, publishSettings?: any): Player {
            var companyLogo = null, readyToPlay = null, onAfterPasswordChallenge = null, triggerRestart = null,
                unpublishedPresentation = $('.unpublished-presentation').hide(), cssSelector = '';

            this._playbackFinished = false;
            this._replay = !!replay;

            publishSettings = publishSettings || {};

            readyToPlay = () => {
                if (this.presenterMode.isEnabled) {
                    this.presenterMode.prepareView();
                }

                this.cssOverride.clearOverrides();

                cssSelector =
                'body.player[data-slideid="{slideId}"] .playback-progress .playback-progress-fill.playback-playing {\n' +
                    '-webkit-transition-duration: {duration}ms !important;\n' +
                    '-moz-transition-duration: {duration}ms !important;' +
                    '-ms-transition-duration: {duration}ms !important;' +
                    '-o-transition-duration: {duration}ms !important;' +
                    'transition-duration: {duration}ms !important;' +
                '}';

                for (var i = 0; i < this.infographic.slides.length; i++) {
                    if (this.infographic.slides[i].playbackTime) {
                        this.cssOverride.addOverride(cssSelector
                            .replace(/\{slideId\}/gi, this.infographic.slides[i].id)
                            .replace(/\{duration\}/gi, (this.infographic.slides[i].playbackTime * 1000).toString()));
                    }
                }

                this.canvas.applyTheme(this.infographic.theme, $.map([$('.wrapper'), this.canvas.slide], (elm) => $.makeArray(elm)));
                this.canvas.applyBackgroundImage(this.infographic.backgroundImage, this.infographic.theme, $.map([$('.wrapper'), this.canvas.slide], (elm) => $.makeArray(elm)));

                /* Hiding watermark as part of the "Pro"/"Agency" subscription. */
                $('.logo').toggle(this.infographic.userSubscriptionType == Ifly.Models.SubscriptionType.basic);

                /* Determining whether to show company logo. */
                companyLogo = $('.wrapper .company-logo');
                companyLogo.toggle(this.infographic.userSubscriptionType == Ifly.Models.SubscriptionType.agency && (companyLogo.css('backgroundImage') || '').toLowerCase().indexOf('url') >= 0);

                $('.wrapper').toggleClass('has-company-logo', companyLogo.is(':visible'));
                
                if (this.infographic.publishSettings) {
                    this.controls.toggle(!!this.infographic.publishSettings.controls && !this.presenterMode.isEnabled);

                    /* Progress bar won't be shown if disabled via publish configuration (or when presenting). */
                    $('.playback-progress').toggleClass('playback-progress-disabled',
                        !this.infographic.publishSettings.progressBar || this.presenterMode.isEnabled);

                    triggerRestart = () => {
                        setTimeout(() => {
                            this.dispatchEvent('playbackStarted');
                            this.restart();
                        }, replay ? 0 : 350);
                    };

                    if (!!this.infographic.publishSettings.autoPlay || !!publishSettings.autoPlay || this.presenterMode.isEnabled) {
                        if (!this.presenterMode.isEnabled) {
                            triggerRestart();
                        }
                    } else {
                        this.slide = null;
                        this.canvas.clear();
                        
                        this.controls.showPlay();
                    }

                    if (this.presenterMode.isEnabled) {
                        this.presenterMode.tryShowFullscreenPrompt(triggerRestart);
                    }
                }
            };

            onAfterPasswordChallenge = (data, protectionChallengeResult) => {
                if (protectionChallengeResult) {
                    this.infographic = this.transformInfographic(data);
                }

                if (typeof (this.infographic.isActive) == 'undefined' || this.infographic.isActive == null || !!this.infographic.isActive) {
                    if (this.containsUnsafeContent() && this.unsafeContentWarning.previousResponse == null) {
                        this.unsafeContentWarning.beginGetUserResponse(response => {
                            if (response != UnsafeContentWarningUserResponse.abort) {
                                readyToPlay();
                            }
                        });
                    } else {
                        readyToPlay();
                    }
                } else {
                    unpublishedPresentation.show();
                }
            };

            if (this.preview) {
                this.unsafeContentWarning.previousResponse = UnsafeContentWarningUserResponse.proceed;
            }

            if (!this.infographic) {
                (<any>this.passwordProtection).beginGetUserResponse((response, data) => {
                    if (response == PasswordProtectionUserResponse.passed) {
                        onAfterPasswordChallenge(data, true);
                    }
                });
            } else {
                onAfterPasswordChallenge(this.infographic, false);
            }

            return this;
        }

        /** Returns value indicating whether the current infographic is currently playing. */
        public isPlaying(): boolean {
            return this._timeouts.playback != null;
        }

        /** Pauses the current playback. */
        public stop(): Player {
            clearTimeout(this._timeouts.playback);

            this._timeouts.playback = null;
            this._playbackFinished = true;

            this.dispatchEvent('stopped');

            return this;
        }

        /** Restarts the infographic by showing the first slide. */
        public restart(): Player {
            this.slide = null;
            this._playbackFinished = false;

            this.resume();

            return this;
        }

        /** 
         * Resumes the playback.
         * @param {boolean} switchSlide Value indicating whether to switch to the next slide right away.
         */
        public resume(switchSlide?: boolean): Player {
            var slideShowing = (s, noImmediate?: boolean) => {
                var slideIndex = -1;

                if (!this._playbackFinished) {
                    if (!noImmediate) {
                        this.nextSlide();
                    }

                    if (s) {
                        if (!this.controls.playRequestedByUser &&
                            !!this.infographic.publishSettings.autoPlay &&
                            Ifly.App.getInstance().isExternallyEmbedded()) {

                            slideIndex = this.getSlideIndex(s);
                        }

                        if (slideIndex != 0) {
                            this._timeouts.playback = setTimeout(() => {
                                slideShowing(this.infographic.slides[this.getCurrentSlideIndex() + 1]);
                            }, (this.cef.fastForwardAllSlides() ? 2 : (s.playbackTime || 10)) * 1000);
                        } else {
                            this.controls.pause();
                            this.controls.bounceForward();
                        }
                    }
                }
            };

            if (this._timeouts.playback) {
                clearTimeout(this._timeouts.playback);
            }

            if (typeof (switchSlide) == 'undefined' || switchSlide == null || !!switchSlide || !this.slide) {
                this.nextSlide();
            } else if (this.slide && switchSlide == false) {
                this._playbackFinished = false;
            }

            if (!this.presenterMode.isEnabled) {
                slideShowing(this.slide, true);
            }

            this.dispatchEvent('resumed');

            return this;
        }

        /** Shows the next slide. */
        public nextSlide(): Player {
            if (!this.isLastSlide()) {
                this.selectSlide(this.getCurrentSlideIndex() + 1);
            } else {
                this.stop();

                if (this.loopPlayback) {
                    this.clear(() => {
                        this.beginPlaying(true);
                    });
                } else {
                    this.dispatchEvent('playbackFinished');
                }
            }

            return this;
        }

        /** Shows the previous slide. */
        public previousSlide(): Player {
            if (!this.isFirstSlide()) {
                this.selectSlide(this.getCurrentSlideIndex() - 1);
            } else {
                this.dispatchEvent('stopped');
            }

            return this;
        }

        /** 
         * Selects the given slide.
         * @param {object} slide Either a slide object or a zero-based index of a slide.
         * @param {object} params Additional parameters that include:
         *   - beforeSelect
         *     A callback which is fired before the slide is about to be selected.
         *   - beforeAnimate
         *     A callback which is fired before slide animation is applied.
         *   - afterAnimate
         *     A callback which is fired after slide animation is applied.
         *   - afterSelect
         *     A callback which is fired after slide has been selected.
         */
        public selectSlide(slide: any, params?: any): Player {
            var replayBehavior = !!this._replay, o = params || {}, s = typeof (slide) == 'number' ? this.infographic.slides[slide] :
                (slide && typeof (slide.title) != 'undefined' ? slide : null), e = { slide: s },
                title = '', description = '', updateSpecialElement = (v: string, t: number, n: string) => {
                    if (v && v.length) {
                        var element = {
                            id: -1 * t,
                            type: t,
                            name: n,
                            slideId: s.id,
                            position: 0,
                            properties: [
                                { name: 'text', value: v }
                            ]
                        };

                        this.canvas.ensureElement(element, null, null, { alwaysOnTop: true });
                    } else {
                        this.canvas.removeElements(e => {
                            return e.hasClass('type-' + Ifly.Models.ElementType[t]);
                        });
                    }
                };

            this._callback(o.beforeSelect, e);
            this._replay = false;

            this.slide = s;

            if (s) {
                this.clear(() => {
                    this.dispatchEvent('canvasCleared', e);

                    $(document.body).attr('data-slideid', s.id);
                    $('.wrapper').attr('data-slideid', s.id);

                    updateSpecialElement(s.description, 2, 'description');
                    updateSpecialElement(s.title, 1, 'title');

                    $.each(s.elements, (ii, elm) => this.canvas.ensureElement(elm, null, (e, serialized) => {
                        if (serialized.navigateSlideId > 0) {
                            ((gotoSlide) => {
                                e.addClass('element-clickable')
                                    .attr('title', 'Click to go to the linked slide')
                                    .click(() => { this.selectSlide(this.findSlideById(gotoSlide)); });
                            })(serialized.navigateSlideId);
                        }
                    }));

                    this.animate({
                        beforeAnimate: o.beforeAnimate,
                        afterAnimate: (sender, args) => {
                            this.dispatchEvent('slideAnimationFinished', e);

                            this._callback(o.afterAnimate, e);
                            this._callback(o.afterSelect, e);
                        }
                    });
                }, replayBehavior);
            } else {
                this._callback(o.afterSelect, e);
            }

            this.dispatchEvent('slideSelected', e);

            return this;
        }

        /** 
         * Animates the current slide.
         * @param {object} params Additional parameters that include:
         *    - beforeAnimate
         *      A callback which is fired before animation starts.
         *    - afterAnimate
         *      A callback which is fired after animation completes.
         */
        public animate(params: any): Player {
            var o = params || {}, e = { slide: this.slide }, animationApplied = false,
                animationClasses = [], animationResult = null;

            this.canvas.container.removeClass('active');

            animationClasses = $.grep(this.canvas.container.attr('class').split(' '),
                (e: string) => e.indexOf('animate-') == 0);

            if (animationClasses.length) {
                this.canvas.container.removeClass(animationClasses.join(' '));
                animationApplied = true;
            } 

            this.canvas.container.removeAttr('data-hideduration');

            this._timeoutable('beforeAnimate', () => {
                this._callback(o.beforeAnimate, e);

                if (!this.cef.disableAnimation() && (!this.presenterMode.isEnabled || this.presenterMode.getSettings().animations != Ifly.Models.PresenterModeAnimationAvailability.none)) {
                    this.canvas.container.addClass('animate-appear');

                    this._timeoutable('beforeApplyActive', () => {
                        this.canvas.container.addClass('active');

                        animationResult = this.slideAnimation.applyAnimation({
                            slideIndex: this.getCurrentSlideIndex()
                        });

                        this.canvas.container.attr('data-hideduration', animationResult.hideDuration);

                        this._timeoutable('afterAnimate', () => {
                            this._callback(o.afterAnimate, e);
                        }, true, animationResult.appearDuration);
                    }, true, 50);
                } else {
                    this.canvas.container.addClass('animate-disable');
                    this.canvas.container.addClass('active');

                    this._timeoutable('afterAnimate', () => {
                        this._callback(o.afterAnimate, e);
                    }, true, 500);
                }
            }, animationApplied, 50);

            return this;
        }

        /** 
         * Clears the composition.
         * @param {Function} complete A callback.
         * @param {boolean} replayBehavior Value indicating whether to apply replay behavior.
         */
        public clear(complete?: Function, replayBehavior?: boolean): Player {
            var hideDuration = parseInt(this.canvas.container.attr('data-hideduration'), 10), cleared = () => {
                this.canvas.clear();
                this.dispatchEvent('cleared');

                setTimeout(() => {
                    (complete || function () { })();
                }, 10);
            };

            $(document.body).removeAttr('data-slideid');
            $('.wrapper').removeAttr('data-slideid');

            if (!isNaN(hideDuration) && hideDuration > 0 && !replayBehavior) {
                this.canvas.container.addClass('animate-fade');
                setTimeout(() => {
                    cleared();
                }, hideDuration + 10);
            } else {
                cleared();
            }

            return this;
        }

        /**
         * Returns the index of a given slide.
         * @param {number} slide Slide.
         */
        public getSlideIndex(slide: any): number {
            var ret = -1;

            if (this.infographic && slide) {
                for (var i = 0; i < this.infographic.slides.length; i++) {
                    if (this.infographic.slides[i].id == slide.id) {
                        ret = i;
                        break;
                    }
                }
            }

            return ret;
        }

        /** Returns the zero-based index of the currently selected slide. */
        public getCurrentSlideIndex(): number {
            var ret = -1, p = this.infographic ? this.infographic.publishSettings : null;

            if (p && this.isDefined(p.slide, s => s >= 0)) {
                ret = p.slide - 1;
            } else {
                ret = this.getSlideIndex(this.slide);
            }

            return ret;
        }

        /**
         * Returns a slide by its Id.
         * @param {number} id Slide Id.
         */
        public findSlideById(id: number): any {
            var ret = null, slides = [];

            if (id > 0) {
                slides = this.infographic.slides;

                for (var i = 0; i < slides.length; i++) {
                    if (slides[i].id == id) {
                        ret = slides[i];
                        break;
                    }
                }
            }

            return ret;
        }

        /** Returns value indicating whether the first slide is currently loaded. */
        public isFirstSlide(): boolean {
            var p = this.infographic ? this.infographic.publishSettings : null;
            return ((!p || !this.isDefined(p.slide, s => s >= 0)) && this.getCurrentSlideIndex() == 0) || (p && this.isDefined(p.slide, s => s >= 0) && this.slide != null);
        }

        /** Returns value indicating whether the last slide is currently loaded. */
        public isLastSlide(): boolean {
            var p = this.infographic ? this.infographic.publishSettings : null;
            return ((!p || !this.isDefined(p.slide, s => s >= 0)) && (!this.infographic || this.getCurrentSlideIndex() == this.infographic.slides.length - 1)) || (p && this.isDefined(p.slide, s => s >= 0) && this.slide != null);
        }

        /** Returns value indicating whether this infographic contains unsafe content (such as custom JavaScript widgets). */
        public containsUnsafeContent(): boolean {
            var ret = false;

            if (this.infographic && this.infographic.slides) {
                for (var i = 0; i < this.infographic.slides.length; i++) {
                    if (this.infographic.slides[i] && this.infographic.slides[i].elements) {
                        for (var j = 0; j < this.infographic.slides[i].elements.length; j++) {
                            if (this.infographic.slides[i].elements[j] && this.infographic.slides[i].elements[j].type == 13) { // Widget
                                if (!this.isSignedWidget(this.infographic.slides[i].elements[j])) {
                                    ret = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (ret) {
                        break;
                    }
                }
            }

            return ret;
        }

        /**
         * Returns value indicating whether the given widget element's code is signed.
         * @param {object} element Element to check.
         */
        public isSignedWidget(element: any): boolean {
            var ret = false, props = element ? element.properties || [] : [];

            for (var i = 0; i < props.length; i++) {
                if ((props[i].name || '').toLowerCase() == 'codesigned') {
                    ret = (props[i].value || '').toLowerCase() == 'true';

                    if (ret) {
                        break;
                    }
                }
            }

            return ret;
        }

        /** 
         * Executes the given callback by first checking whether it's null-pointer reference.
         * @param {Function} callback Callback to execute.
         * @param {object} e Event arguments, if any.
         */
        private _callback(callback: Function, e?: any) {
            if (callback) {
                callback(this, e || {});
            }
        }

        /** 
         * Transforms the given infographic.
         * @param {object} infographic Infographic.
         */
        private transformInfographic(infographic: any): any {
            var ret = infographic;

            if (ret && ret.slides && ret.slides.length) {
                ret.slides.sort((x, y) => (x.order || x.Order || 0) - (y.order || y.Order || 0));
            }

            return ret;
        }

        /**
         * Returns value indicating whether the given value is defined.
         * @param {object} v Value.
         * @param {Function} validate Value validator.
         */
        private isDefined(v: any, validator?: (value: any) => boolean): boolean {
            var ret = typeof (v) != 'undefined' && v != null;

            if (ret && validator) {
                ret = !!validator(v);
            }

            return ret;
        }

        /** 
         * Waits for a predefined number of milliseconds and executes the given action.
         * @param {string} timeout Timeout name.
         * @param {Function} action Action to execute.
         * @param {boolean} wait Value indicating whether to wait before executing the given action.
         */
        private _timeoutable(timeout: string, action: Function, wait?: boolean, delay?: number) {
            if (this._timeouts[timeout]) {
                clearTimeout(this._timeouts[timeout]);
                this._timeouts[timeout] = null;
            }

            if (typeof (wait) == 'undefined' || wait == null || wait) {
                this._timeouts[timeout] = setTimeout(action, delay || this._timeouts.duration);
            } else {
                action();
            }
        }

        /**
         * Fills realtime data properties on a given element.
         * @param {object} element Element.
         * @param {object} request Request.
         * @param {object} response Response.
         */
        private _fillRealtimeData(element: any, request: any, response: any) {
            var getValue = (f: string, r: number): string => {
                var result = null, ix = -1, row = null;

                if (r >= 0 && r < response.rows.length) {
                    f = (f || '').toLowerCase();

                    for (var i = 0; i < response.columns.length; i++) {
                        if ((response.columns[i].name || '').toLowerCase() === f) {
                            ix = i;
                            break;
                        }
                    }

                    if (ix >= 0) {
                        if (response.columns[0].name === null && ix > 0) {
                            ix--;
                        }

                        row = response.rows[r];

                        if (row.cells && row.cells.length > 0 && ix < row.cells.length) {
                            result = (row.cells[ix] || {}).value;
                        }
                    }
                }

                return result;
            }, ifValue = (f: string, r: number, c: (v: string) => any) => {
                var val = getValue(f, r);

                if (val != null) {
                    c(val);
                }
            }, setValue = (n: string, v: string) => {
                if (element.properties) {
                    for (var i = 0; i < element.properties.length; i++) {
                        if (element.properties[i].name == n) {
                            element.properties[i].value = v;
                            break;
                        }
                    }
                }
            }, setIfValue = (f: string) => {
                ifValue(f, 0, v => setValue(f, v));
            }, setMultipleValues = (f: string, cols: string[], req?: string[], wrap?: (res) => any) => {
                var colMap = null, val = null, r = [], obj = {}, allReq = () => {
                    var result = true;

                    if (req && req.length) {
                        for (var k = 0; k < req.length; k++) {
                            result = !!colMap[req[k]];

                            if (!result) {
                                break;
                            }
                        }
                    }

                    return result;
                };

                if (response.rows && response.rows.length) {
                    for (var i = 0; i < response.rows.length; i++) {
                        obj = {};
                        colMap = {};

                        for (var j = 0; j < cols.length; j++) {
                            val = getValue(cols[j], i);

                            if (typeof (val) !== 'undefined' && val != null) {
                                colMap[cols[j]] = true;
                                obj[cols[j]] = val;
                            }
                        }

                        if (allReq()) {
                            r[r.length] = obj;
                        }
                    }

                    if (r.length) {
                        setValue(f, JSON.stringify(wrap ? wrap(r) : r));
                    }
                }
            };

            if (response && response.rows && response.rows.length &&
                response.columns && response.columns.length) {

                switch (element.type) {
                    case Models.ElementType.text: 
                    case Models.ElementType.callout:
                        ifValue('text', 0, v => {
                            setValue('isRichText', 'false');
                            setValue('text', v);
                        });

                        break;
                    case Models.ElementType.fact:
                        setIfValue('quantity');
                        setIfValue('measure');
                        setIfValue('description');

                        break;
                    case Models.ElementType.image:
                        ifValue('url', 0, v => {
                            setValue('sourceType', '0');
                            setValue('url', v);
                        });
                        
                        setIfValue('width');

                        break;
                    case Models.ElementType.map:
                        setMultipleValues(
                            'annotations',
                            ['areaName', 'areaCode', 'density', 'baseColor', 'tooltip'],
                            ['areaCode'],
                            (ann) => { return { annotations: ann }; }
                        );

                        break;
                    case Models.ElementType.chart:
                        if (response.columns && response.columns.length &&
                            response.columns[0].name === null) {

                            if (response.rows && response.rows.length) {
                                for (var i = 0; i < response.rows.length; i++) {
                                    if (response.rows[i].cells && response.rows[i].cells.length < response.columns.length) {
                                        response.rows[i].cells.unshift({ value: null });
                                    }
                                }
                            }
                        }

                        setValue('data', JSON.stringify(response));

                        break;
                    case Models.ElementType.table:
                        if (response.columns && response.columns.length &&
                            response.columns[0].name === null) {

                            response.columns.splice(0, 1);
                        }

                        setValue('data', JSON.stringify(response));

                        break;
                    case Models.ElementType.figure:
                        setIfValue('icon');
                        setIfValue('size');
                        setIfValue('highlight');
                        setIfValue('highlightColor');

                        break;
                    case Models.ElementType.progress:
                        setMultipleValues(
                            'bars',
                            ['description', 'percentage', 'color'],
                            ['percentage'],
                            (bs) => { return { bars: bs }; }
                        );

                        break;
                    case Models.ElementType.timeline:
                        setMultipleValues(
                            'items',
                            ['label', 'description', 'size', 'style'],
                            ['label', 'size'],
                            (itm) => { return { items: itm }; }
                        );

                        break;
                }
            }
        }

        /** Returns the current instance of the player. */
        public static getInstance(): Player {
            if (!this._instance) {
                this._instance = new Player();
            }

            return this._instance;
        }
    }
}

/* Alias to public symbol "Sprites". */
window['Sprites'] = Ifly.Models.Embed;
