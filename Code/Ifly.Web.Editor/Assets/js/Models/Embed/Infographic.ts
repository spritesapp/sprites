/// <reference path="../../Typings/jquery.d.ts" />

module Ifly.Models.Embed {
    /** Represents element indicator. */
    export class ElementIndicator {
        /** Gets or sets the host. */
        public host: Infographic;

        /**
         * Initializes a new instance of an object.
         * @param {Infographic} host Host.
         */
        constructor(host: Infographic) {
            this.host = host;
        }

        /** 
         * Applies "Fade in" focus to the given element.
         * @param {number} id Element Id.
         * @param {Function} complete A callback function.
         */
        public fadeIn(id: number, complete?: Function) {
            this.applyIndication(id, 'fadein', complete);
        }

        /** 
         * Applies "Fade out" focus to the given element.
         * @param {number} id Element Id.
         * @param {Function} complete A callback function.
         */
        public fadeOut(id: number, complete?: Function) {
            this.applyIndication(id, 'fadeout', complete);
        }

        /** 
         * Applies "Blink border" focus to the given element.
         * @param {number} id Element Id.
         * @param {Function} complete A callback function.
         */
        public blinkBorder(id: number, complete?: Function) {
            this.applyIndication(id, 'blinkborder', complete);
        }

        /** 
         * Applies the given indication to the given element.
         * @param {number} id Element Id.
         * @param {string} indication Indication.
         * @param {Function} complete A callback function.
         */
        private applyIndication(id: number, indication: string, complete?: Function) {
            var element = this.getElementNode(id),
                indicationClassName = 'element-focus-' + indication,
                callback = complete || function () { };

            this.host.slide.find('.' + indicationClassName).removeClass(indicationClassName);

            if (element.length) {
                element.addClass('element-focus-' + indication);

                setTimeout(() => {
                    this.getElementNode(id).removeClass(indicationClassName);
                    callback();
                }, 350);
            } else {
                callback();
            }
        }

        /**
         * Returns element node.
         * @param {number} id Element Id.
         */
        private getElementNode(id: number) {
            return this.host.slide.find('.element[data-elementid="' + id + '"]');
        }
    }

    /** Represents a style override. */
    export interface IStyleOverride {
        /** Gets or sets override Id. */
        id: string;

        /** Gets or sets override CSS text. */
        css: string;
    }

    /** Represents CSS style override. */
    export class StyleOverride {
        /** Gets or sets the reference node (lazily loaded). */
        private _refNode: () => JQuery;

        /** Gets or sets local override Id auto-increment. */
        private _increment: number;

        /** Gets or sets all currently registered overrides. */
        private _overrides: any;

        /** Gets or sets the global override Id auto-increment. */
        private static _autoId: number;

        /** 
         * Initializes a new instance of an object.
         * @param {object} refNode Reference node (indicates where CSS overrides are going to be placed).
         */
        constructor(refNode: any) {
            if (!StyleOverride._autoId) {
                StyleOverride._autoId = 0;
            }

            StyleOverride._autoId++;

            this._increment = 0;
            this._overrides = {};

            this._refNode = (() => {
                var v = null;

                return () => {
                    var t = '';

                    if (!v) {
                        if ($.isFunction(refNode)) {
                            v = $(refNode());
                        } else {
                            v = $(refNode);
                        }

                        if (v && v.length) {
                            t = (v.get(0).tagName || v.get(0).nodeName || '').toLowerCase();

                            if (t == 'body' || t == 'head') {
                                v = $($(v).parent().find('body').children().last());
                            }
                        }
                    }

                    return v;
                };
            })();
        }

        /**
         * Adds new CSS style override.
         * @param {string} css CSS override contents.
         * @param {string} id Override Id.
         * @returns {string} Override Id.
         */
        public addOverride(css: string, id?: string): string {
            var ret = id || 'csso_' + StyleOverride._autoId + '_' + (++this._increment),
                style = document.createElement('style');

            style.type = 'text/css';
            style.id = ret;

            if (style.styleSheet) {
                (<any>style.styleSheet).cssText = css;
            } else {
                style.appendChild(document.createTextNode(css));
            }

            this._refNode().parent().get(0).insertBefore(style,
                this._refNode().get(0).nextSibling);

            this._overrides[ret] = '1';

            return ret;
        }

        /**
         * Removes the given CSS style override.
         * @param {string} id Override Id.
         * @returns {string} CSS override contents.
         */
        public removeOverride(id: string): string {
            var ret = null, style = null;

            if (id && id.length) {
                delete this._overrides[id];

                style = this._refNode().get(0).ownerDocument.getElementById(id);

                if (style) {
                    ret = $(style).text();
                    style.parentNode.removeChild(style);
                }
            }

            return ret;
        }

        /** 
         * Removes all currently registered overrides.
         * @returns {IStyleOverride[]} A list of all registered overrides.
         */
        public clearOverrides(): IStyleOverride[] {
            var ret = [], toRemove = [];

            for (var p in this._overrides) {
                if (typeof (this._overrides[p]) == 'string') {
                    toRemove[toRemove.length] = p;
                }
            }

            for (var i = 0; i < toRemove.length; i++) {
                ret[ret.length] = {
                    id: toRemove[i],
                    css: this.removeOverride(toRemove[i])
                };
            }

            this._overrides = {};

            return ret;
        }
    }

    /** Represents a widget. */
    export class Widget {
        /** Gets or sets the widget code. */
        private _code: string;

        /** Gets or sets the compiled code. */
        private _compiledCode: any;

        /** 
         * Initializes a new instance of an object.
         * @param {string} code Widget code.
         */
        constructor(code: string) {
            this._code = code;
        }

        /** Compiles the widget. */
        public compile() {
            var widget = null, c = '';

            this._compiledCode = null;

            c = Utils.Input.javascriptDecode(this._code);

            if (c.indexOf('var ') != 0) {
                c = 'var ' + c;
            }

            eval(c);

            if (widget != null && typeof (widget.render) == 'function') {
                this._compiledCode = widget;
            } else {
                throw new Error('Not a widget.');
            }
        }

        /**
         * Renders the widget.
         * @param {JQuery} container Widget container.
         * @param {Document} document Document.
         * @param {Window} window Window.
         */
        public render(container: JQuery, document: Document, window: Window) {
            if (!this._compiledCode) {
                throw new Error('Widget wasn\'t compiled.');
            }

            this._compiledCode.render(container, document, window);
        }
    }

    /** Represents a draggable element manager. */
    export class DraggableElementManager {
        /** Gets or sets the element namespace. */
        public static EventNamespace = '.DraggableElement';

        /** Gets or sets the current instance of the manager. */
        private static _current: DraggableElementManager;

        /** Gets or sets the current graggable element. */
        private _currentDraggable: DraggableElement;

        /** Gets or sets all draggables. */
        private _allDraggables: DraggableElement[];

        /** Returns the current instance of a draggable element manager. */
        public static getCurrent(): DraggableElementManager {
            if (!this._current) {
                this._current = new DraggableElementManager();
            }

            return this._current;
        }

        /**
         * Registers new draggable.
         * @param {DraggableElement} element Draggable element.
         */
        public registerDraggable(element: DraggableElement) {
            var ns = DraggableElementManager.EventNamespace;

            if (!this._allDraggables) {
                this._allDraggables = [];

                $(element.node[0].ownerDocument).unbind(ns)
                    .bind('mousedown' + ns, e => { this.onMouseDown(e); })
                    .bind('mousemove' + ns, e => { this.onMouseMove(e); })
                    .bind('mouseup' + ns, e => { this.onMouseUp(e); });
            }

            element.node.attr('data-draggable', 'true').addClass('element-draggable');
            element.node.unbind(ns).bind('dragstart', e => { e.preventDefault(); });

            this.makeContentDraggable(element.node);

            this._allDraggables.push(element);
        }

        /** 
         * Destroys the given draggable.
         * @param {JQuery} node Node to remove draggable behavior from.
         * @param {boolean} softDestroy Soft destroy. Doesn't de-register the draggable but only removes draggable attributes.
         */
        public destroyDraggable(node: JQuery, softDestroy?: boolean) {
            var draggableIndex = -1, ns = DraggableElementManager.EventNamespace;

            if (!softDestroy) {
                if (this._allDraggables) {
                    for (var i = 0; i < this._allDraggables.length; i++) {
                        if (this._allDraggables[i].node[0] == node[0]) {
                            draggableIndex = i;
                            break;
                        }
                    }
                }

                if (draggableIndex >= 0) {
                    delete this._allDraggables[draggableIndex];
                    this._allDraggables.splice(draggableIndex, 1);

                    if (this._currentDraggable.node[0] == node[0]) {
                        this._currentDraggable = null;
                    }
                }

                node.unbind(ns)
                    .removeClass('element-draggable')
                    .removeAttr('data-draggable');
            }

            node.removeClass('element-dragged')
                .css({ left: '', top: '' });
        }

        /** 
         * Register inner content of a given node as draggable.
         * @param {JQuery} node Node whose content to make draggable.
         */
        public makeContentDraggable(node: JQuery) {
            var ns = DraggableElementManager.EventNamespace;

            setTimeout(() => {
                node.find('svg, iframe')
                    .unbind(ns)
                    .bind('mousedown' + ns, e => { this.onMouseDown(e); })
                    .bind('mousemove' + ns, e => { this.onMouseMove(e); })
                    .bind('mouseup' + ns, e => { this.onMouseUp(e); });
            }, 100);
        }

        /** 
         * Handles "mousedown" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseDown(e: JQueryEventObject) {
            var t = $(e.target), d = null, p = null;

            if (t.hasClass('element-draggable')) {
                d = t[0];
            } else {
                p = t.parents('.element-draggable');
                if (p.length) {
                    d = p[0];
                }
            }

            if (d) {
                for (var i = 0; i < this._allDraggables.length; i++) {
                    if (this._allDraggables[i].node[0] == d) {
                        this._currentDraggable = this._allDraggables[i];
                        this._currentDraggable.onMouseDown(e);

                        break;
                    }
                }
            }
        }

        /** 
         * Handles "mousedown" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseMove(e: JQueryEventObject) {
            if (this._currentDraggable) {
                this._currentDraggable.onMouseMove(e);
            }
        }

        /** 
         * Handles "mouseup" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseUp(e: JQueryEventObject) {
            if (this._currentDraggable) {
                this._currentDraggable.onMouseUp(e);
                this._currentDraggable = null;
            }
        }
    }
    
    /** Represents a move target. */
    export class MoveTarget {
        /** Gets or sets the node. */
        public node: JQuery;

        /** Gets or sets value indicating whether the move has started. */
        public moveStarted: boolean;

        /** Gets or sets value indicating whether elemens was moved. */
        public wasMoved: boolean;

        /** Gets or sets the drag delta. */
        public delta: any;

        /** Gets or sets the initial element position. */
        public initialPosition: any;

        /** Gets or sets the current position. */
        public currentPosition: any;

        /** 
         * Initializes a new instance of an object.
         * @param {JQuery} node Move target node.
         */
        constructor(node: JQuery) {
            this.node = node;
        }

        /**
         * Begins the move.
         * @param {number} focusX X-coordinate of the focus within the node.
         * @param {number} focusY Y-coordinate of the focus within the node.
         */
        public beginMove(focusX?: number, focusY?: number) {
            var o = null;

            if (!this.node.hasClass('element-locked')) {
                o = this.node.offset();

                this.wasMoved = false;
                this.moveStarted = true;

                this.delta = {
                    left: focusX ? (focusX - o.left) : 0,
                    top: focusY ? (focusY - o.top) : 0
                };
            }
        }

        /**
         * Performs move.
         * @param {number} destinationX X-coordinate of the destination.
         * @param {number} destinationY Y-coordinate of the destination.
         */
        public move(destinationX: number, destinationY: number) {
            var n = this.node[0], newPosition = null, slide = null,
                deltaLeft = 0, deltaTop = 0, ret = null;

            if (this.moveStarted) {
                newPosition = {
                    left: destinationX - this.delta.left,
                    top: destinationY - this.delta.top
                };

                if (!this.initialPosition) {
                    this.initialPosition = newPosition;
                }

                this.currentPosition = newPosition;

                deltaLeft = Math.abs(this.currentPosition.left - this.initialPosition.left);
                deltaTop = Math.abs(this.currentPosition.top - this.initialPosition.top);

                // Threshold is 6 pixels - not starting to move the element unless it "traverses" a path of 6px.
                if (deltaLeft >= 6 || deltaTop >= 6) {
                    if (!this.node.hasClass('element-dragged')) {
                        this.node.addClass('element-dragged');

                        /* Moving the element out of the current stack (not not mess with sotring). */
                        if (!this.node.parent().hasClass('slide')) {
                            slide = this.node.parents('.slide');

                            slide.prepend(this.node);

                            /* Cleaning up stacks (removing redundant <br />). */
                            Infographic.cleanSlideStacks(slide);
                        }

                        n.style.left = this.delta.left + 'px';
                        n.style.top = this.delta.top + 'px';
                    }

                    $(this.node[0].ownerDocument.body).addClass('element-dragging');
                    this.node.addClass('element-dragging');

                    n.style.left = newPosition.left + 'px';
                    n.style.top = newPosition.top + 'px';

                    this.wasMoved = true;

                    ret = newPosition;
                }
            }

            return ret;
        }

        /** Ends the move. */
        public endMove() {
            var ret = null;

            $(this.node[0].ownerDocument.body).removeClass('element-dragging');
            this.node.removeClass('element-dragging');

            if (this.moveStarted) {
                ret = {
                    wasMoved: this.wasMoved,
                    currentPosition: this.currentPosition
                };

                this.delta = null;
                this.wasMoved = false;
                this.moveStarted = false;
                this.currentPosition = null;
                this.initialPosition = null;
            }

            return ret;
        }
    }

    /** Represents move target group. */
    export class MoveTargetGroup extends EventSource {
        /** Gets or sets the contents of a group. */
        public contents: MoveTarget[];

        /** Gets or sets the anchor. */
        public anchor: DraggableElement;

        /** Gets or sets event wrappers. */
        private _eventWrappers: any;

        /**
         * Initializes a new instance of an object.
         * @param {JQuery[]} nodes Nodes.
         * @param {DraggableElement} anchor.
         */
        constructor(nodes: JQuery[], anchor: DraggableElement) {
            super();

            this.contents = [];
            this.anchor = anchor;

            this.forEach(nodes, n => {
                this.contents[this.contents.length] = new MoveTarget($(n));
            });

            this._eventWrappers = {
                dragstart: (sender, e) => this.onDragStart(sender, e),
                drag: (sender, e) => this.onDrag(sender, e),
                dragend: (sender, e) => this.onDragEnd(sender, e)
            };

            this.anchor.addEventListener('dragstart', this._eventWrappers.dragstart, true);
            this.anchor.addEventListener('drag', this._eventWrappers.drag, true);
            this.anchor.addEventListener('dragend', this._eventWrappers.dragend, true);
        }

        /** Disposes the instance. */
        public dispose() {
            this.anchor.removeEventListener('dragstart', this._eventWrappers.dragstart);
            this.anchor.removeEventListener('drag', this._eventWrappers.drag);
            this.anchor.removeEventListener('dragend', this._eventWrappers.dragend);
        }

        /**
         * Occurs on drag start.
         * @param {object} sender Event sender.
         * @param {object} e Event arguments.
         */
        public onDragStart(sender, e) {
            this.forEach(this.contents, t => {
                if (t.node.get(0) !== this.anchor.node.get(0)) {
                    t.beginMove();
                }
            });
        }

        /**
         * Occurs on drag.
         * @param {object} sender Event sender.
         * @param {object} e Event arguments.
         */
        public onDrag(sender, e) {
            this.forEach(this.contents, t => {
                if (t.node.get(0) !== this.anchor.node.get(0)) {
                    if (!t.initialPosition) {
                        t.initialPosition = t.node.offset();
                    }

                    t.move(t.initialPosition.left + e.positionDelta.left,
                        t.initialPosition.top + e.positionDelta.top);
                }
            });
        }

        /**
         * Occurs on drag end.
         * @param {object} sender Event sender.
         * @param {object} e Event arguments.
         */
        public onDragEnd(sender, e) {
            var mappings = [];

            this.forEach(this.contents, t => {
                mappings[mappings.length] = {
                    node: t.node,
                    position: t.node.get(0) == this.anchor.node.get(0) ?
                    e.position : t.currentPosition
                };

                t.endMove();
            });

            if (mappings.length) {
                this.dispatchEvent('dragend', {
                    result: mappings,
                    originalEvent: e
                });
            }
        }

        /**
         * Invokes the given action for every element in a sequence.
         * @param {Array} arr Sequence.
         * @param {Function} action Action.
         */
        public forEach<T>(arr: T[], action: (item: T) => any) {
            if (arr && arr.length) {
                for (var i = 0; i < arr.length; i++) {
                    action(arr[i]);
                }
            }
        }
    }

    /** Represents a draggable element. */
    export class DraggableElement extends Ifly.EventSource {
        /** Gets or sets the node. */
        public node: JQuery;

        /** Gets or sets the move target. */
        public target: MoveTarget;

        /** 
         * Initializes a new instance of an object.
         * @param {JQuery} node Node to make draggable.
         */
        constructor(node: JQuery) {
            super();

            this.node = node;
            this.target = new MoveTarget(node);

            DraggableElementManager.getCurrent().registerDraggable(this);
        }

        /** 
         * Handles "mousedown" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseDown(e: JQueryEventObject) {
            this.dispatchEvent('draginit', { draggable: this, node: this.node });

            this.target.beginMove(e.clientX, e.clientY);

            this.dispatchEvent('dragstart', { draggable: this, node: this.node });
        }

        /** 
         * Handles "mousemove" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseMove(e: JQueryEventObject) {
            var newPosition = this.target.move(e.clientX, e.clientY);

            if (newPosition) {
                this.dispatchEvent('drag', {
                    draggable: this,
                    position: newPosition, positionDelta: {
                        left: this.target.currentPosition.left - this.target.initialPosition.left,
                        top: this.target.currentPosition.top - this.target.initialPosition.top
                    }, node: this.node
                });
            }

            e.stopPropagation();
        }

        /** 
         * Handles "mouseup" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseUp(e: JQueryEventObject) {
            var result = this.target.endMove();

            if (result) {
                this.dispatchEvent('dragend', {
                    draggable: this,
                    position: result.currentPosition,
                    dragged: result.wasMoved,
                    node: this.node
                });

                e.stopPropagation();
            }
        }
    }

    export class ColorHelper {
        public rgba(color: any, alpha?: number): string {
            var c = this.rgb(color);

            return 'rgba(' +
                c.red + ',' +
                c.green + ',' +
                c.blue + ',' +
                (alpha == null ? 1 : alpha) +
                ')';
        }

        public hex(color: any): string {
            var c = this.rgb(color), padLeft = (n) => {
                return n.length == 2 ? n : '0' + n;
            };

            return '#' + padLeft(c.red.toString(16)) +
                padLeft(c.green.toString(16)) +
                padLeft(c.blue.toString(16));
        }

        public rgb(color: any): any {
            var c = this.parse(color);

            return typeof (c.red) != 'undefined' ? c : (typeof (c.hue) != 'undefined' ?
                this.hsvToRgb(c.hue, c.saturation, c.value) : null);
        }

        public hsv(color: any): any {
            var c = this.parse(color);

            return typeof (c.hue) != 'undefined' ? c : (typeof (c.red) != 'undefined' ?
                this.rgbToHsv(c.red, c.green, c.blue) : null);
        }

        public parse(color: any): any {
            var ret = { type: 'rgb' }, n = '', cur = 0, m = null, components = [],
                props = [['red', 'green', 'blue'], ['hue', 'saturation', 'value']],
                c = (color || '').toString().toLowerCase(), curProp = -1, types = ['rgb', 'hsv'],
                shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i, hex = '', match = null;

            if (color) {
                if (typeof (color.red) != 'undefined') curProp = 0;
                else if (typeof (color.hue) != 'undefined') curProp = 1;
            }

            if (curProp >= 0) {
                for (var p in color) {
                    if (props[curProp].indexOf(p) >= 0) {
                        ret[p] = color[p];
                    }
                }

                ret.type = types[curProp];
            } else {
                if (c.indexOf('#') != 0) {
                    m = new RegExp('\\([^\\)]+\\)', 'gi').exec(c);

                    if (m && m.length) {
                        components = m[0].substr(1, m[0].length - 2).split(',');

                        if (c.indexOf('rgb(') == 0 || c.indexOf('rgba(') == 0) {
                            (<any>ret).red = parseInt(components[0], 10);
                            (<any>ret).green = parseInt(components[1], 10);
                            (<any>ret).blue = parseInt(components[2], 10);

                            if (components.length > 3) {
                                (<any>ret).alpha = parseFloat(components[3]);
                            }
                        } else if (c.indexOf('hsv(') == 0) {
                            ret.type = 'hsv';

                            (<any>ret).hue = parseInt(components[0], 10);
                            (<any>ret).saturation = parseInt(components[1], 10);
                            (<any>ret).value = parseInt(components[2], 10);
                        }
                    }
                } else {
                    hex = c.replace(shorthandRegex, function (m, r, g, b) {
                        return r + r + g + g + b + b;
                    });

                    match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

                    if (match && match.length) {
                        for (var i = 0; i < 3; i++) {
                            ret[props[0][cur++]] = parseInt(match[i + 1], 16);
                        }
                    } else {
                        ret[props[0][0]] = -1;
                        ret[props[0][1]] = -1;
                        ret[props[0][2]] = -1;
                    }
                }
            }

            return ret;
        }

        public shift(color: any, scale: any): any {
            var ret = this.parse(color);

            if (scale) {
                if (typeof (scale) == 'number') {
                    for (var p in ret) {
                        ret[p] = parseInt((ret[p] * scale).toString(), 10);
                    }
                } else {
                    for (var p in scale) {
                        if (typeof (ret[p]) != 'undefined') {
                            ret[p] = parseInt((ret[p] * scale[p]).toString(), 10);
                        }
                    }
                }
            }

            return ret;
        }

        private hsvToRgb(h: number, s: number, v: number) {
            var r, g, b;

            h /= 360, s /= 100, v /= 100;

            var i = Math.floor(h * 6);
            var f = h * 6 - i;
            var p = v * (1 - s);
            var q = v * (1 - f * s);
            var t = v * (1 - (1 - f) * s);

            switch (i % 6) {
                case 0: r = v, g = t, b = p; break;
                case 1: r = q, g = v, b = p; break;
                case 2: r = p, g = v, b = t; break;
                case 3: r = p, g = q, b = v; break;
                case 4: r = t, g = p, b = v; break;
                case 5: r = v, g = p, b = q; break;
            }

            return {
                red: Math.floor(r * 255),
                green: Math.floor(g * 255),
                blue: Math.floor(b * 255)
            };
        }

        private rgbToHsv(r: number, g: number, b: number) {
            var min = Math.min(r, g, b),
                max = Math.max(r, g, b),
                delta = max - min,
                h, s, v = max;

            v = Math.floor(max / 255 * 100);

            if (max != 0) {
                s = Math.floor(delta / max * 100);
            } else {
                h = s = v = 0;
            }

            if (r == max) h = delta > 0 ? ((g - b) / delta) : 0;
            else if (g == max) h = delta > 0 ? (2 + (b - r) / delta) : 0;
            else h = delta > 0 ? (4 + (r - g) / delta) : 0;

            h = Math.floor(h * 60);
            if (h < 0) h += 360;

            return {
                hue: h,
                saturation: s,
                value: v
            };
        }
    }

    export class ElementRenderer {
        public host: Infographic;

        private static _imageLoadPool: any;

        constructor(host: Infographic) {
            this.host = host;

            if (!ElementRenderer._imageLoadPool) {
                ElementRenderer._imageLoadPool = {};
            }
        }

        public render(element: any, node: any): any {
            var ret = node ? $(node) : this.host.slide.find('#' + this.host.getElementId(element)),
                inner = ret.find('.element-inner');

            if (inner.length) {
                switch (element.type) {
                    case 0: { /* Text. */
                        this.renderText(element, inner, ret);
                        break;
                    } case 1: case 2: { /* Slide title & description */
                        this.renderTitleAndDescription(element, inner, ret);
                        break;
                    } case 3: { /* Fact. */
                        this.renderFact(element, inner, ret);
                        break;
                    } case 4: { /* Image. */
                        this.renderImage(element, inner, ret);
                        break;
                    } case 5: { /* Map. */
                        this.renderMap(element, inner, ret);
                        break;
                    } case 6: { /* Chart. */
                        this.renderChart(element, inner, ret);
                        break;
                    } case 7: { /* Table. */
                        this.renderTable(element, inner, ret);
                        break;
                    } case 8: { /* Figure. */
                        this.renderFigure(element, inner, ret);
                        break;
                    } case 9: { /* Line. */
                        this.renderLine(element, inner, ret);
                        break;
                    } case 10: { /* Progress. */
                        this.renderProgress(element, inner, ret);
                        break;
                    } case 11: { /* Callout. */
                        this.renderCallout(element, inner, ret);
                        break;
                    } case 12: { /* Timeline. */
                        this.renderTimeline(element, inner, ret);
                        break;
                    } case 13: { /* Widget. */
                        this.renderWidget(element, inner, ret);
                        break;
                    }
                }
            }

            return ret;
        }

        private renderText(element: any, content: any, container: any) {
            var describeFontSize = (v): string => {
                var result = null;

                if (v == 0) result = 'medium';
                if (v == 1) result = 'small';
                if (v == 2) result = 'extrasmall';
                if (v == 3) result = 'large';
                if (v == 4) result = 'extralarge';

                return result;
            }, describeTextType = (v): string => {
                    var result = null;

                    if (v == 0) result = 'text';
                    if (v == 1) result = 'quote';

                    return result;
                }, quoteSignature = '', text = this.getValue(element, 'text'), val = '',
                textType = parseInt(this.getValue(element, 'textType'), 10),
                width = this.getValue(element, 'width'), actualWidth = null, converted = null;

            converted = Utils.Input.sizeScaleToPercentage(width, TextWidthScale);

            actualWidth = 'auto';

            container.css('max-width', converted > 5 ? (converted + 'vw') : '');

            content.empty();

            container.removeClass('quote-with-signature');

            val = this.getValue(element, 'isRichText') == 'true' ? this.host.javascriptEncode(text) :
            this.host.embedNewLines(text);

            if (textType == 1) {
                content.append($('<span class="quote-text" />').html(val));

                quoteSignature = this.getValue(element, 'signature');

                if (quoteSignature && quoteSignature.length) {
                    container.addClass('quote-with-signature');
                    content.append($('<span class="quote-signature" />').text(quoteSignature));
                }
            } else {
                content.html(val);
            }

            container.removeClass('font-extrasmall font-small font-medium font-large font-extralarge')
                .addClass('font-' + (describeFontSize(parseInt(this.getValue(element, 'fontSize'), 10)) || 'medium'));

            container.removeClass('text-type-text text-type-quote')
                .addClass('text-type-' + (describeTextType(parseInt(this.getValue(element, 'textType'), 10)) || 'text'));

            container.toggleClass('font-bold', this.getValue(element, 'isBold') == 'true');
            container.toggleClass('font-italic', this.getValue(element, 'isItalic') == 'true');
        }

        private renderTitleAndDescription(element: any, content: any, container: any) {
            content.html(this.host.embedNewLines(this.getValue(element, 'text')));
        }

        private renderFact(element: any, content: any, container: any) {
            var c = null;

            content.empty();

            this.ifValue(this.getValue(element, 'icon'), (v) => {
                var iconContainer = $('<span class="fact-primary accent-2" />');

                if (v.indexOf('/') < 0) {
                    iconContainer.append($('<i />').addClass('icon-' + v));
                } else {
                    iconContainer.append($('<div />')
                        .addClass('icon-external')
                        .append($('<img />').attr('src', v)));
                }

                content.append(iconContainer);
            });

            this.ifAnyValue([this.getValue(element, 'quantity'), this.getValue(element, 'measure'), this.getValue(element, 'description')], (v) => {
                c = $('<span class="fact-secondary" />');

                this.ifAnyValue([v[0], v[1]], (v0) => {
                    var colorType = parseInt(this.getValue(element, 'quantityColor'), 10) || 0,
                        t = $('<span class="title accent-background" />').addClass('accent-' + (colorType + 1));

                    this.ifValue(v0[0], (quantity) => {
                        $('<span class="quantity" />').text(quantity).appendTo(t);
                    });

                    this.ifValue(v0[1], (measure) => {
                        $('<span class="measure" />').text(' ' + measure).appendTo(t);
                    });

                    c.append(t);
                });

                this.ifValue(v[2], (description) => {
                    c.append($('<span class="description" />').html(this.host.embedNewLines(description)));
                });

                content.append(c);
            });
        }

        private renderImage(element: any, content: any, container: any) {
            var elm = null, updateWidthAndRotation = null, iconValue = '', isSvg = function () {
                    var n = elm.get(0);
                    return n && (n.tagName || n.nodeName || '').toLowerCase() == 'object';
                }, sourceType = parseInt(this.getValue(element, 'sourceType', '0'), 10),
                describeSourceType = (t) => {
                    var result = 'url';

                    if (t == 1) result = 'gallery';

                    return result;
                },
                isEditorHosted = Ifly.App.getInstance().isEditorHosted();

            updateWidthAndRotation = () => {
                this.ifValue(this.getValue(element, 'width'), (v) => {
                    var actualWith = null, converted = Utils.Input.sizeScaleToPercentage(v, ImageWidthScale);

                    actualWith = 'auto';

                    if (converted > 5) {
                        actualWith = converted + 'vw';
                    }

                    if (!isSvg()) {
                        elm.css(sourceType == 1 && iconValue.indexOf('/') < 0 ? 'font-size' : 'width', actualWith);
                        
                        if (Ifly.App.getInstance().browser.ie && sourceType != 1) {
                            elm.css('height', 'auto');
                        }
                    } else if (actualWith != 'auto') {
                        actualWith = parseInt(<any>(this.host.dimensions.width / 100 * parseInt(actualWith, 10)), 10);
                        elm.attr('width', actualWith + 'px');
                    }
                });

                this.ifValue(this.getValue(element, 'rotationAngle'), (v) => {
                    var converted = parseInt(v, 10),
                        applyTransform = value => {
                            var transforms = ['-webkit-transform', '-ms-transform', '-moz-transform', 'transform'];

                            for (var i = 0; i < transforms.length; i++) {
                                content.css(transforms[i], value);
                            }
                        };

                    if (isNaN(converted) || converted == null || converted < 0) {
                        converted = 0;
                    } else if (converted > 360) {
                        converted = 360;
                    }

                    if (converted != 0) {
                        applyTransform('rotate(' + converted + 'deg)');
                    } else {
                        content.removeAttr('style');
                    }
                });
            };

            content.empty();

            if (sourceType == 1) {
                iconValue = this.getValue(element, 'icon', 'male');

                if (iconValue.indexOf('/') > 0) {
                    elm = $('<div />')
                        .addClass('icon-external')
                        .append($('<img />').attr('src', iconValue));
                } else {
                    elm = $('<div />')
                        .addClass('icon-' + iconValue)
                        .addClass('accent-' + ((parseInt(this.getValue(element, 'iconColor', '1'), 10) || 0) + 1));
                }
            } else {
                elm = $('<img />').attr({ 'alt': '' }).addClass('no-url');

                this.ifValue(this.getValue(element, 'url'), (v) => {
                    var p = null, urlNoCache = isEditorHosted ? (v + (v.indexOf('?') > 0 ? '&' : '?') + 't=' + new Date().getTime()) : v, onLoadImage = () => {
                        if (urlNoCache && urlNoCache.length && urlNoCache.indexOf('://') < 0) {
                            urlNoCache = 'http://' + urlNoCache;
                        }

                        if (v.toLowerCase().indexOf('.svg') > 0) {
                            if (!isSvg()) {
                                p = elm.parent();

                                elm.remove();

                                p.append(elm = $('<object />').attr({
                                    'type': 'image/svg+xml',
                                    'data': urlNoCache
                                }));
                            } else {
                                elm.attr('data', urlNoCache);
                            }

                            updateWidthAndRotation();
                        } else {
                            elm.attr({ 'src': urlNoCache }).removeClass('no-url');
                        }
                    };

                    if (!isEditorHosted) {
                        onLoadImage();
                    } else {
                        if (ElementRenderer._imageLoadPool[v]) {
                            clearTimeout(ElementRenderer._imageLoadPool[v]);
                        }

                        ElementRenderer._imageLoadPool[v] = setTimeout(() => {
                            onLoadImage();
                        }, 100);
                    }
                });
            }

            updateWidthAndRotation();

            container.removeClass('image-source-url image-source-gallery')
                .addClass('image-source-' + describeSourceType(sourceType));

            content.append(elm);
        }

        private renderMap(element: any, content: any, container: any) {
            var map = null, v = null, elm = null, annotations = null, regions = null, color = this.getValue(element, 'color'),
                sz = Utils.Input.sizeScaleToPercentage(this.getValue(element, 'size')), annotationsByColor = null, scale = parseInt(this.getValue(element, 'scale', '0'), 10),
                viewportLeft = parseInt(this.getValue(element, 'viewportLeft', '0'), 10), viewportTop = parseInt(this.getValue(element, 'viewportTop', '0'), 10),
                w = parseInt(<any>(this.host.dimensions.width / 100 * sz), 10),
                h = parseInt(<any>(w / 3 * 2), 10),
                getActualScale = (sc: number) => {
                    var result = 1;

                    if (sc == 1) result = 2;
                    else if (sc == 2) result = 4;

                    return result;
                }, getCenterOffset = (v, sc: number) => {
                    var result = 0.5, factor = 0;

                    if (v) {
                        if (sc == 2) {
                            factor = 0.5;
                        } else if (sc == 4) {
                            factor = 0.6;
                        }

                        v *= factor;

                        result = (0.5 + ((v < 0 ? -1 : 1) * (Math.abs(v) * (0.5 / factor) / 100)));
                    }

                    return result;
                };

            /* Returns the scale. */
            var getScale = (colorClass) => {
                var result = {}, baseColor = null, baseScale = 0.10;

                this.host.queryElementStyle(colorClass, (e) => {
                    baseColor = this.host.color.hsv(e.css('color'));
                });

                for (var i = 0; i <= 4; i++) {
                    result[(4 - i).toString()] = this.host.color.hex(this.host.color.shift(baseColor, {
                        saturation: 1 - (baseScale * i)
                    }));
                }

                return result;
            };

            var describeMapType = (v): string => {
                var result = Ifly.Models.MapType[v];

                if (typeof (result) !== 'undefined' && result !== null) {
                    result = result.toLowerCase();
                } else {
                    result = null;
                }

                return result;
            };

            container.removeClass('map-color-auto map-color-accent1 map-color-accent2 map-color-accent3 map-color-accent4')
                .addClass('map-color-' + (color == null || !color.length || parseInt(color, 10) > 3 ? 'auto' : (color != 'auto' ? ('accent' + (parseInt(color, 10) + 1)) : color)));

            content.empty();

            /* First of all, reading all annotations. */
            annotations = new Ifly.Utils.JsonPlainObjectConverter()
                .convertFromString(this.getValue(element, 'annotations')).annotations;

            annotationsByColor = {};

            /* Next, grouping all annotations by their respective base colors. */
            $.each(annotations, (ii, i) => {
                var baseColorClass = 'accent-' + (parseInt(i.baseColor, 10) + 1);

                if (!annotationsByColor[baseColorClass]) {
                    annotationsByColor[baseColorClass] = [];
                }

                annotationsByColor[baseColorClass].push(i);
            });

            regions = [];

            /* Finally, creating data regions. */
            for (var c in annotationsByColor) {
                if (typeof (annotationsByColor[c]) != 'function') {
                    v = {};

                    /* Creating associative array of values. */
                    $.each(annotationsByColor[c], (ii, i) => {
                        v[(i.areaCode || '').toUpperCase()] = parseFloat(i.density) || 0;
                    });

                    /* Pusing new region (determining the correct color scale as well). */
                    regions.push({
                        values: v,
                        scale: getScale(c),
                        attribute: 'fill'
                    });
                }
            }

            elm = $('<div />').css({
                width: w + 'px',
                height: h + 'px'
            });

            content.append(elm);

            map = new window['jvm'].WorldMap({
                container: elm,
                map: (describeMapType(parseInt(this.getValue(element, 'type'), 10)) || 'usa'),
                series: {
                    regions: regions
                },
                backgroundColor: 'transparent',
                zoomOnScroll: false
            });

            if (scale > 0) {
                scale = getActualScale(scale);
            } else {
                scale = 1;
            }

            var tooltips = [],
                findOverlaps = (tooltip:any): any => {
                    var overlaps = [],
                        targetBounds = null;

                    if (tooltip) {
                        targetBounds = tooltip.rectangle.getBBox();

                        tooltips.forEach((currentTooltip) => {
                            var targetMinX = 0, targetMinY = 0, targetMaxX = 0, targetMaxY = 0,
                                currentBounds = null, currentMinX = 0, currentMinY = 0, currentMaxX = 0,
                                currentMaxY = 0, xOverlap = 0, yOverlap = 0, overlap = 0;

                            if (tooltip !== currentTooltip) {
                                targetMinX = targetBounds.x,
                                targetMinY = targetBounds.y,
                                targetMaxX = targetBounds.x + targetBounds.width,
                                targetMaxY = targetBounds.y + targetBounds.height,
                                currentBounds = currentTooltip.rectangle.getBBox(),
                                currentMinX = currentBounds.x,
                                currentMinY = currentBounds.y,
                                currentMaxX = currentBounds.x + currentBounds.width,
                                currentMaxY = currentBounds.y + currentBounds.height,
                                xOverlap = Math.max(0, Math.min(targetMaxX, currentMaxX) - Math.max(targetMinX, currentMinX)),
                                yOverlap = Math.max(0, Math.min(targetMaxY, currentMaxY) - Math.max(targetMinY, currentMinY)),
                                overlap = xOverlap * yOverlap;

                                if (overlap > 0) {
                                    overlaps.push({
                                        x: xOverlap,
                                        y: yOverlap,
                                    });
                                }
                            }
                        });
                    }

                    return { tooltip: tooltip, overlaps: overlaps };
                },
                resizeTooltip = (target: any) => {
                    var rectBounds = target.tooltip.rectangle.getBBox(),
                        textBounds = target.tooltip.text.getBBox(),
                        triBounds = target.tooltip.triangle.getBBox(),
                        offset = ((t) => {
                            var count = t.overlaps.length + 1,
                                calculate = function (prop) {
                                    var result = 0;
                                    if (t.overlaps.length > 1) {
                                        result = t.overlaps.reduce((previous, current) => {
                                            return previous[prop] + current[prop];
                                        });
                                    } else {
                                        result = t.overlaps[0][prop];
                                    }

                                    return result;
                                },
                                x = calculate('x'),
                                y = calculate('y');

                            return { x: (x / count), y: (y / count) };
                        })(target),
                        targetBounds = ((bounds, offset) => {
                            return {
                                width: bounds.width + offset.x,
                                height: bounds.height + offset.y
                            };
                        })(rectBounds, offset),
                        scale = ((originalBounds, targetBounds, off) => {
                            var original = originalBounds.width * originalBounds.height,
                                target = targetBounds.width * targetBounds.height;

                            return original / target;
                        })(rectBounds, targetBounds, offset),
                        pos = $(target.tooltip.rectangle).offset(),
                        transX = rectBounds.x + rectBounds.width / 2,
                        transY = rectBounds.y + rectBounds.height / 2,
                        applyTransform = (element, scale, transX, transY) => {
                            // god bless stackverflow.com
                            // http://stackoverflow.com/questions/16945951/how-to-scale-the-element-by-keeping-the-fixed-position-in-svg
                            element.setAttribute('transform', 'translate(' + transX + ', ' + transY + ') scale(' + scale + ') translate(' + (-transX) + ', ' + (-transY) + ')');
                        };

                    applyTransform(target.tooltip.rectangle, scale, transX, transY);
                    applyTransform(target.tooltip.text, scale, transX, transY);
                    applyTransform(target.tooltip.triangle, scale, transX, transY);
                };

            $.each(annotations, (ii, i) => {
                if (i.tooltip && i.tooltip.length) {
                    var t = this.addMapTooltip(map, i, scale);

                    if (t) {
                        tooltips.push(t);   
                    }
                }
            });

            $.each($.map(tooltips, findOverlaps), (ii, i) => {
                if (i.overlaps.length) {
                    resizeTooltip(i);
                }
            });

            if (scale > 1) {
                if (isNaN(viewportLeft) || viewportLeft == null) viewportLeft = 0;
                if (isNaN(viewportTop) || viewportTop == null) viewportTop = 0;

                map.setFocus(scale, getCenterOffset(viewportLeft, scale), getCenterOffset(viewportTop, scale));
            }
        }

        private addMapTooltip(map: any, annotation: any, scale: number): any {
            var container = map.container.find('svg g').get(0),
                area = map.container.find('path[data-code="' + annotation.areaCode + '"]').get(0),
                newElement = (name: string): any => document.createElementNS('http://www.w3.org/2000/svg', name),
                xDivider = 2, yDivider = 2;

            if (area) {
                var targetBounds = (b => {
                    return { x: b.x, y: b.y, width: b.width, height: b.height };
                })(area.getBBox()), text = newElement('text');

                text.setAttribute('class', 'map-tooltip-text map-tooltip-scale-' + (scale.toString().replace(/\.,/g, '')));
                text.textContent = annotation.tooltip;

                container.appendChild(text);

                var textBounds = text.getBBox(),
                    rect = newElement('rect');

                // US fix due to its width is equal to container width.
                if (annotation.areaCode.toLowerCase() == 'us') {
                    xDivider = 6;
                    yDivider = 1.5;
                }

                targetBounds.x += (targetBounds.width / xDivider) - (textBounds.width / xDivider);
                targetBounds.y += (targetBounds.height / yDivider) - (textBounds.height / yDivider);

                text.setAttribute('x', targetBounds.x);
                text.setAttribute('y', targetBounds.y);

                textBounds = text.getBBox();

                rect.setAttribute('x', textBounds.x - 10);
                rect.setAttribute('y', textBounds.y - 5);
                rect.setAttribute('width', textBounds.width + 20);
                rect.setAttribute('height', textBounds.height + 10);
                rect.setAttribute('class', 'map-tooltip');

                container.insertBefore(rect, text);

                var rectBounds = rect.getBBox(),
                    triangle = newElement('path'),
                    triangleOffsetX = (rectBounds.width / 2) - (15 / scale),
                    triangleOffsetY = rectBounds.height - (5 / scale);

                triangle.setAttribute('class', 'map-tooltip-callout');
                triangle.setAttribute('d', 'M' +
                    (rectBounds.x + triangleOffsetX) + ' ' +
                    (rectBounds.y + triangleOffsetY) + ' L' +
                    (rectBounds.x + triangleOffsetX + (15 / scale)) + ' ' +
                    (rectBounds.y + triangleOffsetY + (20 / scale)) + ' L' +
                    (rectBounds.x + triangleOffsetX + (30 / scale)) + ' ' +
                    (rectBounds.y + triangleOffsetY) + ' Z');

                container.insertBefore(triangle, rect);

                return {
                    area: area,
                    rectangle: rect,
                    text: text,
                    triangle: triangle
                };
            }
        }

        private renderChart(element: any, content: any, container: any) {
            var sz = Utils.Input.sizeScaleToPercentage(this.getValue(element, 'size')),
                w = parseInt(<any>(this.host.dimensions.width / 100 * sz), 10),
                scaleFont = (s) => {
                    var lb = 0, ub = 0, ordered = [], prev = 100, parsed = 0,
                        result = 1, percent = 0, scale = {
                            10: 0.3,
                            25: 0.5,
                            35: 0.7,
                            50: 1,
                            75: 1.5
                    };

                    if (scale[sz]) {
                        result = scale[sz];
                    } else {
                        for (var p in scale) {
                            parsed = parseInt(p, 10);

                            if (!isNaN(parsed) && parsed > 0) {
                                ordered[ordered.length] = parsed;
                            }
                        }

                        ordered.sort((x, y) => y - x);

                        for (var i = 0; i < ordered.length; i++) {
                            parsed = ordered[i];

                            if (sz > parsed) {
                                lb = parsed;
                                ub = prev;

                                break;
                            }

                            prev = parsed;
                        }

                        if (!ub && !lb) {
                            ub = 10; lb = 0;
                        }

                        percent = 100 * Math.abs(sz - lb) / Math.abs(ub - lb);
                        result = scale[lb] + (Math.abs(scale[ub] - scale[lb]) / 100 * percent);
                    }

                    return parseInt(<any>(s * result), 10);
                },
                h = parseInt(<any>(w / 3 * 2), 10),
                canvas = $('<canvas />').attr({
                    width: w,
                    height: h
                }), chart = null, chartType = null, data = null, labels = [], fontFamily = null, accentColor = '', scaleSteps = 5, scaleStepWidth = 1, scaleMaxColumns = -1, fontContrastColor = '',
                datasets = [], colors = [], chartData = null, chartOptions = null, chartMethods = ['Line', 'Bar', 'Pie', 'Doughnut'], scaleMin = -1, scaleMax = -1, gridColor = '#ddd',
                isEditorHosted = Ifly.App.getInstance().isEditorHosted() || Ifly.App.getInstance().isImageExportRequested(), presentation = Ifly.App.getInstance().getContext().presentation, fontColor = '', fontSizeComputed = 13;

            var chrome = parseInt(this.getValue(element, 'chrome', '0'), 10);

            var nextColor = (i: number, prop: string) => {
                var index = i >= colors.length ? 0 : i;
                return colors[index][prop];
            }, parseNum = (v: string) => {
                return parseFloat((v || '').replace(/\s/g, '').replace(/\,/g, '.')) || 0
            };

            var googleChartProvider = null;

            content.empty().removeAttr('style');

            if (presentation.useCharts == Models.PresentationChartProviderType.chartJS) {
                content.append(canvas);
                chart = new window['Chart']((<any>canvas[0]).getContext('2d'));
            }

            chartType = parseInt(this.getValue(element, 'type', '0'), 10) || 0;

            container.removeClass('chart-provider-chartjs chart-provider-googlecharts')
                .addClass('chart-provider-' + (presentation.useCharts == Models.PresentationChartProviderType.chartJS ? 'chartjs' : 'googlecharts'));

            container.removeClass((ix, cls) => {
                return $.grep((cls || '').split(' '), (c: string) => {
                    return c.toLowerCase().indexOf('chart-type') == 0;
                });
            }).addClass('chart-type-' + Models.ChartType[chartType].toLowerCase());

            this.host.queryElementStyle('type-text', (e) => {
                fontFamily = e.css('font-family');
                fontColor = this.host.color.hex(e.css('color'));
                fontSizeComputed = parseInt((e.css('font-size') || '').replace(/px/g, ''), 10);
            });

            this.host.queryElementStyle('high-contrast', (e) => {
                fontContrastColor = this.host.color.hex(e.css('color'));
            });

            this.host.queryElementStyle('accent-1', (e) => {
                accentColor = e.css('color');
            });

            for (var i = 1, j = 1, k = 0; i <= 12; i++) {
                this.host.queryElementStyle('accent-' + j, (e) => {
                    var c = this.host.color.hsv(e.css('color')),
                        shift = this.host.color.shift(c, { value: 1 - k, saturation: 1 - k });

                    colors.push({
                        stroke: this.host.color.rgba(shift, 1),
                        fill: this.host.color.rgba(shift, chrome == 1 ? 1 : 0.5)
                    });
                });

                if (i % 4 == 0) {
                    j = 1;
                    k += 0.2;
                } else {
                    j++;
                }
            }

            data = new Ifly.Utils.JsonPlainObjectConverter().convertFromString(this.getValue(element, 'data'));

            if (presentation.useCharts == Models.PresentationChartProviderType.googleCharts) {
                content.css({
                    width: w + 'px',
                    height: h + 'px'
                });

                if (data.rows.length > 0 && $.grep(data.rows, (r: any) => { return $.grep(r.cells, (c: any) => { return c.value && c.value.length; }).length > 0; }).length > 0) {
                    googleChartProvider = new Models.Charts.GoogleChartsProvider();

                    googleChartProvider.drawChart({
                        getPropertyValue: (propertyName: string, defaultValue?: string): string => {
                            return this.getValue(element, propertyName, defaultValue);
                        }
                    }, {
                            outer: container,
                            inner: content
                        }, {
                            width: w - 5,
                            height: h - 5,
                            theme: presentation.theme,
                            chartData: data,
                            chartType: chartType,
                            fontFamily: fontFamily,
                            fontColor: fontColor,
                            fontContrastColor: fontContrastColor,
                            gridColor: gridColor,
                            fontSize: scaleFont(fontSizeComputed),
                            legendFontSize: scaleFont(parseInt(<any>(fontSizeComputed / 4 * 3), 10)),
                            accentColor: accentColor,
                            animate: false,
                            noChrome: chrome == 1,
                            getNextColor: (i: number, type: ChartColorType) => {
                                return this.host.color.hex(nextColor(i, ChartColorType[type]));
                            },
                            parseNumber: parseNum
                        });
                }
            } else {
                labels = $.map($.grep(data.columns, (e: any, i) => {
                    return e.name != null && e.name.length > 0;
                }), (e, i) => {
                        return e.name;
                    });

                datasets = $.map($.map(data.rows, (e: any, i) => {
                    return new Array($.map($.grep(e.cells, (e, i) => {
                        return i > 0;
                    }), (e, i) => {
                            return parseNum(e.value);
                        }));
                }), (e, i) => {
                        return {
                            color: nextColor(i, 'stroke'),
                            fillColor: nextColor(i, 'fill'),
                            strokeColor: nextColor(i, 'stroke'),
                            pointColor: nextColor(i, 'stroke'),
                            pointStrokeColor: '#fff',
                            segmentStrokeColor: 'transparent',
                            value: e[0] || 0,
                            data: e
                        };
                    });

                for (var i = 0; i < datasets.length; i++) {
                    if (scaleMaxColumns < 0 || datasets[i].data.length > scaleMaxColumns) {
                        scaleMaxColumns = datasets[i].data.length;
                    }

                    for (var j = 0; j < datasets[i].data.length; j++) {

                        if (scaleMin < 0 || datasets[i].data[j] < scaleMin) {
                            scaleMin = datasets[i].data[j];
                        }

                        if (scaleMax < 0 || datasets[i].data[j] > scaleMax) {
                            scaleMax = datasets[i].data[j];
                        }
                    }
                }

                if (scaleMaxColumns > 0 && scaleMin > 0 && scaleMax > 0) {
                    if (scaleMaxColumns < scaleSteps) {
                        scaleSteps = scaleMaxColumns;
                    }

                    scaleStepWidth = parseInt(<any>(scaleMax / scaleMaxColumns), 10);
                    if (scaleStepWidth <= 0) {
                        scaleStepWidth = 1;
                    }

                    if (scaleMin - scaleStepWidth >= 0) {
                        scaleMin -= scaleStepWidth;
                    }
                } else {
                    scaleMin = 0;
                    scaleStepWidth = 1;
                }

                chartData = {
                    labels: labels,
                    datasets: datasets
                };

                chartOptions = {
                    animation: !isEditorHosted,
                    scaleLineColor: gridColor,
                    scaleGridLineColor: 'transparent',
                    scaleFontFamily: fontFamily,
                    scaleOverride: true,
                    scaleSteps: scaleSteps,
                    scaleStepWidth: scaleStepWidth,
                    scaleStartValue: scaleMin,
                    scaleFontSize: 13,
                    scaleFontColor: accentColor
                };

                chart[chartMethods[chartType]](chartType == 2 || chartType == 3 ?
                    datasets : chartData, chartOptions);
            }
        }

        private renderTable(element: any, content: any, container: any) {
            var data = JSON.parse(this.getValue(element, 'data')), table = null, body = null,
                tr = null, c = null, val = '', isRichText = this.getValue(element, 'isRichText') == 'true';

            content.empty();

            if (data && data.rows && data.rows.length) {
                table = $('<table />').addClass('table');
                tr = $('<tr />');

                for (var i = 0; i < data.columns.length; i++) {
                    c = $('<th />').text(data.columns[i].name);

                    tr.append(c);
                }

                table.append($('<thead />').append(tr));
                body = $('<tbody />');

                for (var i = 0; i < data.rows.length; i++) {
                    tr = $('<tr />');

                    if (!!data.rows[i].mark) {
                        tr.addClass('mark');
                    }

                    tr.addClass('item-' + (i + 1));

                    for (var j = 0; j < data.columns.length; j++) {
                        c = $('<td />');
                        val = data.rows[i].cells[j].value;

                        if (isRichText) {
                            c.html(this.host.javascriptEncode(val));
                        } else {
                            c.text(val);
                        }

                        tr.append(c);
                    }

                    body.append(tr);
                }

                table.append(body);

                content.append(table);
            }
        }

        private renderFigure(element: any, content: any, container: any) {
            var rows = 1, rowSize = 5, icon = this.getValue(element, 'icon', 'male'),
                size = parseInt(this.getValue(element, 'size'), 10) || 5,
                highlightColorType = parseInt(this.getValue(element, 'highlightColor'), 10) || 0,
                highlightItemsTotal = (<any>this.getValue(element, 'highlight'));

            if (highlightItemsTotal && highlightItemsTotal.length) {
                if (highlightItemsTotal.indexOf('%') > 0) {
                    highlightItemsTotal = Math.floor(size * parseInt(highlightItemsTotal.replace(/%/g, ''), 10) / 100);
                    if (highlightItemsTotal > size) {
                        highlightItemsTotal = size;
                    }
                } else {
                    highlightItemsTotal = parseInt(highlightItemsTotal, 10);
                }
            } else {
                highlightItemsTotal = 0;
            }

            content.empty();

            if (size > 10) {
                rows = size / 10;
                rowSize = 10;
            } else if (size > 5) {
                rows = 2;
            }

            for (var i = 0; i < rows; i++) {
                this.renderFigureRow(content, icon, rowSize, highlightItemsTotal, highlightColorType);

                if (highlightItemsTotal > 0) {
                    highlightItemsTotal -= rowSize;
                }
            }
        }

        private renderFigureRow(container: any, icon: string, count: number, highlight: number, highlightColorType: number) {
            var c = $('<ul class="figure-row" />').addClass('figure-row-size-' + count), item = null, n = null;

            for (var i = 0; i < count; i++) {
                item = $('<li />').addClass('figure-row-item-' + (i + 1));

                if (icon.indexOf('/') < 0) {
                    n = $('<i />').addClass('icon-' + icon);
                } else {
                    n = $('<div />')
                        .addClass('icon-external')
                        .append($('<img />').attr('src', icon));
                }

                if (highlight > 0) {
                    item.addClass('figure-row-item-highlight');

                    if (icon.indexOf('/') < 0) {
                        n.addClass('accent-' + (highlightColorType + 1));
                    }

                    highlight--;
                } else {
                    n.addClass('accent-none');
                }

                item.append(n);
                c.append(item);
            }

            container.append(c);
        }

        private renderLine(element: any, content: any, container: any) {
            var type = parseInt(this.getValue(element, 'type'), 10) || 0, elm = null, actualLength = '10vw',
                containers = [content, container], v = Utils.Input.sizeScaleToPercentage(this.getValue(element, 'length'));

            elm = $('<div class="line" />').addClass('line-type-' + Ifly.Models.LineType[type]);

            if (v == 0) {
                actualLength = '10vw';
            } else {
                actualLength = v + 'vw';
            }

            for (var i = 0; i < containers.length; i++) {
                containers[i].css({ width: 'auto', height: 'auto' });
            }

            for (var i = 0; i < containers.length; i++) {
                containers[i].css((type == 0 ? 'width' : 'height'), actualLength)
                    .css((type == 0 ? 'height' : 'width'), 'auto');
            }

            content.empty().append(elm);
        }

        private renderProgress(element: any, content: any, container: any) {
            var bars = [], ul = null, li = null, progressContainer = null, descriptionContainer = null, beneathBar = null, percentage = null, renderedItems = [],
                progressBackground = null, progressFill = null, progressPercentage = null, progressBarPercentage = null, description = null, pixelWidth = 0;

            bars = new Ifly.Utils.JsonPlainObjectConverter()
                .convertFromString(this.getValue(element, 'bars')).bars;

            ul = $('<ul />').addClass('progress-bars');

            for (var i = 0; i < bars.length; i++) {
                li = $('<li />');

                percentage = bars[i].percentage + '%';

                progressContainer = $('<div />').addClass('progress-bar');
                progressBackground = $('<div />').addClass('progress-bar-background');
                progressFill = $('<div />').addClass('progress-bar-fill accent-background accent-' + ((parseInt(bars[i].color, 10) || 0) + 1));
                progressPercentage = $('<span />').addClass('progress-percentage').text(percentage);
                progressBarPercentage = $('<span />').addClass('progress-bar-percentage').text(percentage);

                progressBackground.append(progressFill);
                progressContainer.append(progressBackground);
                progressContainer.append(progressBarPercentage);

                beneathBar = $('<div />').addClass('progress-beneath-bar');
                beneathBar.append(progressPercentage);

                li.append(progressContainer);
                li.append(beneathBar);

                if (bars[i].description && bars[i].description.length) {
                    description = $('<span >').addClass('progress-description').text(bars[i].description);
                    beneathBar.append(description);
                    li.addClass('with-description');
                }

                ul.append(li);

                renderedItems[renderedItems.length] = {
                    fill: progressFill,
                    percentage: progressBarPercentage,
                    percentageValue: bars[i].percentage,
                    background: progressBackground
                };
            }

            content.empty().append(ul);

            setTimeout(() => {
                for (var i = 0; i < renderedItems.length; i++) {
                    pixelWidth = renderedItems[i].background.width() / 100 * parseInt(renderedItems[i].percentageValue, 10);

                    renderedItems[i].fill.css({ 'width': pixelWidth + 'px' });
                    renderedItems[i].percentage.css({ 'left': pixelWidth + 'px' });
                }
            }, 5);
        }

        private renderCallout(element: any, content: any, container: any) {
            var text = this.getValue(element, 'text'), val = null, tailVertical = null, positioners = null, orientation = null,
                tailHorizontal = null, calloutText = null, w = 0, h = 0, cw = 0, ch = 0, cornerOffset = 50;

            orientation = (Ifly.Models.CalloutOrientation[parseInt(this.getValue(element, 'orientation'), 10)] || 'topright').toLowerCase();

            container.removeClass('tail-extrasmall tail-small tail-medium tail-large tail-extralarge')
                .addClass('tail-' + (Ifly.Models.CalloutTailSize[parseInt(this.getValue(element, 'tailSize'), 10)] || 'medium').toLowerCase());

            container.removeClass('orientation-topright orientation-right orientation-bottomright orientation-bottom orientation-bottomleft orientation-left orientation-topleft orientation-top')
                .addClass('orientation-' + orientation);

            val = this.getValue(element, 'isRichText') == 'true' ? this.host.javascriptEncode(text) :
            this.host.embedNewLines(text);

            content.empty();

            tailVertical = $('<div />').addClass('tail tail-vertical');
            tailHorizontal = $('<div />').addClass('tail tail-horizontal');
            calloutText = $('<div />').addClass('callout-text').append($('<span />').addClass('text').html(val));

            content.append(tailVertical);
            content.append(tailHorizontal);
            content.append(calloutText);

            positioners = {
                'topleft': (textWidth, textHeight, containerWidth, containerHeight, horizontalTail, verticalTail, tailCorner, tailCorner2) => {
                    var halfHeight = textHeight / 2, mt = parseInt((getComputedStyle(content.get(0)).marginTop || '').replace(/px/gi, ''), 10);

                    horizontalTail.width(containerWidth - textWidth);
                    verticalTail.height(containerHeight - halfHeight);

                    horizontalTail.css({
                        left: textWidth + 'px',
                        top: halfHeight + 'px'
                    });

                    verticalTail.css({
                        right: 0,
                        bottom: 0
                    });
                },
                'top': (textWidth, textHeight, containerWidth, containerHeight, horizontalTail, verticalTail, tailCorner, tailCorner2) => {
                    verticalTail.height(containerHeight - textHeight)
                        .css({
                            left: (containerWidth / 2) + 'px',
                            top: textHeight + 'px'
                        });

                    horizontalTail.hide();
                },
                'topright': (textWidth, textHeight, containerWidth, containerHeight, horizontalTail, verticalTail, tailCorner, tailCorner2) => {
                    var halfHeight = textHeight / 2, mt = parseInt((getComputedStyle(content.get(0)).marginTop || '').replace(/px/gi, ''), 10);

                    horizontalTail.width(containerWidth - textWidth);
                    verticalTail.height(containerHeight - halfHeight);

                    horizontalTail.css({
                        left: 0,
                        top: halfHeight + 'px'
                    });

                    verticalTail.css({
                        left: 0,
                        bottom: 0
                    });
                },
                'right': (textWidth, textHeight, containerWidth, containerHeight, horizontalTail, verticalTail, tailCorner, tailCorner2) => {
                    var mr = parseInt((getComputedStyle(content.get(0)).marginRight || '').replace(/px/gi, ''), 10);

                    horizontalTail.width(containerWidth - textWidth)
                        .css({
                            top: '50%',
                            right: textWidth + 'px'
                        });

                    verticalTail.hide();
                },
                'bottomright': (textWidth, textHeight, containerWidth, containerHeight, horizontalTail, verticalTail, tailCorner, tailCorner2) => {
                    var halfHeight = textHeight / 2;

                    horizontalTail.width(containerWidth - textWidth);
                    verticalTail.height(containerHeight - halfHeight);

                    horizontalTail.css({
                        right: textWidth + 'px',
                        bottom: halfHeight + 'px'
                    });

                    verticalTail.css({
                        left: 0,
                        top: 0
                    });
                },
                'bottom': (textWidth, textHeight, containerWidth, containerHeight, horizontalTail, verticalTail, tailCorner, tailCorner2) => {
                    verticalTail.height(containerHeight - textHeight)
                        .css({
                            left: (containerWidth / 2) + 'px',
                            bottom: textHeight + 'px'
                        });

                    horizontalTail.hide();
                },
                'bottomleft': (textWidth, textHeight, containerWidth, containerHeight, horizontalTail, verticalTail, tailCorner, tailCorner2) => {
                    var halfHeight = textHeight / 2;

                    horizontalTail.width(containerWidth - textWidth);
                    verticalTail.height(containerHeight - halfHeight);

                    horizontalTail.css({
                        right: 0,
                        bottom: halfHeight + 'px'
                    });

                    verticalTail.css({
                        right: 0,
                        top: 0
                    });
                },
                'left': (textWidth, textHeight, containerWidth, containerHeight, horizontalTail, verticalTail, tailCorner, tailCorner2) => {
                    var ml = parseInt((getComputedStyle(content.get(0)).marginLeft || '').replace(/px/gi, ''), 10);

                    horizontalTail.width(containerWidth - textWidth)
                        .css({
                            top: '50%',
                            left: textWidth + 'px'
                        });

                    verticalTail.hide();
                }
            };

            if (positioners[orientation]) {
                w = calloutText.outerWidth();
                h = calloutText.outerHeight();
                cw = content.outerWidth();
                ch = content.outerHeight();

                if (orientation == 'left' || orientation == 'right') {
                    calloutText.css({
                        marginTop: (-1 * (h / 2)) + 'px'
                    });
                } else if (orientation == 'top' || orientation == 'bottom') {
                    calloutText.css({
                        marginLeft: (-1 * (w / 2)) + 'px'
                    });
                }

                container.find('.element-outer').width(content.outerWidth() + 1 + (orientation == 'left' ?
                    (parseInt((content.css('marginLeft') || '').replace(/px/gi, ''), 10) || 0) : 0));

                positioners[orientation](w, h, cw, ch, tailHorizontal, tailVertical);
            }
        }

        private renderTimeline(element: any, content: any, container: any) {
            var events = $('<ul />').addClass('events'), items = null, eventsSize = Utils.Input.sizeScaleToPercentage(this.getValue(element, 'size', '50'), Ifly.Models.TimelineSizeScale),
                orientation = null, components = [], barColor = 0;

            items = new Ifly.Utils.JsonPlainObjectConverter()
                .convertFromString(this.getValue(element, 'items')).items;

            orientation = parseInt(this.getValue(element, 'orientation'), 10) || 0;
            barColor = parseInt(this.getValue(element, 'barColor'), 10) || 0;

            events.css(Ifly.Models.TimelineOrientation[orientation] === 'vertical' ?
                'height' : 'width', eventsSize + 'vw');

            container.removeClass('orientation-horizontal orientation-vertical')
                .addClass('orientation-' + (Ifly.Models.TimelineOrientation[orientation] || 'horizontal').toLowerCase());

            if (items && items.length) {
                this.renderTimelineItems(items, events, barColor, orientation);
            }

            content.empty().append(events);
        }

        private renderTimelineItems(items: any[], events: JQuery, barColor: number, orientation: number) {
            var i = 0, j = 0, components = [], style = null, event = null, size = 0, totalLabelFigure = 0, index = 0, newRatio = 1,
                remainingPercentage = 100, localSize = 0, localPercentage = 0, autoItems = [], v = null, getValue = o => o ? o.value : null;

            if (items && items.length) {
                totalLabelFigure = getValue(Utils.Input.getInt(items[items.length - 1].label)) -
                getValue(Utils.Input.getInt(items[0].label));

                if (totalLabelFigure > 0) {
                    for (i = 0; i < items.length; i++) {
                        v = Utils.Input.getInt(items[i].size);

                        if (v != null) {
                            remainingPercentage -= v.value;
                        } else {
                            autoItems.push(i);
                        }
                    }

                    if (remainingPercentage < 100) {
                        newRatio = remainingPercentage / 100;
                    }

                    if (autoItems.length && remainingPercentage > 0) {
                        for (i = 0; i < autoItems.length; i++) {
                            index = autoItems[i];

                            if (index == (items.length - 1)) {
                                items[index].size = remainingPercentage;
                            } else {
                                localSize = parseInt(<any>((getValue(Utils.Input.getInt(items[index + 1].label)) -
                                    getValue(Utils.Input.getInt(items[index].label))) * newRatio), 10);

                                localPercentage = parseInt(<any>(localSize * 100 / totalLabelFigure), 10);

                                if (localPercentage > 0) {
                                    items[index].size = localPercentage;
                                    remainingPercentage -= localPercentage;
                                }
                            }
                        }
                    }
                }

                for (i = 0; i < items.length; i++) {
                    components = [];

                    style = parseInt(items[i].style, 10) || 0;
                    size = parseInt(items[i].size, 10) || 0;

                    event = $('<li />').addClass('style-' + (TimelineItemStyle[style] || 'active').toLowerCase())
                        .css(orientation == 0 ? 'width' : 'height', size + '%');

                    event.addClass('item-' + (i + 1));

                    components.push($('<div />').addClass('label').text(items[i].label || ''));
                    components.push($('<div />').addClass('bar accent-' + (barColor + 1) + ' accent-background'));

                    if (items[i].description && items[i].description.length) {
                        event.addClass('with-description');

                        components.push($('<div />').addClass('tail'));
                        components.push($('<div />').addClass('description').append($('<span />').addClass('description-inner').text(items[i].description)));
                    }

                    if (orientation == 0) {
                        components = components.reverse();
                    }

                    event.append(components);

                    events.append(event);
                }
            }
        }

        private renderWidget(element: any, content: any, container: any) {
            var err = null, widget = null, doc = content.get(0).ownerDocument,
                isEditorHosted = Ifly.App.getInstance().isEditorHosted();

            content.empty();

            if (isEditorHosted || Ifly.Models.Embed.Player.getInstance().unsafeContentWarning.previousResponse ==
                Ifly.Models.Embed.UnsafeContentWarningUserResponse.proceed || Ifly.Models.Embed.Player.getInstance().isSignedWidget(element)) {

                widget = new Widget(this.getValue(element, 'code'));

                try {
                    widget.compile();
                    widget.render(content, doc, doc.defaultView);
                } catch (e) {
                    content.append($('<div />').addClass('widget-error').text('Error: ' + e.toString()));
                }
            }
        }

        private getValue(element: any, propertyName: string, defaultValue?: string): string {
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

        private ifValue(value: string, callback: Function) {
            if (value && value.length) {
                callback.call(this, value);
            }
        }

        private ifAnyValue(values: string[], callback: Function) {
            for (var i = 0; i < values.length; i++) {
                if (values[i] && values[i].length) {
                    callback.call(this, values);
                    break;
                }
            }
        }

    }

    export class Infographic {
        public container: any;

        public slide: any;

        public dimensions: any;

        public color: ColorHelper;
        public indicator: ElementIndicator;

        private _callbacks: any;
        private _initialized: boolean;
        private _callbackThrottling: any;
        private _defaultThrottlingValue: number;
        private _elementState: any[];

        constructor(container) {
            this._callbacks = {};
            this._callbackThrottling = {};
            this._defaultThrottlingValue = 50;
            this._elementState = [];

            this.color = new ColorHelper();
            this.indicator = new ElementIndicator(this);

            this.container = $(container);

            this.slide = this.container.hasClass('slide') ?
            this.container : this.container.find('.slide');

            this.initialize();
        }

        public initialize() {
            var getInitialDimensions = (remaining: number) => {
                this.recalculateDimensions();

                if (this.dimensions.width <= 0 && remaining > 0) {
                    setTimeout(() => {
                        getInitialDimensions(remaining - 1);
                    }, 10);
                }
            }, containerWindow = this.container.length ? this.container.get(0).ownerDocument.defaultView : null,
                containerWindowjQuery = null;

            if (!this._initialized) {
                $(window).resize(() => {
                    this.dispatchEventInternal('dimensionsChanged', {},
                        this._defaultThrottlingValue, () => { this.recalculateDimensions(); });
                });

                getInitialDimensions(10);

                if (containerWindow && containerWindow !== window && !Ifly.App.getInstance().isEditorHosted()) {
                    containerWindowjQuery = containerWindow['$'];

                    containerWindowjQuery(containerWindow).unbind('.propagate')
                        .bind('keydown.propagate', e => {
                            $(window).trigger(e);
                        });
                }
                

                this._initialized = true;
            }
        }

        public addEventListener(eventName: string, callback: Function) {
            var evt = (eventName || '').toLowerCase();

            if (callback) {
                if (!this._callbacks[evt]) {
                    this._callbacks[evt] = [];
                }

                this._callbacks[evt].push(callback);
            }
        }

        public dispatchEvent(eventName: string, args?: any) {
            this.dispatchEventInternal(eventName, args);
        }

        private dispatchEventInternal(eventName: string, args?: any, threshold?: number, dispatching?: Function) {
            var evt = (eventName || '').toLowerCase(), e = args || {};

            var doDispatch = () => {
                if (dispatching) {
                    dispatching();
                }

                if (this._callbacks[evt]) {
                    for (var i = 0; i < this._callbacks[evt].length; i++) {
                        this._callbacks[evt][i].apply(this, [e]);
                    }
                }
            };

            if (!threshold || threshold <= 0) {
                doDispatch();
            } else {
                if (this._callbackThrottling[evt]) {
                    clearTimeout(this._callbackThrottling[evt]);
                }

                this._callbackThrottling[evt] = setTimeout(() => {
                    this._callbackThrottling[evt] = null;
                    doDispatch();
                }, threshold);
            }
        }

        public clear() {
            this.slide.find('li.stack-item').remove();
            this.slide.find('.element-dragged').remove();
            this.slide.removeAttr('data-slideid');

            this.forgetAllElements();
        }

        public refresh() {
            this.recalculateDimensions();
            this.refreshAllElements();
        }

        /**
         * Applies the given theme to the composition.
         * @param {string} theme Theme to apply. If omitted, the current theme is cleared.
         * @param {object} target An element (or an array of elements) indicating where to apply (or clear) the given theme.
         */
        public applyTheme(theme?: string, target?: any) {
            var container = null, hasAppliedTheme = false,
                containers = $.isArray(target) ? target : [target || this.slide];

            for (var i = 0; i < containers.length; i++) {
                container = $(containers[i]).removeClass((i, c) => {
                    return $.grep((c || '').split(' '), (cn: string) => {
                        return cn.indexOf('theme-') == 0;
                    }).join(' ');
                });

                if (theme && theme.length && !container.hasClass('theme-' + theme)) {
                    container.addClass('theme-' + theme);
                    hasAppliedTheme = true;
                }
            }

            if (hasAppliedTheme) {
                /* Notifying all subscribers that the theme has changed */
                this.dispatchEventInternal('themeChanged', { theme: theme, target: target }, this._defaultThrottlingValue);
            }
        }

        /**
         * Applies the given background image to the composition.
         * @param {string} image Background image to apply. If omitted, the image is cleared.
         * @param {object} target An element (or an array of elements) indicating where to apply (or clear) the given background image.
         */
        public applyBackgroundImage(image?: string, theme?: string, target?: any) {
            var themePrefix = 'theme-',
                cssClassList = [],
                cssSelector = '',
                container = null,
                overrideId = '',
                override = null,
                tagName = '',
                containers = $.isArray(target) ? target : [target || this.slide];

            if (!theme) {
                for (var i = 0; i < containers.length; i++) {
                    container = $(containers[i]);

                    cssClassList = $.grep((container.attr('class') || '').split(' '), (e: string) => {
                        return e.indexOf(themePrefix) == 0;
                    });

                    if (cssClassList.length) {
                        theme = cssClassList[0].substr(themePrefix.length);
                        break;
                    }
                }
            }

            for (var i = 0; i < containers.length; i++) {
                ((c) => {
                    overrideId = 'bg-image-override' + i;

                    override = new StyleOverride(() => c);
                    override.removeOverride(overrideId);

                    if (image && image.length && theme && theme.length) {
                        tagName = (c.get(0).tagName || c.get(0).nodeName || '').toLowerCase();
                        cssSelector = tagName + '.theme-' + theme;

                        if (Ifly.App.getInstance().isEditorHosted() && tagName == 'body') {
                            cssSelector += ' .canvas-container';
                            c = c.find('.canvas-container');

                            override = new StyleOverride(() => c);
                        }

                        override.addOverride(cssSelector + ' { ' +
                            'background: ' + (i > 0 ? 'transparent' : ('url(' + image + (image.indexOf('?') > 0 ? '&' : '?') + 't=' + new Date().getTime() + ') center center no-repeat')) + ' !important; ' +
                            'background-size: cover !important; ' +
                            '}', overrideId);
                    }
                })($(containers[i]));
            }
        }

        public ensureElement(element: any, node?: any, initializer?: Function, options?: any): any {
            var ret = node ? $(node) : this.slide.find('#' + this.getElementId(element)), o = options || {},
                isNew = false, draggable = null;

            if (!ret.length) {
                ret = $('<div class="element" tabindex="0">' +
                    '<div class="element-outer">' +
                    '<div class="element-inner"></div>' +
                    '</div></div>').addClass('type-' + Ifly.Models.ElementType[element.type]);

                /* If either title or description, putting an indication of that. */
                if (element.type == 1 || element.type == 2) {
                    ret.addClass('type-meta');
                }

                ret.hover(e => {
                    var currentlyActive = this.slide.find('.element.element-over');

                    if (currentlyActive.attr('id') != ret.attr('id')) {
                        currentlyActive.removeClass('element-over');
                    }

                    ret.addClass('element-over');
                }, e => {
                        ret.removeClass('element-over');
                    });

                if (initializer) {
                    initializer.apply(window, [ret, element]);
                }

                isNew = true;
            }

            this.updateElementId(element, ret);
            this.updateElementPosition(element, ret, !!o.alwaysOnTop);
            this.updateElementProperties(element, ret);

            /* Remembering this element. */
            this.rememberElement(ret, Array.prototype.slice.call(arguments, 0));

            /* Making element draggable. */
            if (o.draggable) {
                if (isNew) {
                    draggable = new DraggableElement(<JQuery>ret);

                    if (o.draggable.init) draggable.addEventListener('draginit', o.draggable.init);
                    if (o.draggable.start) draggable.addEventListener('dragstart', o.draggable.start);
                    if (o.draggable.drag) draggable.addEventListener('drag', o.draggable.drag);
                    if (o.draggable.end) draggable.addEventListener('dragend', o.draggable.end);
                } else {
                    DraggableElementManager.getCurrent().makeContentDraggable(<JQuery>ret);
                }
            }

            return ret;
        }

        public updateElementId(element: any, node: any): any {
            var id = parseInt(this.slide.attr('data-slideid'), 10);

            if (id != element.slideId) {
                this.slide.attr('data-slideid', element.slideId);
            }

            return $(node)
                .attr('id', this.getElementId(element))
                .attr('data-elementid', element.id)
                .attr('data-slideid', element.slideId)
                .attr('data-order', element.order);
        }

        public updateElementElevation(element: any, node?: any): any {
            var ret = node ? $(node) : this.slide.find('#' + this.getElementId(element)),
                position = this.getPosition(element.position);

            ret.removeClass((i, css) => {
                var remove = [], classes = (css || '').split(' ');

                for (var idx = 0; idx < classes.length; idx++) {
                    if ((classes[idx] || '').toLowerCase().indexOf('element-elevation-') == 0) {
                        remove[remove.length] = classes[idx];
                    }
                }

                return remove.join(' ');
            }).removeClass('element-has-elevation');

            if (position == 'free') {
                ret.addClass('element-elevation-' + parseInt(element.elevation, 10))
                    .addClass('element-has-elevation');
            }

            return ret;
        }

        public updateElementPosition(element: any, node?: any, alwaysOnTop?: boolean): any {
            var ret = node ? $(node) : this.slide.find('#' + this.getElementId(element)), p = null, children = [], insertLineBreak = false, lastMeta = null,
                sp = null, newStack = null, position = this.getPosition(element.position), stack = ret.parents('.stack'), next = null, prev = null, ratioX = 0, ratioY = 0;

            var getParent = (parent, contents) => {
                if (!parent.length || parent.find('.element').length > 1) {
                    parent = $('<li />').addClass('stack-item').append(contents);
                }

                return parent;
            };

            /** Returns a tag name of a given DOM element. */
            var tag = (e) => (e.tagName || e.nodeName || '').toLowerCase();

            var getPreviousAccordingToOrder = (c) => {
                var result = null, elms = c.find('.element:not(.type-meta)'), indexes = [];

                indexes = $.map(elms, (e, i) => {
                    return {
                        index: i,
                        order: parseInt($(e).attr('data-order'), 10)
                    };
                }).sort((x, y) => x.order - y.order);

                if (indexes.length) {
                    for (var i = 0; i < indexes.length; i++) {
                        if (indexes[i].order >= element.order) {
                            break;
                        }

                        result = elms[indexes[i].index];
                    }
                }

                if (c.hasClass('stack') && result) {
                    result = $(result).parents('.stack-item').get(0);
                }

                return result;
            };

            if (position == 'free') {
                this.updateElementElevation(element, ret);

                /* Inserting onto the slide. */
                if (!ret.parents('.slide').length) {
                    this.slide.prepend(ret);
                }

                ret.addClass('element-dragged');

                if (element.offset.viewport && element.offset.viewport.width) {
                    /* Calculating element's position based on current and recorded (snapshot) viewport. */
                    ratioX = this.dimensions.width / element.offset.viewport.width;
                    ratioY = this.dimensions.height / element.offset.viewport.height;

                    ret.css({
                        left: parseInt(<any>(element.offset.left * ratioX), 10) + 'px',
                        top: parseInt(<any>(element.offset.top * ratioY), 10) + 'px'
                    });
                } else {
                    /* No viewport data - expressing as vw/vh (legacy, probably not needed). */
                    ret.css({
                        left: element.offset.left + 'vw',
                        top: element.offset.top + 'vh'
                    });
                }
            } else {
                /* Removing any draggable attributes (e.g. "position: fixed") from the element - it's bound to the stack. */
                DraggableElementManager.getCurrent().destroyDraggable(ret, true);

                p = ret.parents('li.stack-item');
                newStack = this.slide.find('.stack-' + position);

                if (position == 'left' || position == 'right' || position == 'center') {
                    if (!stack.hasClass('stack-' + position)) {
                        /* For "left", "right" and "center", we only have one <li /> which contains all elements.
                           This is to achieve stacking with vertical alignment. */
                        sp = newStack.find('li.stack-item');

                        if (!sp.length) {
                            newStack.append(getParent(p, ret));
                        } else {
                            prev = getPreviousAccordingToOrder(sp);

                            if (prev) {
                                ret.insertAfter(prev);
                            } else {
                                ret.prependTo(sp);
                            }

                            /* Line break to stack centered elements properly. */
                            if (position != 'center') {
                                next = ret.next();
                                prev = next.prev();

                                if (prev.length && tag(prev[0]) != 'br') {
                                    $('<br />').insertBefore(ret);
                                }

                                if (next.length && tag(next[0]) != 'br') {
                                    $('<br />').insertAfter(ret);
                                }
                            }

                            /* Removing the empty <li /> node */
                            if (!p.children().length) {
                                p.remove();
                            }
                        }
                    }
                } else {
                    p = getParent(p, ret);

                    if (!stack.hasClass('stack-' + position)) {
                        if (alwaysOnTop) {
                            p.prependTo(newStack);

                            if (ret.hasClass('type-meta')) {
                                p.addClass('stack-meta');
                            }
                        } else {
                            prev = getPreviousAccordingToOrder(newStack);

                            if (prev) {
                                p.insertAfter(prev);
                            } else {
                                lastMeta = newStack.find('.type-meta');
                                if (lastMeta && lastMeta.length) {
                                    p.insertAfter($(lastMeta[lastMeta.length - 1]).parents('li.stack-item'));
                                } else {
                                    p.prependTo(newStack);
                                }
                            }
                        }
                    } else if (alwaysOnTop) {
                        /* Yet still updating - refreshing "Always on top" state relative to new elements. */
                        p.prependTo(newStack);
                    }
                }

                /* Removing the line break */
                if (stack.hasClass('stack-center') || stack.hasClass('stack-left') || stack.hasClass('stack-right')) {
                    children = stack.find('li.stack-item').children();

                    if (children && children.length) {
                        if (children[0].tagName.toLowerCase() == 'br') $(children[0]).remove();
                        if (children[children.length - 1].tagName.toLowerCase() == 'br') $(children[children.length - 1]).remove();
                    }
                }
            }

            if (!ret.hasClass('element-visible')) {
                setTimeout(() => {
                    ret.addClass('element-visible');
                }, 50);
            }

            /* Cleaning stacks (removing redundant line breaks). */
            this.cleanStacks();

            /* Notifying all subscribers that layout has changed */
            this.dispatchEventInternal('layoutChanged', {}, this._defaultThrottlingValue);

            return ret;
        }

        /**
         * Returns element node.
         * @param {number} id Element Id.
         */
        public findElement(id: number): Node {
            return this.slide.find('.element[data-elementid="' + id + '"]');
        }

        /** 
         * Updates the properties of a given element.
         * @param {object} element Element whose properties to update.
         * @param {object} node A reference to a DOM node associated with the given element on the canvas.
         * @returns {object} A reference to a DOM node associated with the given element on the canvas.
         */
        public updateElementProperties(element: any, node?: any): any {
            return new ElementRenderer(this).render(element, node);
        }

        /**
         * Moves the given element up or down the current stack.
         * @param {object} element Element to move.
         * @param {number} delta A number indicating in which direction to move the element (greater than zero means moving down whereas less than zero means moving up).
         * @returns {object} An object with two fields, "first" and "second" with values set to the new first and the second element Ids respectively.
         */
        public moveElement(element: any, delta: number): any {
            var ret = { first: { id: -1, order: -1 }, second: { id: -1, order: -1 } }, node = this.slide.find('#' + this.getElementId(element)), br = null,
                pos = this.getPosition(element.position), ref = null, prev = null, next = null;

            /* Skips <br /> tags when resolving previous/next sibling. */
            var skipLineBreak = (e, skip: Function) => {
                var result = e;

                if (result.length && result[0].tagName.toLowerCase() == 'br') {
                    result = skip(result);
                }

                return result;
            };

            var getElementId = e => parseInt((e.hasClass('stack-item') ? e.find('.element') : e).attr('data-elementid'), 10);
            var getElementOrder = e => parseInt((e.hasClass('stack-item') ? e.find('.element') : e).attr('data-order'), 10);
            var getElementIdAndOrder = e => { return ((elm) => { return { id: parseInt(elm.attr('data-elementid'), 10), order: parseInt(elm.attr('data-order'), 10) }; })(e.hasClass('stack-item') ? e.find('.element') : e); };
            var exchangeOrder = (r1, r2, e1, e2) => { var tmp = r1.order; r1.order = r2.order; r2.order = tmp; e1.attr('data-order', r1.order); e2.attr('data-order', r2.order); };

            ref = (pos == 'left' || pos == 'right' || pos == 'center') ? node : node.parent();

            prev = skipLineBreak(ref.prev(), (e) => { return e.prev(); });
            next = skipLineBreak(ref.next(), (e) => { return e.next(); });

            /* Getting the reference to a line break element if moving within the center stack. */
            if (pos == 'left' || pos == 'right' || pos == 'center') {
                br = delta < 0 ? ref.prev('br') : ref.next('br');
            }

            if (delta < 0 && prev && prev.length) {
                /* Preventing to move above title and description */
                if (!prev.find('.type-title, .type-description').length) {
                    ret.first = getElementIdAndOrder(ref);
                    ret.second = getElementIdAndOrder(prev);

                    exchangeOrder(ret.first, ret.second, ref, prev);

                    ref.insertBefore(prev);

                    /* Preserving line break. */
                    if (br && br.length) {
                        br.insertAfter(ref);
                    }
                }
            } else if (delta > 0 && next && next.length) {
                ret.first = getElementIdAndOrder(next);
                ret.second = getElementIdAndOrder(ref);

                exchangeOrder(ret.first, ret.second, next, ref);

                ref.insertAfter(next);

                /* Preserving line break. */
                if (br && br.length) {
                    br.insertBefore(ref);
                }
            }

            /* Cleaning stacks (removing redundant line breaks). */
            this.cleanStacks();

            /* Notifying all subscribers that layout has changed */
            this.dispatchEventInternal('layoutChanged', {}, this._defaultThrottlingValue);

            return ret;
        }

        /** Removes redundant <br /> tags from the stacks that have them. */
        private cleanStacks() {
            Infographic.cleanSlideStacks(this.slide);
        }

        /**
         * Removes redundant <br /> tags from the stacks that have them.
         * @param {JQuery} container Slide container.
         */
        public static cleanSlideStacks(container: JQuery) {
            var stacksWithLineBreaks = ['left', 'right'], stackContents = null,
                prev = '', cur = '', tag = (e) => (e.tagName || e.nodeName || '').toLowerCase();

            for (var i = 0; i < stacksWithLineBreaks.length; i++) {
                stackContents = container.find('.stack-' + stacksWithLineBreaks[i] + ' li.stack-item > *');

                prev = '', cur = '';

                if (stackContents.length) {
                    for (var j = 0; j < stackContents.length; j++) {
                        cur = tag(stackContents[j]);

                        if (cur == 'br' && (!prev.length || prev == 'br')) {
                            $(stackContents[j]).remove();
                        }

                        prev = cur;
                    }

                    if (prev == 'br') {
                        $(stackContents[stackContents.length - 1]).remove();
                    }
                }
            }
        }

        public getPreviousElement(element: any) {
            var ret = null, node = this.getNode(element), stack = null;

            if (node) {
                stack = node.parents('.stack');

                /* For "left", "right" and "center" we only have one <li /> element. */
                if (stack.hasClass('stack-left') || stack.hasClass('stack-right') || stack.hasClass('stack-center')) {
                    ret = node.prevAll('.element');
                } else {
                    ret = node.parents('li.stack-item')
                        .prev('li.stack-item')
                        .find('.element');
                }

                if (ret && ret.length) {
                    ret = $(ret[0]);
                }
            }

            return ret;
        }

        public getNextElement(element: any) {
            var ret = null, node = this.getNode(element), stack = null;

            if (node) {
                stack = node.parents('.stack');

                /* For "left", "right" and "center" we only have one <li /> element. */
                if (stack.hasClass('stack-left') || stack.hasClass('stack-right') || stack.hasClass('stack-center')) {
                    ret = node.nextAll('.element');
                } else {
                    ret = node.parents('li.stack-item')
                        .next('li.stack-item')
                        .find('.element');
                }

                if (ret && ret.length) {
                    ret = $(ret[0]);
                }
            }

            return ret;
        }

        public hasPreviousElement(element: any, filter?: any): boolean {
            var prev = this.getPreviousElement(element);
            return prev != null && prev.length > 0 && (filter == null || filter(prev));
        }

        public hasNextElement(element: any, filter?: any): boolean {
            var next = this.getNextElement(element);
            return next != null && next.length > 0 && (filter == null || filter(next));
        }

        public selectElements(selector?: any, processor?: any): any[] {
            var ret = [];

            if (!selector) {
                selector = (e) => { return true; };
            }

            this.slide.find('.element').each((i, e) => {
                var elm = $(e);

                if (selector(elm)) {
                    ret.push(elm);

                    if ($.isFunction(processor)) {
                        processor(elm);
                    }
                }
            });

            return ret;
        }

        public removeElements(selector?: any, indicate?: boolean): any[] {
            var self = this, queue = [], ret = this.selectElements(selector, e => {
                queue.push(function (callback) {
                    var onIndicated = function () {
                        var stack = e.parents('.stack');

                        /* For "left", "right" and "center" we only have one <li /> element. */
                        if (stack.length && (!stack.hasClass('stack-left') && !stack.hasClass('stack-right') && !stack.hasClass('stack-center'))) {
                            /* Removing the associated stack item. */
                            e.parents('li.stack-item').remove();
                        } else {
                            /* Removing an element within the only stack item. */
                            e.remove();
                        }

                        self.forgetElement(e[0]);

                        callback();
                    };

                    if (indicate) {
                        self.indicator.fadeOut(parseInt(e.attr('data-elementid'), 10), onIndicated);
                    } else {
                        onIndicated();
                    }
                });
            });

            this.processAsyncQueue(queue, () => {
                /* Cleaning stacks (removing redundant line breaks). */
                this.cleanStacks();

                /* Notifying all subscribers that layout has changed */
                this.dispatchEventInternal('layoutChanged', {}, this._defaultThrottlingValue);
            });

            return ret;
        }

        private processAsyncQueue(queue: any[], complete: Function) {
            var tasks = [], nextTask = null;

            for (var i = 0; i < queue.length; i++) {
                tasks[tasks.length] = queue[i];
            }

            nextTask = function () {
                var task = tasks.splice(0, 1)[0];

                if (task) {
                    task(nextTask);
                } else {
                    complete();
                }
            };

            nextTask();
        }

        private getNode(element: any) {
            var ret = null;

            if (element) {
                if (typeof (element.append) == 'function' || (element.length &&
                    typeof (element[0].appendChild) == 'function')) {

                    ret = $(element);
                } else {
                    ret = this.slide.find('#' + this.getElementId(element));
                }
            }

            return ret;
        }

        public getElementId(element: any): string {
            return element.slideId + '_' + element.id;
        }

        private getPosition(descriptor): string {
            var ret = 'top';

            if (typeof (descriptor) == 'string') {
                ret = descriptor.toLowerCase();
            } else {
                if (descriptor == 1) {
                    ret = 'left';
                } else if (descriptor == 2) {
                    ret = 'right';
                } else if (descriptor == 3) {
                    ret = 'bottom';
                } else if (descriptor == 4) {
                    ret = 'center';
                } else if (descriptor == 5) {
                    ret = 'free';
                }
            }

            return ret;
        }

        public javascriptEncode(text: string): string {
            var ret = text || '';

            ret = ret.replace(/<script/gi, '&lt;script');
            ret = ret.replace(/<\/script>/gi, '&lt;/script&gt;');

            return ret;
        }

        public embedNewLines(text: string): string {
            var ret = text || '', o = [], lines = [],
                temp = $(document.createElement('div'));

            if (ret.indexOf('\n') >= 0) {
                lines = ret.split(/\n/g);

                for (var i = 0; i < lines.length; i++) {
                    o.push(temp.text(lines[i]).html());
                }

                ret = o.join('<br />');
            } else {
                ret = temp.text(ret).html();
            }

            return ret;
        }

        public queryElementStyle(cssClass: string, elementReady: Function) {
            var elm = $('<div />')
                .addClass('invisible')
                .addClass(cssClass)
                .appendTo(this.slide);

            elementReady(elm);

            elm.remove();
        }

        private rememberElement(node: any, options: any[]): any {
            var found = false, n = this.unwrapNode(node),
                ret = { node: null, options: null };

            if (n) {
                ret.node = n;
                ret.options = options;

                /* Second parameter is a DOM node, keeping it up-to-date. */
                if ((<any[]>ret.options).length > 1) {
                    ret.options[1] = n;
                }

                for (var i = 0; i < this._elementState.length; i++) {
                    if (this._elementState[i].node == n) {
                        this._elementState[i].options = options;

                        found = true;

                        break;
                    }
                }

                if (!found) {
                    this._elementState.push(ret);
                }
            }
        }

        private recallElement(node: any): any {
            var n = this.unwrapNode(node), ret = { node: null, options: null };

            if (n) {
                for (var i = 0; i < this._elementState.length; i++) {
                    if (this._elementState[i].node == n) {
                        ret = this._elementState[i];

                        break;
                    }
                }
            }

            return ret;
        }

        private refreshElement(node) {
            var e = this.recallElement(node);

            if (e.node && e.options) {
                this.ensureElement.apply(this, e.options);
            }
        }

        private refreshAllElements() {
            for (var i = 0; i < this._elementState.length; i++) {
                this.refreshElement(this._elementState[i].node);
            }
        }

        private forgetElement(node: any): any {
            var modified = [], n = this.unwrapNode(node),
                ret = { node: null, options: null };

            if (n) {
                for (var i = 0; i < this._elementState.length; i++) {
                    if (this._elementState[i].node != n) {
                        modified.push(this._elementState[i]);
                    } else {
                        ret = this._elementState[i];
                    }
                }

                this._elementState = modified;
            }

            return ret;
        }

        public getAllRememberedElements(): any[] {
            return this._elementState;
        }

        /** Returns the dimensions of the given infographic. */
        public getViewportParameters(): any {
            var gap = !this.slide.hasClass('publish') ? 10 : 0, parent = this.slide.parent(),
                getInt = (v) => parseInt(v.toString(), 10), pw = parent.width() - gap,
                ph = parent.height() - gap, w = pw, h = getInt(w / 5 * 3), ret = {
                    gap: 0,
                    width: 0,
                    height: 0,
                    parentWidth: 0,
                    parentHeight: 0
                };

            if (h > ph) {
                h = ph - gap;
                w = getInt(h * 5 / 3);
            }

            ret.gap = gap;
            ret.width = w;
            ret.height = h;
            ret.parentWidth = pw;
            ret.parentHeight = ph;

            return ret;
        }

        private recalculateDimensions() {
            var viewport = this.getViewportParameters(),
                getInt = (v) => parseInt(v.toString(), 10), marginLeft = 0, marginTop = 0;

            this.dimensions = {
                width: viewport.width,
                height: viewport.height,
                offsetLeft: 0,
                offsetTop: 0
            };

            marginTop = getInt((viewport.parentHeight - viewport.height) / 2) + (viewport.gap / 2);
            marginLeft = getInt((viewport.parentWidth - viewport.width) / 2) + (viewport.gap / 2);

            this.dimensions.offsetLeft = marginLeft;
            this.dimensions.offsetTop = marginTop;

            this.slide.css({
                width: viewport.width + 'px',
                height: viewport.height + 'px',
                marginTop: marginTop + 'px',
                marginLeft: marginLeft + 'px'
            });
        }

        private forgetAllElements() {
            this._elementState = [];
        }

        private unwrapNode(node: any): any {
            return node ? (typeof (node.length) != 'undefined' ? (node.length > 0 ? node[0] : null) : node) : null;
        }
    }
}