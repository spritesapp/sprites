/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="Component.ts" />
/// <reference path="../Embed/Infographic.ts" />
/// <reference path="ElementLinkModal.ts" />

module Ifly.Models.UI {
    /** Represents element manget manager (allows for overlapping elements to be brought to front). */
    export class ElementMagnetManager {
        /** Gets or sets the owning composition manager. */
        public composition: CompositionManager;

        /** Gets or sets the offset of the slide container. */
        private _containerOffset: any;

        /**
         * Initializes a new instance of an object.
         * @param {CompositionManager} composition Owning composition manager.
         */
        constructor(composition: CompositionManager) {
            this.composition = composition;
        }

        /** Initializes the magnet. */
        public initialize() {
            var reset = null,
                isCtrl = false,
                onMouseMove = null,
                onMouseDown = null,
                elementPositions = [],
                newBottomElement = null,
                bindSpecialElements = null,
                currentBottomElement = null,
                isMagnetCursorReset = false,
                keys = { ctrl: 17, cmd: 91 },
                mac = Ifly.App.getInstance().browser.mac,
                slideWindow = this.composition.host ? this.composition.host.get(0).defaultView : null,

                watchKeyDownTargets = [
                    window,
                    slideWindow
                ];

            /**
             * Resets the view.
             */
            reset = () => {
                var $slide = $(this.composition.infographic.slide);

                watchKeyDownTargets.forEach(wnd => {
                    $(wnd.document.body).removeClass('cursor-magnet');
                });

                $slide.find('.element-magnet-hover').removeClass('element-magnet-hover');
                $slide.find('svg, iframe').off('.magnet');

                isMagnetCursorReset = true;
                currentBottomElement = null;
            };

            /**
             * Occurs when mouse is being moved.
             * @param {object} e Event.
             */
            onMouseMove = (e: any) => {
                if (isCtrl) {
                    /* Getting the bottom-most element that is currently under the cursor. */
                    newBottomElement = this.getBottomElement(e.clientX, e.clientY, elementPositions);

                    if (newBottomElement) {
                        if (currentBottomElement && currentBottomElement.get(0) != newBottomElement.get(0)) {
                            currentBottomElement.removeClass('element-magnet-hover');
                        }

                        currentBottomElement = newBottomElement;
                        currentBottomElement.addClass('element-magnet-hover');
                    } else if (currentBottomElement) {
                        currentBottomElement.removeClass('element-magnet-hover');
                        currentBottomElement = null;
                    }
                }
            };

            /**
             * Occurs when mouse button is being hit down.
             * @param {object} e Event.
             */
            onMouseDown = (e: any) => {
                var slideElement = null;

                if (isCtrl && currentBottomElement) {
                    slideElement = this.composition.findElement(currentBottomElement);

                    if (slideElement) {
                        this.composition.promoteElement(slideElement);
                    }
                    
                    e.preventDefault();
                    e.stopPropagation();
                }
            };

            /**
             * Binds "mousemove/mosedown" handlers to special elements (svg, iframe).
             */
            bindSpecialElements = () => {
                setTimeout(() => {
                    $(this.composition.infographic.slide).find('svg, iframe')
                        .off('.magnet')
                        .on('mousemove.magnet', onMouseMove)
                        .on('mousedown.magnet', onMouseDown);
                }, 100);
            };

            if (slideWindow) {
                bindSpecialElements();

                /* On layout changes, binding "mousemove/mosedown" handlers to special elements (svg, iframe). */
                this.composition.infographic.addEventListener('layoutChanged', (sender, args) => {
                    bindSpecialElements();
                });

                watchKeyDownTargets.map(target => <JQuery>target['$'](target)).forEach(target => {
                    target.off('.magnet').on('keydown.magnet', (e: any) => {
                        var t = (e.target.tagName || e.target.nodeName || '').toLowerCase();

                        if (t != 'input' && t != 'textarea') {
                            isMagnetCursorReset = false;

                            /* Watching for CTRL/CMD to be pressed. */
                            if (!isCtrl) {
                                isCtrl = e.ctrlKey || (mac && e.metaKey);

                                if (isCtrl) {
                                    reset();

                                    bindSpecialElements();

                                    /* Retrieving positions of all the elements on a slide. */
                                    elementPositions = this.getElementPositions();
                                }
                            }
                        }
                    }).on('mousemove.magnet', (e: any) => {
                        if (isCtrl) {
                            /* When CTRL/CMD is pressed and mouse is being moved, displaying magnet cursor when the mouse pointer is wihtin the infographic area. */
                            watchKeyDownTargets.forEach(wnd => {
                                $(wnd.document.body).toggleClass('cursor-magnet', e.target.ownerDocument.defaultView == slideWindow);
                            });

                            onMouseMove(e);
                        } else if (!isMagnetCursorReset) {
                            reset();
                        }
                    }).on('mousedown.magnet', (e: any) => {
                        onMouseDown(e);
                    }).on('keyup.magnet', (e: any) => {
                        /* CTRL/CMD is released - resetting the cursor. */
                        if (e.keyCode == keys.ctrl || e.keyCode == keys.cmd) {
                            isCtrl = false;

                            reset();
                        };
                    });
                });
            }
        }

        /**
         * Returns positions of all the elements currently on the slide.
         */
        public getElementPositions(): any[]{
            return this.composition.multiSelect.getElementPositions();
        }

        /**
         * Returns the bottom-most element under the given mouse pointer.
         * @param {number} mouseX Mouse X coordinate.
         * @param {number} mouseY Mouse Y coordinate.
         * @param {Array} elementPositions Element positions.
         */
        public getBottomElement(mouseX: number, mouseY: number, elementPositions: any[]) {
            var ret = null,
                candidates = [],
                candidatesWithElevation = [],
                candidatesWithSameElevation = [],

                /**
                 * Returns value indicating whether mouse pointer is within the given element's dimensions.
                 */
                isInside = pos => {
                    var x1 = pos.position.left, y1 = pos.position.top,
                        x2 = pos.position.left + pos.dimensions.width,
                        y2 = pos.position.top + pos.dimensions.height,
                        pointX = mouseX + this._containerOffset.left,
                        pointY = mouseY + this._containerOffset.top;

                    return pointX >= x1 && pointX <= x2 &&
                        pointY >= y1 && pointY <= y2;
                },

                orderByDom = (elements: any[]) => {
                    return $(this.composition.infographic.slide).find(ko.utils.arrayMap(elements, pos => {
                        return '#' + pos.node.attr('id');
                    }).join(', '));
                };

            if (!this._containerOffset) {
                this._containerOffset = $(this.composition.infographic.slide).offset();
            }

            /* Filtering elements by only returning those that are under the mouse pointer. */
            candidates = ko.utils.arrayFilter(elementPositions, pos => {
                return isInside(pos);
            });

            if (candidates.length) {
                /* Identifying whether we have elements with elevation. */
                candidatesWithElevation = ko.utils.arrayFilter(candidates, pos => {
                    return pos.position.elevation >= 0;
                });

                if (candidatesWithElevation.length) {
                    /* Sorting by elevation and returning the first one (bottom one). */
                    candidatesWithElevation = candidatesWithElevation.sort((x, y) => {
                        return x.position.elevation - y.position.elevation;
                    });

                    /* Taking least elevated candiates yet having same elevation level. */
                    for (var i = 0; i < candidatesWithElevation.length; i++) {
                        if (candidatesWithElevation[i].position.elevation == candidatesWithElevation[0].position.elevation) {
                            candidatesWithSameElevation.push(candidatesWithElevation[i]);
                        }
                    }
                    
                    if (candidatesWithSameElevation.length > 1) {
                        /* We have more than one - orderind by DOM appearance and taking the first one (bottom one). */
                        ret = $(orderByDom(candidatesWithSameElevation)[0]);
                    } else {
                        ret = $(candidatesWithSameElevation[0].node);
                    }
                } else {
                    /* Retrieving elements in the order they appear in DOM and then taking the first one (would be the bototm one). */
                    ret = $(orderByDom(candidates)[0]);
                }
            }

            return ret;
        }
    }

    /** Represents element selection direciton. */
    export enum ElementSelectionDirection {
        /** Bottom left. */
        bottomLeft = 0,

        /** Bottom right. */
        bottomRight = 1,

        /** Top left. */
        topLeft = 2,

        /** Top right. */
        topRight = 3
    }

    /** Represents suggestive node relative location. */
    export enum SuggestiveNodeRelativeLocation {
        /** Top. */
        top = 0,

        /** Left. */
        left = 1,

        /** Right. */
        right = 2,

        /** Bottom. */
        bottom = 3
    }

    /** Represents suggestive position. */
    export interface ISuggestivePosition {
        /** Gets or sets the left coordinate. */
        left: number;

        /** Gets or sets the top coordinate. */
        top: number;

        /** Gets or sets the target node (drag target). */
        node: JQuery;

        /** Gets or setst the suggstive line. */
        line: JQuery;

        /** Gets or sets the suggestive location relative to the node. */
        location: SuggestiveNodeRelativeLocation;
    }

    /** Represents element placement. */
    export interface IElementPlacement {
        /** Gets or sets the node. */
        node: JQuery;

        /** Gets or sets the node position. */
        position: { left: number; top: number }
    }

    /** Represents an element suggestive. */
    export class ElementSuggestiveBase {
        /** Gets or sets the appear proximity (in pixels). */
        public appearProximity: number;

        /** Gets or sets suggestive Id. */
        private _id: string;

        /** Gets or sets suggestive Id increment. */
        private static _idIncrement: number;

        /** Initializes a new instance of an object. */
        constructor() {
            if (!ElementSuggestiveBase._idIncrement) {
                ElementSuggestiveBase._idIncrement = 1;
            }

            this.appearProximity = 5;
            this._id = 'sug-' + (new Date().getTime() + '-' + (++ElementSuggestiveBase._idIncrement));
        }

        /** 
         * Ensures that suggestive is created and refreshes it.
         * @param {JQuery} container Suggestive container.
         * @param {IElementPlacement} dragTarget Placement of a drag target.
         * @param {IElementPlacement[]} otherElements Other elements' placements.
         */
        public ensureAndRefresh(container: JQuery, dragTarget: IElementPlacement, otherElements: IElementPlacement[]): ISuggestivePosition {
            var line = container.find('#' + this._id), ret = null;

            if (!line.length) {
                line = $('<div class="element-suggestive"></div>')
                    .attr('id', this._id).hide().appendTo(container);
            }

            ret = this.refresh(line, dragTarget, otherElements);

            if (ret) {
                ret.line = line;
                ret.node = dragTarget;
            }

            return ret;
        }

        /** 
         * Refreshes suggestive.
         * @param {JQuery} line Suggestive line.
         * @param {IElementPlacement} dragTarget Placement of a drag target.
         * @param {IElementPlacement[]} otherElements Other elements' placements.
         */
        public refresh(line: JQuery, dragTarget: IElementPlacement, otherElements: IElementPlacement[]): ISuggestivePosition {
            return null;
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

    /** Represents horizontal suggestive. */
    export class HorizontalSuggestive extends ElementSuggestiveBase {
        /** 
         * Refreshes suggestive.
         * @param {JQuery} line Suggestive line.
         * @param {IElementPlacement} dragTarget Placement of a drag target.
         * @param {IElementPlacement[]} otherElements Other elements' placements.
         */
        public refresh(line: JQuery, dragTarget: IElementPlacement, otherElements: IElementPlacement[]): ISuggestivePosition {
            var ret = null,
                location = null,
                min = { value: -1, node: null },
                pos = 0,
                w = 0,
                temp = 0,
                totalWidth = 0,
                totalLeft = 0,
                totalTop = 0,
                getWidth = n => n.outerWidth(),
                getHeight = n => n.outerHeight(),
                h = getHeight(dragTarget.node),
                setMin = (v, n) => {
                    min.value = v;
                    min.node = n;
                };

            line.addClass('element-suggestive-horizontal');

            setMin(-1, null);

            /* Above the drag target. */
            this.forEach(otherElements, elem => {
                if (min.value < 0) {
                    pos = elem.position.top + getHeight(elem.node);

                    if ((Math.abs(dragTarget.position.top - pos) <= this.appearProximity) ||
                        (Math.abs(elem.position.top - dragTarget.position.top) <= this.appearProximity)) {

                        setMin(pos, elem);
                    }
                }
            });

            if (min.value >= 0) {
                location = SuggestiveNodeRelativeLocation.top;
            } else {
                setMin(-1, null);

                /* Below the drag target. */
                this.forEach(otherElements, elem => {
                    if (min.value < 0) {
                        pos = elem.position.top;

                        if ((Math.abs((dragTarget.position.top + h) - pos) <= this.appearProximity) ||
                            (Math.abs((dragTarget.position.top + h) - (pos + getHeight(elem.node))) <= this.appearProximity)) {

                            setMin(pos, elem);
                        }
                    }
                });

                if (min.value >= 0) {
                    location = SuggestiveNodeRelativeLocation.bottom;
                }
            }

            if (location != null) {
                w = getWidth(dragTarget.node);

                if (min.node.position.left > dragTarget.position.left) {
                    totalWidth = min.node.position.left + getWidth(min.node.node) - dragTarget.position.left;
                } else {
                    totalWidth = dragTarget.position.left + getWidth(dragTarget.node) - min.node.position.left;
                }

                totalWidth += 6;

                if (min.node.position.left > dragTarget.position.left) {
                    totalLeft = dragTarget.position.left;
                } else {
                    totalLeft = min.node.position.left;
                }

                totalLeft -= 3;

                if (Math.abs(min.node.position.top - dragTarget.position.top) <= this.appearProximity) {
                    totalTop = min.node.position.top;
                } else {
                    temp = getHeight(min.node.node);

                    if (Math.abs((min.node.position.top + temp) - (dragTarget.position.top + h)) <= this.appearProximity) {
                        totalTop = min.node.position.top + temp;
                    } else if (dragTarget.position.top < min.node.position.top) {
                        totalTop = min.node.position.top;
                    } else {
                        totalTop = min.node.position.top + temp;
                    }
                }
                

                if (totalWidth >= 150) {
                    line.show().css({
                        left: totalLeft,
                        top: totalTop,
                        width: totalWidth
                    });
                } else {
                    line.hide();
                }
            } else {
                line.hide();
            }

            return ret;
        }
    }

    /** Represents vertical suggestive. */
    export class VerticalSuggestive extends ElementSuggestiveBase {
        /** 
         * Refreshes suggestive.
         * @param {JQuery} line Suggestive line.
         * @param {IElementPlacement} dragTarget Placement of a drag target.
         * @param {IElementPlacement[]} otherElements Other elements' placements.
         */
        public refresh(line: JQuery, dragTarget: IElementPlacement, otherElements: IElementPlacement[]): ISuggestivePosition {
            var ret = null,
                location = null,
                min = { value: -1, node: null },
                pos = 0,
                h = 0,
                temp = 0,
                totalHeight = 0,
                totalLeft = 0,
                totalTop = 0,
                getWidth = n => n.outerWidth(),
                getHeight = n => n.outerHeight(),
                w = getWidth(dragTarget.node),
                setMin = (v, n) => {
                    min.value = v;
                    min.node = n;
                };

            line.addClass('element-suggestive-vertical');

            setMin(-1, null);

            /* To the left from drag target. */
            this.forEach(otherElements, elem => {
                if (min.value < 0) {
                    pos = elem.position.left + getWidth(elem.node);
                    
                    if ((Math.abs(dragTarget.position.left - pos) <= this.appearProximity) ||
                        (Math.abs(elem.position.left - dragTarget.position.left) <= this.appearProximity)) {

                        setMin(pos, elem);
                        
                    }
                }
            });

            if (min.value >= 0) {
                location = SuggestiveNodeRelativeLocation.left;
            } else {
                setMin(-1, null);

                /* To the right from the drag target. */
                this.forEach(otherElements, elem => {
                    if (min.value < 0) {
                        pos = elem.position.left;

                        if ((Math.abs((dragTarget.position.left + w) - pos) <= this.appearProximity) ||
                            (Math.abs((dragTarget.position.left + w) - (pos + getWidth(elem.node))) <= this.appearProximity)) {

                            setMin(pos, elem);
                        }
                    }
                });

                if (min.value >= 0) {
                    location = SuggestiveNodeRelativeLocation.right;
                }
            }

            if (location != null) {
                h = getHeight(dragTarget.node);
                temp = getHeight(min.node.node);

                if (min.node.position.top < dragTarget.position.top) {
                    if ((dragTarget.position.top + h) > (min.node.position.top + temp)) {
                        totalHeight = h + Math.abs(min.node.position.top - dragTarget.position.top);
                    } else {
                        totalHeight = temp;
                    }
                } else {
                    if ((min.node.position.top + temp) > (dragTarget.position.top + h)) {
                        totalHeight = temp + Math.abs(min.node.position.top - dragTarget.position.top);
                    } else {
                        totalHeight = h;
                    }
                }

                totalHeight += 6;

                if (Math.abs(min.node.position.left - dragTarget.position.left) <= this.appearProximity ||
                    (Math.abs((dragTarget.position.left + w) - min.node.position.left) <= this.appearProximity)) {

                    totalLeft = min.node.position.left;
                } else {
                    totalLeft = min.node.position.left + getWidth(min.node.node);
                }

                if (min.node.position.top < dragTarget.position.top) {
                    totalTop = min.node.position.top;
                } else {
                    totalTop = dragTarget.position.top;
                }

                totalTop -= 3;
                
                if (totalHeight >= 150) {
                    line.show().css({
                        left: totalLeft,
                        top: totalTop,
                        height: totalHeight
                    });
                } else {
                    line.hide();
                }
            } else {
                line.hide();
            }

            return ret;
        }
    }

    /** Represents element suggestive manager. */
    export class ElementSuggestiveManager {
        /** Gets or sets the owning composition manager. */
        public composition: CompositionManager;

        /** Gets or sets the suggestives. */
        public suggestives: ElementSuggestiveBase[];

        /**
         * Initializes a new instance of an object.
         * @param {CompositionManager} composition Owning composition manager.
         */
        constructor(composition: CompositionManager, suggestives?: ElementSuggestiveBase[]) {
            this.composition = composition;
            this.suggestives = [];

            if (suggestives) {
                this.forEach(suggestives, sug => {
                    this.suggestives[this.suggestives.length] = sug;
                });
            }
        }

        /** 
         * Refreshes suggestive.
         * @param {IElementPlacement} dragTarget Placement of a drag target.
         * @param {IElementPlacement[]} otherElements Other elements' placements.
         */
        public refresh(dragTarget: IElementPlacement): ISuggestivePosition[] {
            var ret = [], otherElements = [], dragTargetId = dragTarget.node.attr('data-elementid');

            this.composition.infographic.slide.find('.element').each((i, e) => {
                var $e = $(e), offset = null;

                if ($e.attr('data-elementid') != dragTargetId) {
                    if (!$e.hasClass('type-meta')) {
                        offset = $e.offset();

                        otherElements[otherElements.length] = {
                            node: $e,
                            position: {
                                left: offset.left,
                                top: offset.top
                            }
                        };
                    }
                }
            });

            this.forEach(this.suggestives, sug => {
                var result = sug.ensureAndRefresh(this.composition.infographic.slide, dragTarget, otherElements);

                if (result) {
                    ret[ret.length] = result;
                }
            });

            return ret;
        }

        /** Destroys the suggestives. */
        public destroy() {
            this.composition.infographic.slide.find('.element-suggestive').remove();
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

    /** Represents element selection frame. */
    export class ElementSelectionFrame extends Ifly.EventSource {
        /** Gets or sets the owning composition manager. */
        public composition: CompositionManager;

        private _frame: JQuery;
        private _container: JQuery;
        private _eventNamespace: string;
        private _dragStarted: boolean;
        private _wasDragged: boolean;
        private _frameVisible: boolean;
        private _threshold: number;
        private _delta: { top: number; left: number; };
        private _initialPosition: { top: number; left: number; };
        private _currentPosition: { top: number; left: number; };
        private _containerOffset: { top: number; left: number; };
        private _elements: any[];
        private _elementsCovered: any[];

        /**
         * Initializes a new instance of an object.
         * @param {JQuery} container Container.
         * @param {CompositionManager} composition Composition manager.
         */
        constructor(container: JQuery, composition: CompositionManager) {
            super();

            this.composition = composition;

            this._threshold = 6;
            this._container = $(container);
            this._eventNamespace = '.ElementSelectionFrame';
            this._frame = $('<div class="element-selection-frame"></div>')
                .hide().appendTo(this._container);

            this.initialize();
        }

        /**
         * Initializes the draggable frame.
         */
        public initialize() {
            var ns = this._eventNamespace;

            this.dispose();

            this._container.bind('mousedown' + ns, e => { this.onMouseDown(e); });
            this._container.bind('mousemove' + ns, e => { this.onMouseMove(e); });
            this._container.bind('mouseup' + ns, e => { this.onMouseUp(e); });

            return this;
        }

        /** 
         * Handles "mousedown" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseDown(e: JQueryEventObject) {
            var t = $(e.target);

            if (t.hasClass('slide-editable') || t.hasClass('stack') || t.hasClass('stack-item')) {
                this._wasDragged = false;
                this._dragStarted = true;
                    
                this._delta = this.getMousePosition(e);

                this._container.addClass('slide-multiselecting');

                this._container.parents('body').bind('selectstart' + this._eventNamespace, e => {
                    e.preventDefault();
                    e.stopPropagation();
                });

                this.dispatchEvent('selectstart');
            }
        }

        /** 
         * Handles "mousedown" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseMove(e: JQueryEventObject) {
            var newPosition = null, deltaLeft = 0, deltaTop = 0, f = null;

            if (this._dragStarted) {
                newPosition = this.getMousePosition(e, this._delta);

                if (!this._initialPosition) {
                    this._initialPosition = this._delta;
                }

                this._currentPosition = {
                    left: this._delta.left + newPosition.left,
                    top: this._delta.top + newPosition.top
                };

                deltaLeft = this._currentPosition.left - this._initialPosition.left;
                deltaTop = this._currentPosition.top - this._initialPosition.top;

                // Threshold is 6 pixels - not starting to show the element selection frame unless it "traverses" a path of 6px.
                if (Math.abs(deltaLeft) >= this._threshold || Math.abs(deltaTop) >= this._threshold) {
                    this._wasDragged = true;

                    if (!this._frameVisible) {
                        this._frame.show();

                        this._frameVisible = true;
                        this._elements = this.getElementPositions();
                        this._elementsCovered = [];

                        /* Hiding element properties pane. */
                        if (this.composition.editor.gallery.elementProperties.isOpen()) {
                            this.composition.editor.gallery.elementProperties.toggleVisibility();
                        }
                    }

                    f = this.updateFrameDimensionsAndPosition(this.getSelectionDirection(deltaLeft, deltaTop),
                        this._initialPosition, this._currentPosition);

                    this._elementsCovered = this.getCoveredElements(f, this._elements);

                    for (var i = 0; i < this._elements.length; i++) {
                        this._elements[i].node.removeClass('element-covering');
                    }

                    for (var i = 0; i < this._elementsCovered.length; i++) {
                        this._elementsCovered[i].node.addClass('element-covering');
                    }

                    this.dispatchEvent('selection', { position: newPosition });
                }

                e.stopPropagation();
            }
        }

        /** 
         * Handles "mouseup" event.
         * @param {JQueryEventObject} e Event object.
         */
        public onMouseUp(e: JQueryEventObject) {
            if (this._dragStarted) {
                this.dispatchEvent('selectend', { wasDragged: this._wasDragged });

                this._delta = null;
                this._wasDragged = false;
                this._dragStarted = false;
                this._initialPosition = null;
                this._currentPosition = null;
                this._frameVisible = false;
                this._frame.hide();

                this._container.removeClass('slide-multiselecting');

                this._container.parents('body').unbind(this._eventNamespace);

                e.stopPropagation();
            }
        }

        /** Resets the frame. */
        public dispose() {
            this._delta = null;
            this._wasDragged = false;
            this._dragStarted = false;
            this._initialPosition = null;
            this._currentPosition = null;
            this._containerOffset = null;
            this._frameVisible = false;
            this._elements = [];
            this._elementsCovered = [];
            
            this._container.unbind(this._eventNamespace).parents('body')
                .unbind(this._eventNamespace);

            this._frame.hide();

            return this;
        }

        /** Returns all the currently selected (covered) elements. */
        public getSelection(clear?: boolean) {
            var ret = this._elementsCovered;

            if (clear) {
                for (var i = 0; i < ret.length; i++) {
                    ret[i].node.removeClass('element-covering');
                }

                this._elementsCovered = [];
            }

            return ret;
        }

        /** 
         * Returns mouse position relative to the container.
         * @param {JQueryEventObject} e Event object.
         */
        private getMousePosition(e: JQueryEventObject, offset?: { top: number; left: number }): { top: number; left: number } {
            var o = null;

            if (!offset && !this._containerOffset) {
                this._containerOffset = this._container.offset();
            }

            o = offset || this._containerOffset;

            return {
                left: e.clientX - o.left,
                top: e.clientY - o.top
            };
        }

        /**
         * Returns selection direction.
         * @param {number} deltaLeft Delta left.
         * @param {number} deltaTop Delta top.
         */
        private getSelectionDirection(deltaLeft: number, deltaTop: number): ElementSelectionDirection {
            var ret = ElementSelectionDirection.bottomRight;

            if (deltaLeft <= 0 && deltaTop <= 0) {
                ret = ElementSelectionDirection.topLeft;
            } else if (deltaLeft <= 0 && deltaTop >= 0) {
                ret = ElementSelectionDirection.bottomLeft;
            } else if (deltaLeft >= 0 && deltaTop <= 0) {
                ret = ElementSelectionDirection.topRight;
            } else if (deltaLeft >= 0 && deltaTop >= 0) {
                ret = ElementSelectionDirection.bottomRight;
            }

            return ret;
        }

        /** Returns element positions. */
        public getElementPositions(): any[]{
            var ret = [], nodes = this._container.find('.element');

            if (!this._containerOffset) {
                this._containerOffset = this._container.offset();
            }

            for (var i = 0; i < nodes.length; i++) {
                ((n, o) => {
                    var elevation = null,
                        cssClasses = <string[]>(n.attr('class') || '').toLowerCase().split(' ');

                    ko.utils.arrayForEach(cssClasses, cssClass => {
                        if (elevation == null && cssClass.indexOf('element-elevation-') == 0) {
                            elevation = parseInt(cssClass.split('-').pop(), 10);
                        }
                    });

                    ret.push({
                        node: n,
                        position: {
                            left: o.left - this._containerOffset.left,
                            top: o.top - this._containerOffset.top,
                            elevation: elevation
                        },
                        dimensions: {
                            width: n.width(),
                            height: n.height()
                        }
                    });
                })($(nodes[i]), $(nodes[i]).offset());
            }

            return ret;
        }

        /**
         * Returns covered elements.
         * @param {object} frame Frame dimensions and coordinates.
         * @param {Array} elements Elements dimensions and coordinates.
         */
        private getCoveredElements(frame: any, elements: any[]): any[]{
            var ret = [], cFrame = null, coords = n => {
                return {
                    topLeft: {
                        x: n.position.left,
                        y: n.position.top
                    },
                    bottomRight: {
                        x: n.position.left + n.dimensions.width,
                        y: n.position.top + n.dimensions.height
                    }
                };
            }, overlap = (first, second) => {
                return first.topLeft.x < second.bottomRight.x && first.bottomRight.x > second.topLeft.x &&
                    first.topLeft.y < second.bottomRight.y && first.bottomRight.y > second.topLeft.y;
            };

            cFrame = coords(frame);

            for (var i = 0; i < elements.length; i++) {
                if (overlap(cFrame, coords(elements[i])) && !elements[i].node.hasClass('type-meta') &&
                    !elements[i].node.hasClass('element-locked')) {

                    ret.push(elements[i]);
                }
            }

            return ret;
        }

        /**
         * Updates frame dimensions and position.
         * @param {ElementSelectionDirection} direction Selection direction.
         * @param {object} initialPosition Initial position.
         * @param {object} currentPosition Current position.
         */
        private updateFrameDimensionsAndPosition(direction: ElementSelectionDirection, initialPosition: { top: number; left: number }, currentPosition: { top: number; left: number }): any {
            var w = 0, h = 0, ret = { position: { left: 0, top: 0 }, dimensions: { width: 0, height: 0 } },
                pos = (left, top) => {
                    var la = left - this._threshold, ta = top - this._threshold;

                    ret.position.left = la;
                    ret.position.top = ta;

                    this._frame.css({ left: la + 'px', top: ta + 'px' });
                };

            w = Math.abs(initialPosition.left - currentPosition.left);
            h = Math.abs(initialPosition.top - currentPosition.top);

            ret.dimensions.width = w;
            ret.dimensions.height = h;

            this._frame.css({   
                width: w + 'px',
                height: h + 'px'
            });

            switch (direction) {
                case ElementSelectionDirection.topLeft:
                    pos(currentPosition.left, currentPosition.top);
                    break;
                case ElementSelectionDirection.bottomLeft:
                    pos(currentPosition.left , initialPosition.top);
                    break;
                case ElementSelectionDirection.topRight:
                    pos(initialPosition.left, currentPosition.top);
                    break;
                case ElementSelectionDirection.bottomRight:
                    pos(initialPosition.left, initialPosition.top); 
                    break;
            }

            return ret;
        }
    }

    /** Represents element composition location. */
    export interface IElementCompositionLocation {
        /** Gets or sets the element. */
        element: Ifly.Models.Element;

        /** Gets or sets the left coordinate (in pixels). */
        left: number;

        /** Gets or sets the top coordinate (in pixels). */
        top: number;

        /** Gets or sets element width. */
        width: number;

        /** Gets or sets element height. */
        height: number;

        /** Gets or sets the JQuery node that corresponds to an element. */
        node: JQuery;
    }

    /** Represents element disposition. */
    export interface IElementDisposition {
        /** Gets or sets the containing slide. */
        slide: Ifly.Models.Slide;

        /** Gets or sets the containing slide index. */
        slideIndex: number;

        /** Gets or sets the element. */
        element: Ifly.Models.Element;

        /** Gets or sets the element index. */
        elementIndex: number;
    }

    /** Represents a composition element. */
    export class CompositionElement {
        /** Gets or sets the element. */
        public element: Element;

        /** Gets or sets the reference to a DOM node that corresponds to a given element. */
        public node: JQuery;

        /** Gets or sets value indicating whether element is "bouncing" (a trace of being clicked). */
        public isBouncing: boolean;

        /** Initializes a new instance of an object. */
        constructor() { }

        /** Bounces the given element. */
        public bounce() {
            this.isBouncing = true;
            setTimeout(() => {
                this.isBouncing = false;
            }, 100);
        }
    }

    /** Represents a composition manager. */
    export class CompositionManager extends Component {
        /** Gets or sets the element delete confirmation modal. */
        private _deleteConfirmModal: any;

        /** Gets or sets the element selection delete confirmation modal. */
        private _deleteSelectionConfirmModal: any;

        /** Gets or sets the selected element. */
        public selectedElement: CompositionElement;

        /** Gets or sets the selected slide. */
        public selectedSlide: Slide;

        /** Gets or sets the infographic object. */
        public infographic: Embed.Infographic;

        /** Gets or sets the composition host, if any. */
        public host: JQuery;

        /** Gets or sets value indicating whether to show grid. */
        public showGrid: KnockoutObservable<boolean>;

        /** Gets or sets the selection frame. */
        public multiSelect: ElementSelectionFrame;

        /** Gets or sets the multi-select move group. */
        public multiSelectGroup: Embed.MoveTargetGroup;

        /** Gets or sets the suggestives. */
        private suggestives: ElementSuggestiveManager;

        /** Gets or sets element magnet. */
        private elementMagnet: ElementMagnetManager;

        /** Gets or sets value indicating whether selection is bouncing. */
        public selectionBouncing: boolean;

        /** Gets or sets value indicating whether the given slide is being reloaded. */
        private _isLoadingSlide: boolean;

        /** Gets or sets the copy element timer. */
        private _copyElementTimer: number;

        /** Gets or sets grid show/hide timeout. */
        private _gridShowHideTimeout: number;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            var refreshTimer = null;

            super(editor);

            this.showGrid = ko.observable<boolean>();
            this.selectedElement = new CompositionElement();
            this.elementMagnet = new ElementMagnetManager(this);

            this.initializeInfographic($('.canvas .slide')[0]);

            this.suggestives = new ElementSuggestiveManager(this, [new HorizontalSuggestive(), new VerticalSuggestive()]);

            this.showGrid.subscribe(v => {
                this.updateGrid();
            });

            $(window).resize(() => {
                clearTimeout(refreshTimer);

                refreshTimer = setTimeout(() => {
                    if (this.infographic) {
                        this.infographic.refresh();
                    }
                }, 50);
            });
        }

        /** Returns selection nodes. */
        public getSelectionNodes(): JQuery[]{
            var ret = [];

            if (this.infographic && this.infographic.slide) {
                ret = ko.utils.arrayMap(this.infographic.slide.find('.element')
                    .filter('.element-active-covered'), n => {
                        return $(n);
                    });
            }

            return ret;
        }

        /** Returns the current selection. */
        public getSelection() {
            return ko.utils.arrayFilter(ko.utils.arrayMap(this.getSelectionNodes(), n => {
                return this.findElement($(n));
            }), s => s !== null);
        }

        /** Clears selection. */
        public clearSelection() {
            if (!this.selectionBouncing) {
                if (this.infographic && this.infographic.slide) {
                    this.infographic.slide.find('.element')
                        .filter('.element-active-covered')
                        .removeClass('element-active-covered')
                        .blur();
                }
            }
        }

        /** Toggles show/hide grid. */
        public toggleShowGrid(): boolean {
            var ret = !this.showGrid();

            this.showGrid(ret);

            return ret;
        }

        /**
         * Adds theme reference to the current composition.
         * @param {ThemeReference} theme Theme.
         * @param {boolean} updateThemeSelector Value indicating whether to update theme selector.
         */
        public addThemeReference(theme: ThemeReference, updateThemeSelector?: boolean) {
            var addStylesheetTag = (doc: HTMLDocument) => {
                var head = doc.getElementsByTagName('head')[0], id = '',
                    stylesheet: HTMLLinkElement = null, existing = null;

                if (head) {
                    id = 'ts-' + theme.id;

                    existing = doc.getElementById(id);

                    if (existing) {
                        existing.parentNode.removeChild(existing);
                    }

                    stylesheet = doc.createElement('link');

                    stylesheet.id = 'ts-' + id;
                    stylesheet.rel = 'stylesheet';
                    stylesheet.type = 'text/css';
                    stylesheet.href = theme.url;

                    head.appendChild(stylesheet);
                }

                if (typeof (doc.defaultView['Ifly']) !== 'undefined') {
                    doc.defaultView['Ifly'].Utils.FontLoader.loadCustomFonts(theme.url);
                }
            };

            if (theme && theme.url && theme.url.length) {
                addStylesheetTag(document);

                if (this.host && this.host.length && this.host.get(0) != document) {
                    addStylesheetTag(<HTMLDocument>this.host.get(0));
                }
            }

            if (updateThemeSelector) {
                /* Rendering the theme. */
                PresentationSettingsModal.getInstance().data.themes.addThemeReference(theme);
            }
        }

        /**
         * Sets the composition host.
         * @param {object} host Host.
         */
        public setHost(host: any) {
            this.host = host ? $(host) : null; 

            this.initializeInfographic($(host || document).find('.canvas .slide')[0]);

            if (host) {
                $(host.body)
                    .keyup(e => { $(document.body).trigger(<any>e); })
                    .mousedown(e => { $(document.body).trigger(<any>e); })
                    .find('.canvas-container').click(e => { $('.canvas-container').trigger(<any>e); });

                Utils.Input.configureShortcuts($(host.body), {
                    left: () => { this.selectNextElement(); },
                    right: () => { this.selectPreviousElement(); },
                    up: () => { this.promoteCurrentElement(); },
                    down: () => { this.demoteCurrentElement(); },
                    space: () => { this.toggleShowGrid(); },
                    copy: () => {
                        /* Basically, we don't care what's being copied (no check against e.target/activeElement) - slide content
                        is not editable so we assume that the currently selected element should be copied. */
                        if (this.selectedElement && this.selectedElement.element) {
                            this.copyElementInternal(this.selectedElement.element, true);
                        }
                    },
                    paste: () => { this.pasteElement(); },
                    del: () => {
                        if (this.selectedElement && this.selectedElement.element) {
                            this.tryDeleteElement(this.selectedElement.element);
                        }
                    }
                });
            }
        }

        /**
         * Re-initializes the infographic engine.
         * @param {object} container Container element.
         */
        private initializeInfographic(container: any) {
            this.infographic = new Embed.Infographic(container);

            if (this.multiSelect) {
                this.multiSelect.dispose();
            }

            this.multiSelect = new ElementSelectionFrame(this.infographic.slide, this);
            this.selectionBouncing = false;

            this.multiSelect.addEventListener('selectstart', (sender, args) => {
                this.selectionBouncing = false;
                this.clearSelection();
            });

            this.multiSelect.addEventListener('selectend', (sender, args) => {
                var sel = [];

                if (args.wasDragged) {
                    sel = this.multiSelect.getSelection(true);

                    if (sel && sel.length) {
                        sel[0].node.focus();

                        for (var i = 0; i < sel.length; i++) {
                            sel[i].node.addClass('element-active-covered');
                        }
                    }

                    this.selectionBouncing = true;

                    setTimeout(() => {
                        this.selectionBouncing = false;
                    }, 100);
                } 
            });

            /* On layout changes, updating "Up" and "Down" context menu options' availability. */
            this.infographic.addEventListener('layoutChanged', (sender, args) => {
                this.updateContextMenuOptions();
            });

            /* On dimensions changes, updating grid lines. */
            this.infographic.addEventListener('dimensionsChanged', (sender, args) => {
                this.updateGrid();
            });

            this.updateGrid();

            /* Initializing element magnet. */
            this.elementMagnet.initialize();
        }

        /** Clears the composition. */
        public clear() {
            this.infographic.clear();
        }

        /**
         * Selects the given slide.
         * @param {object} slide Slide to select.
         * @param {boolean} force Value indicating whether to force
         */
        public selectSlide(slide: Ifly.Models.Slide, force?: boolean) {
            var sameSlide = false;

            if (!this.selectedSlide || (slide && slide.id() != this.selectedSlide.id()) || !!force) {
                this.clear();
            } else {
                sameSlide = true;
            }

            if (slide) {
                /* Updating title and description */
                this.onSlideUpdated(slide);

                /* Applying the theme and background image. */
                this.applyTheme(this.editor.presentation.theme());
                this.applyBackgroundImage(this.editor.presentation.backgroundImage(), this.editor.presentation.theme());

                if (!sameSlide) {
                    this.selectedSlide = slide;

                    /* Loading elements */
                    if (slide.elements().length) {
                        this._isLoadingSlide = true;

                        ko.utils.arrayForEach(slide.elements(), (e: Element) => {
                            this.updateElement(e, true);
                        });

                        this._isLoadingSlide = false;
                        this.updateGrid();
                    }
                }
            } else {
                this.applyTheme(null);
                this.applyBackgroundImage(null, this.editor.presentation.theme());
                this.selectedSlide = null;
            } 
        }

        /** 
         * Occurs when slide gets updated.
         * @param {object} slide Slide to add.
         */
        public onSlideUpdated(slide: Ifly.Models.Slide) {
            var title = '', description = '';

            var updateOrRemove = (v: string, t: ElementType) => {
                var elm = null;

                if (v && v.length) {
                    /* Defining an element that is to be put on the composition */
                    elm = new Element({
                        id: -1 * t,
                        type: t,
                        name: ElementType[t],
                        slideId: slide ? slide.id() : -1,
                        position: ElementPosition.top,
                        properties: [
                            { name: 'text', value: v }
                        ]
                    });

                    /* Putting the element */
                    this.infographic.ensureElement(elm.serialize(), this.infographic.selectElements(e => {
                            return e.hasClass('type-' + Ifly.Models.ElementType[t]);
                        })[0], e => {
                            e.bind('click', (evt) => {
                                this.editor.slides.editSlide(slide, { focus: t == 1 ? 'title' : 'description' });
                            });
                        }, { alwaysOnTop: true });
                } else {
                    this.infographic.removeElements(e => {
                        return e.hasClass('type-' + Ifly.Models.ElementType[t]);
                    });
                }
            };

            if (slide) {
                title = slide.title();
                description = slide.description();
            }

            updateOrRemove(description, ElementType.description);
            updateOrRemove(title, ElementType.title);
        }

        /**
         * Selects the given element.
         * @param {Element} element Element to select.
         */
        public selectElement(element: Element, indicate?: boolean): JQuery {
            var ret = this.selectedElement ? this.selectedElement.node : null;

            if (!indicate) {
                if (element) {
                    this.editor.gallery.elementProperties.selectElement(element);
                }

                if (this.selectedElement.node) {
                    this.selectedElement.node.removeClass('element-active');
                }

                if (element) {
                    this.selectedElement.element = element;
                    this.selectedElement.node = this.updateElement(element, true);

                    this.selectedElement.node.addClass('element-active');
                    this.selectedElement.bounce();
                } else {
                    this.selectedElement.element = this.selectedElement.node = null;
                }

                ret = this.selectedElement.node;
            } else {
                this.updateElement(element, true);
            }
            
            return ret;
        }

        /**
         * Applies the given theme to the composition.
         * @param {string} theme Theme to apply. 
         */
        public applyTheme(theme: string) {
            this.infographic.applyTheme(theme, [
                $(this.host).find('html, body'), this.infographic.slide
            ]);
        }

        /**
         * Applies background image.
         * @param {string} image Background image.
         * @param {string} theme Theme.
         */
        public applyBackgroundImage(image: string, theme: string) {
            this.applyBackgroundImageInternal(image, theme, 1);
        }

        /**
         * Applies background image.
         * @param {string} image Background image.
         * @param {string} theme Theme.
         * @param {number} state State.
         */
        private applyBackgroundImageInternal(image: string, theme: string, state: number) {
            if (state <= 2) {
                this.infographic.applyBackgroundImage(image, theme, [
                    $(this.host).find('body').get(0),
                    this.infographic.slide
                ]);

                if (state == 1 && (!image || !image.length)) {
                    ThemeParsedMetadata.parseMetadata(theme, metadata => {
                        this.applyBackgroundImageInternal(metadata.backgroundImage(), theme, 2);
                    });
                }
            }
        }

        /** Refreshes the composition. */
        public refresh() {
            this.infographic.refresh();
        }

        /**
         * Updates element on a slide.
         * @param {Element} element Element whose properties to update.
         * @param {boolean} ignoreChanges Value indicating whether to ignore element changes.
         */
        public updateElement(element?: Element, ignoreChanges?: boolean): JQuery {
            var elm = element.serialize(), isTitleOrDescription =
                elm.type == ElementType.title || elm.type == ElementType.description,
                updateElementPosition = (node, position, ic?: boolean) => {
                    var e = this.findElement(node);

                    if (e) {
                        e.position(ElementPosition.free);

                        /* Converting px to vw. */
                        e.offset.load({
                            left: position.left,
                            top: position.top,
                            viewport: {
                                width: this.infographic.dimensions.width,
                                height: this.infographic.dimensions.height
                            }
                        });

                        if (this.editor.gallery.elementProperties.selectedElement == e) {
                            this.editor.gallery.elementProperties.update(editable => {
                                editable.position(ElementPosition.free);
                            });
                        }

                        this.updateElement(e, ic);
                    }
                };

            if (!ignoreChanges) {
                this.commitElementChanges(element.id(), element.slideId());
            }
            
            return $(this.infographic.ensureElement(elm, null, (e, serialized) => {
                e.bind('click', (evt) => {
                    var t = $(evt.target);

                    /* Selecting the outer element container */
                    if (!t.hasClass('element')) {
                        t = t.parents('.element');
                    }

                    /* Selecting the element (showing its properties) */
                    this.selectElement(this.findElement(t));
                });

                e.toggleClass('element-locked', !!elm.isLocked);

                /* Rendering context menu for a given element */
                if (!isTitleOrDescription) {
                    this.renderContextMenu(e);
                }
            }, {
                draggable: !isTitleOrDescription ? {
                    init: (sender, args) => {
                        if (this.getSelection().length > 1 && !this.multiSelectGroup) {
                            this.multiSelectGroup = new Embed.MoveTargetGroup(this.getSelectionNodes(), sender);
                            
                            this.multiSelectGroup.addEventListener('dragend', (s, e) => {
                                var first = null, rest = [], sel = [];

                                if (e.originalEvent.dragged) {
                                    ko.utils.arrayForEach(e.result, (r: any) => {
                                        updateElementPosition(r.node, r.position, true);
                                    });
                                }

                                sel = this.getSelection();

                                if (sel.length) {
                                    first = sel[0];

                                    for (var i = 1; i < sel.length; i++) {
                                        rest[rest.length] = sel[i];
                                    }

                                    this.bulkUpdatePosition(first.id(), first.slideId(), ko.utils.arrayMap(rest, (r: any) => {
                                        return {
                                            id: r.id(),
                                            left: r.offset.left(),
                                            top: r.offset.top()
                                        };
                                    }));
                                }
                            });
                        }
                    },
                    drag: (sender, args) => {
                        this.refreshDragCoordinates(args.node, true, args.position.left, args.position.top);

                        if (this.multiSelectGroup) {
                            ko.utils.arrayForEach(this.multiSelectGroup.contents, c => {
                                if (c.node.get(0) != args.node.get(0)) {
                                    this.refreshDragCoordinates(c.node, true, c.currentPosition.left, c.currentPosition.top);
                                }
                            });
                        } else {
                            this.suggestives.refresh({
                                node: args.node,
                                position: args.position
                            });
                        }
                    },
                    end: (sender, args) => {
                        this.refreshDragCoordinates(args.node, false);

                        if (this.multiSelectGroup) {
                            ko.utils.arrayForEach(this.multiSelectGroup.contents, c => {
                                this.refreshDragCoordinates(c.node, false);
                            });

                            this.multiSelectGroup.contents.splice(0,
                                this.multiSelectGroup.contents.length);

                            this.multiSelectGroup.dispose();
                            this.multiSelectGroup = null;
                        } else {
                            this.suggestives.destroy();
                        }

                        if (args.dragged && this.getSelection().length <= 1) {
                            updateElementPosition(args.node, args.position);
                        }
                    }
                } : null
            }));
        }

        /**
         * Finds an element by its composition node.
         * @param {JQuery} node DOM node associated with an element.
         */
        public findElement(node: JQuery): Element {
            return this.findElementById(parseInt(node.attr('data-elementid'), 10),
                parseInt(node.attr('data-slideid'), 10));
        }

        /**
         * Returns an element by its Id.
         * @param {number} id Element Id.
         * @param {number} slideId Slide Id.
         */
        public findElementById(id: number, slideId?: number): Element {
            var ret = null, slides = [], elements = [];

            if (id > 0) {
                slides = this.editor.presentation.slides();

                for (var i = 0; i < slides.length; i++) {
                    if (slideId == null || slideId <= 0 || slides[i].id() == slideId) {
                        elements = slides[i].elements();

                        for (var j = 0; j < elements.length; j++) {
                            if (elements[j].id() == id) {
                                ret = elements[j];
                                break;
                            }
                        }

                        if (slideId > 0) {
                            break;
                        }
                    }
                }
            }

            return ret;
        }

        /** 
         * Returns element location.
         * @param {number} id Element Id.
         * @param {Ifly.Models.Element} element Element (is known).
         * @param {JQuery} node DOM node (if known).
         */
        public getElementLocation(id: number, element?: Ifly.Models.Element, node?: JQuery): IElementCompositionLocation {
            var ret = null, n = null, e = null, vo = null, o = null;

            if (id > 0) {
                e = element || this.findElementById(id, -1);
                n = node || this.infographic.slide.find('.element[data-elementid="' + id + '"]');

                if (n && n.length) {
                    ret = {
                        element: e,
                        node: n
                    };

                    if (n && n.length) {
                        vo = this.infographic.slide.offset();

                        o = n.offset();

                        ret.top = o.top - vo.top;
                        ret.left = o.left - vo.left;

                        ret.width = n.outerWidth();
                        ret.height = n.outerHeight();
                    }
                }
            }

            return ret;
        }

        /** 
         * Returns a list of elements that overlap the given element (in the order of elevation, including the current element).
         * @param {number} id Element Id.
         * @param {Ifly.Models.Element} element Element (is known).
         * @param {JQuery} node DOM node (if known).
         */
        public getOverlappingElements(id: number, element?: Ifly.Models.Element, node?: JQuery): IElementCompositionLocation[]{
            var ret = [], temp = [], groupped = null, curElevation = -1, sortedElevations = [], documentOrder = null, loc = this.getElementLocation(id, element, node),
                nodes = null, eId = 0, eLoc = null, eNode = null, elementsOverlap = (first: IElementCompositionLocation, second: IElementCompositionLocation): boolean => {
                    var rectAx1 = first.left, rectAx2 = first.left + first.width,
                        rectBx1 = second.left, rectBx2 = second.left + second.width,
                        rectAy1 = first.top, rectAy2 = first.top + first.height,
                        rectBy1 = second.top, rectBy2 = second.top + second.height;

                    return rectAx1 < rectBx2 && rectAx2 > rectBx1 && rectAy1 < rectBy2 && rectAy2 > rectBy1;
                }, sortByDocumentOrder = (items: IElementCompositionLocation[]): IElementCompositionLocation[]=> {
                    return items.sort((x, y) => documentOrder[x.element.id()] - documentOrder[y.element.id()]);
                }, sortByDocumentOrderAndAppend = (items: IElementCompositionLocation[]) => {
                    var sorted = sortByDocumentOrder(items);

                    for (var i = 0; i < sorted.length; i++) {
                        ret[ret.length] = sorted[i];
                    }
                };

            if (loc && loc.element) {
                temp[temp.length] = loc;

                nodes = this.infographic.slide.find('.element');
                documentOrder = {};

                for (var i = 0; i < nodes.length; i++) {
                    eNode = $(nodes[i])
                    eId = parseInt(eNode.attr('data-elementid'), 10);

                    if (eId != id) {
                        eLoc = this.getElementLocation(eId, null, eNode);

                        if (eLoc && eLoc.element && elementsOverlap(loc, eLoc)) {
                            temp[temp.length] = eLoc;
                        }
                    }

                    documentOrder[eId] = i;
                }

                temp = temp.sort((x, y) => x.element.elevation() - y.element.elevation());
                groupped = {};

                // Groupping by elevation.
                for (var i = 0; i < temp.length; i++) {
                    curElevation = temp[i].element.elevation();    

                    if (!groupped[curElevation]) {
                        groupped[curElevation] = [];
                        sortedElevations[sortedElevations.length] = curElevation;
                    }

                    groupped[curElevation][groupped[curElevation].length] = temp[i];
                }

                // Appending each group document order.
                for (var i = 0; i < sortedElevations.length; i++) {
                    if ($.isArray(groupped[sortedElevations[i]])) {
                        sortByDocumentOrderAndAppend(groupped[sortedElevations[i]]);
                    }
                }
            }

            return ret;
        }

        /**
         * Returns element disposition.
         * @param {number} id Element Id.
         */
        public getElementDisposition(id: number): IElementDisposition {
            var ret = null, slides = [], elements = [], element = null,
                elementIndex = -1;

            if (id > 0) {
                slides = this.editor.presentation.slides();

                for (var i = 0; i < slides.length; i++) {
                    elements = slides[i].elements();

                    for (var j = 0; j < elements.length; j++) {
                        if (elements[j].id() == id) {
                            element = elements[j];
                            elementIndex = j;

                            break;
                        }
                    }

                    if (element != null) {
                        ret = {
                            slide: slides[i],
                            slideIndex: i,
                            element: element,
                            elementIndex: elementIndex
                        };

                        break;
                    }
                }
            }

            return ret;
        }

        /** 
         * Edits element link.
         * @param {Element} element Element to link to.
         */
        public editElementLink(element: Element) {
            var data = null;

            if (element) {
                data = {
                    id: element.id(),
                    slideId: element.slideId(),
                    slide: this.editor.slides.indexOf(element.navigateSlideId()),
                    totalSlides: this.editor.presentation.slides().length
                };

                ElementLinkModal.getInstance().open(data, {
                    save: (data) => {
                        var e = this.findElementById(data.id, data.slideId),
                            slide = this.editor.slides.findSlideByIndex(data.slide);

                        if (e) {
                            e.navigateSlideId(slide ? slide.id() : 0);
                            this.commitElementChanges(data.id, data.slideId);
                        }
                    }
                });
            }
        }

        /**
         * Toggles "locked" state of an element.
         * @param {Element} element Element.
         * @param {MouseEvent} event Event.
         */
        public toggleElementIsLocked(element: Element, event?: MouseEvent) {
            var t = null, isLocked = element.isLocked();

            if (event) {
                t = $(event.target || event.srcElement);
                
                if (!t.hasClass('element')) {
                    t = t.parents('.element');
                }

                isLocked = t.hasClass('element-locked');
            }

            element.isLocked(!isLocked);

            if (t) {
                t.toggleClass('element-locked', element.isLocked());
            }
        }

        /** 
         * Edits element live data.
         * @param {Element} element Element to edit live data for.
         */
        public editElementLiveData(element: Element) {
            var data = null, realtimeData = null;

            if (element) {
                realtimeData = element.realtimeData;

                data = {
                    id: element.id(),
                    type: element.type(),
                    slideId: element.slideId(),
                    sourceType: realtimeData ? realtimeData.sourceType() : 1,
                    endpoint: realtimeData ? realtimeData.endpoint() : '',
                    parameters: realtimeData ? realtimeData.parameters() : ''
                };

                RealtimeDataModal.getInstance().open(data, {
                    save: (data, callback) => {
                        var e = this.findElementById(data.id, data.slideId);

                        if (e) {
                            if (!e.realtimeData) {
                                e.realtimeData = new RealtimeDataConfiguration();
                            }

                            e.realtimeData.endpoint(data.endpoint);
                            e.realtimeData.sourceType(data.sourceType);
                            e.realtimeData.parameters(data.parameters);

                            this.commitElementChanges(data.id, data.slideId, () => {
                                (callback || function () { })();
                            });
                        }
                    }
                });
            }
        }

        /** Deletes all currently selected elements from the slide composition. */
        public tryDeleteSelection() {
            var app = Ifly.App.getInstance(),
                c = app.components['SlideSettingsModal'];

            if (!this._deleteSelectionConfirmModal) {
                this._deleteSelectionConfirmModal = app.openModal({
                    content: $('#element-delete-selection'),
                    buttons: [
                        {
                            text: c.terminology.deleteElements,
                            click: (sender, args) => {
                                this._deleteSelectionConfirmModal.close();
                                this.deleteSelection();
                            }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this._deleteSelectionConfirmModal.close(); },
                        }
                    ]
                });
            } else {
                this._deleteSelectionConfirmModal.open();
            }
        }

        /** Deletes all currently selected elements from the slide composition. */
        public deleteSelection() {
            var sel = this.getSelection(), ids = '';

            if (sel && sel.length) {
                for (var i = 0; i < sel.length; i++) {
                    this.selectedSlide.elements.remove(sel[i]);

                    this.infographic.removeElements(e => {
                        return parseInt(e.attr('data-elementid'), 10) == sel[i].id();
                    });

                    if (i > 0) {
                        ids += sel[i].id();

                        if (i < (sel.length - 1)) {
                            ids += ',';
                        }
                    }
                }

                Ifly.App.getInstance().api.delete('presentations/' +
                    Ifly.App.unwrap(this.selectedSlide.presentationId) + '/slides/' +
                    Ifly.App.unwrap(this.selectedSlide.id) + '/elements/{id}?also=' + ids, Ifly.App.unwrap(sel[0].id), null, true);

                this.editor.dispatchEvent('elementsDeleted', {
                    elements: sel
                });
            }
        }

        /** 
         * Deletes the given element from the slide composition.
         * @param {Element} element Element to delete.
         */
        public tryDeleteElement(element: Element) {
            var app = Ifly.App.getInstance(),
                c = app.components['SlideSettingsModal'];

            if (!this._deleteConfirmModal) {
                this._deleteConfirmModal = app.openModal({
                    content: $('#element-delete'),
                    buttons: [
                        {
                            text: c.terminology.deleteElement,
                            click: (sender, args) => {
                                this._deleteConfirmModal.close();
                                this.deleteElement(sender.data);
                            }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this._deleteConfirmModal.close(); },
                        }
                    ],
                    data: element
                });
            } else {
                this._deleteConfirmModal.open({ data: element });
            }
        }

        /** 
         * Deletes the given element from the slide composition.
         * @param {Element} element Element to delete.
         * @param {boolean} compositionOnly Value indicating whether to delete element from composition only (no API call is made).
         */
        public deleteElement(element: Element, compositionOnly?: boolean) {
            if (element) {
                this.selectedSlide.elements.remove(element);

                this.infographic.removeElements(e => {
                    return parseInt(e.attr('data-elementid'), 10) == element.id();
                }, compositionOnly);

                if (this.selectedElement.element == element && this.editor.gallery.elementProperties.isOpen()) {
                    this.editor.gallery.elementProperties.toggleVisibility();
                }

                if (!compositionOnly) {
                    Ifly.App.getInstance().api.delete('presentations/' +
                        Ifly.App.unwrap(this.selectedSlide.presentationId) + '/slides/' +
                        Ifly.App.unwrap(this.selectedSlide.id) + '/elements/{id}', Ifly.App.unwrap(element.id), null, true);

                    this.editor.dispatchEvent('elementsDeleted', {
                        elements: [element]
                    });
                }
            }
        }

        /** Removes focus from all the elements. */
        public unfocus() {
            if (this.infographic && this.infographic.slide) {
                this.infographic.slide.find('.element').blur();
            }
        }

        /** Selects the next element on the current slide. */
        public selectNextElement(): Element {
            this.unfocus();

            return this.selectElementWithDelta(1);
        }

        /** Selects the previous element on the current slide. */
        public selectPreviousElement(): Element {
            this.unfocus();

            return this.selectElementWithDelta(-1);
        }

        /** 
         * Selects the element with the given offset delta.
         * @param {number} delta Offset delta.
         */
        private selectElementWithDelta(delta: number): Element {
            var disposition = null, ret = null, elements = null;

            if (this.selectedElement && this.selectedElement.element) {
                disposition = this.getElementDisposition(this.selectedElement.element.id());

                if (disposition != null && disposition.element != null) {
                    elements = disposition.slide.elements();

                    if (elements.length > 1) {
                        if ((delta > 0 && disposition.elementIndex >= (elements.length - 1)) || (delta < 0 && disposition.elementIndex == 0)) {
                            ret = delta > 0 ? elements[0] : elements[elements.length - 1];
                        } else {
                            ret = elements[disposition.elementIndex + delta];
                        }

                        this.selectElement(ret);
                    }
                }
            }

            return ret;
        }

        /** Promotes the current element's elevation and returns the new one. */
        public promoteCurrentElement(): number {
            var ret = -1;

            this.unfocus();

            if (this.selectedElement && this.selectedElement.element) {
                ret = this.promoteElement(this.selectedElement.element);
            }

            return ret;
        }

        /** Demotes the current element's elevation and returns the new one. */
        public demoteCurrentElement(): number {
            var ret = -1;

            this.unfocus();

            if (this.selectedElement && this.selectedElement.element) {
                ret = this.demoteElement(this.selectedElement.element);
            }

            return ret;
        }

        /** 
         * Promotes the given element's elevation and returns the new one.
         * @param {Element} element Element to promote.
         */
        public promoteElement(element: Element): number {
            return this.promoteOrDemoteElement(element, true);
        }

        /** 
         * Demotes the given element's elevation and returns the new one.
         * @param {Element} element Element to demote.
         */
        public demoteElement(element: Element): number {
            return this.promoteOrDemoteElement(element, false);
        }

        /** 
         * Promotes or demotes the given element's elevation and returns the new one.
         * @param {Element} element Element to promote or demote.
         * @param {boolean} promote Value indicating whether to promote the element.
         */
        private promoteOrDemoteElement(element: Element, promote: boolean): number {
            var ret = 0, overlapping = [], elementIndex = -1, n = null, nPrev = null,
                prevIndex = -1, curElevation = 0, tmp = null, queueUrl = '';

            if (element && element.position() == ElementPosition.free) {
                overlapping = this.getOverlappingElements(element.id(), element, null);
                
                if (overlapping && overlapping.length > 1) {
                    for (var i = 0; i < overlapping.length; i++) {
                        if (overlapping[i].element.id() == element.id()) {
                            elementIndex = i;
                            break;
                        }
                    }

                    if ((promote && elementIndex < (overlapping.length - 1)) || (!promote && elementIndex > 0)) {
                        prevIndex = promote ? (elementIndex + 1) : (elementIndex - 1);

                        tmp = overlapping[prevIndex];
                        overlapping[prevIndex] = overlapping[elementIndex];
                        overlapping[elementIndex] = tmp;

                        n = overlapping[prevIndex].node;
                        nPrev = overlapping[elementIndex].node;

                        n.removeClass('element-promoting element-demoting');

                        setTimeout(() => {
                            n.addClass(promote ? 'element-promoting' : 'element-demoting');

                            setTimeout(() => {
                                n.removeClass('element-promoting element-demoting');
                            }, 305);
                        }, 5);

                        nPrev.removeClass('element-elevation-ref');

                        setTimeout(() => {
                            nPrev.addClass('element-elevation-ref');
                        }, 5);

                        setTimeout(() => {
                            nPrev.removeClass('element-elevation-ref');
                        }, 305);

                        for (var i = 0; i < overlapping.length; i++) {
                            overlapping[i].element.elevation(curElevation++);

                            if (overlapping[i].element.id() == element.id()) {
                                ret = curElevation - 1;
                            }

                            this.infographic.updateElementElevation(overlapping[i].element.serialize(), overlapping[i].node);
                        }

                        queueUrl = 'presentations/' + Ifly.App.unwrap(this.selectedSlide.presentationId) + '/slides/' +
                            Ifly.App.unwrap(this.selectedSlide.id) + '/elements/{id}/elevate';

                        queueUrl += ('?_elements=' + ko.utils.arrayMap(overlapping, o => <number>o.element.id()).sort((x, y) => x - y).join(','));
                        
                        /* Queuing the given element to be updated. */
                        Ifly.App.getInstance().api.enqueue(queueUrl, (url: string, api: Ifly.ApiEndpoint) => {
                            api.put(url, {
                                id: element.id(),
                                elevation: ko.utils.arrayMap(overlapping, o => {
                                    return {
                                        elementId: o.element.id(),
                                        elevation: o.element.elevation()
                                    };
                                })
                            }, null, true);
                        }, 2000);
                    }
                }
            }

            return ret;
        }

        /** 
         * Copies the given element.
         * @param {Element} element Element to copy.
         */
        public copyElement(element: Element) {
            this.copyElementInternal(element);
        }

        /** 
         * Copies the given element.
         * @param {Element} element Element to copy.
         * @param {boolean} throttle Value indicating whether to throttle copy operation.
         */
        private copyElementInternal(element: Element, throttle?: boolean) {
            var pasteButton = null;

            if (!throttle) {
                if (element) {
                    this.editor.gallery.clipboard.data(element.serialize());

                    /* Hiding element properties pane so we can see the "copied" icon. */
                    if (this.editor.gallery.elementProperties.isOpen()) {
                        this.editor.gallery.elementProperties.toggleVisibility();
                    }

                    pasteButton = $('.paste-element');

                    /* Notifying the user that there's something in the buffer. */
                    setTimeout(() => {
                        pasteButton.addClass('pulse')
                            .unbind('mouseover')
                            .bind('mouseover', () => {
                                pasteButton.removeClass('pulse');
                            });
                    }, 300);
                }
            } else {
                clearTimeout(this._copyElementTimer);
                this._copyElementTimer = setTimeout(() => {
                    this.copyElementInternal(element);
                }, 10);
            }
        }

        /** 
         * Pastes the given element onto the current slide.
         * @param {Element} element Element to pasted (if omitted, will be taken from clipboard).
         */
        public pasteElement(element?: Element): boolean {
            var ret = (typeof (element) != 'undefined' && element != null) ||
                !this.editor.gallery.clipboard.isEmpty();

            if (ret) {
                this.editor.gallery.pasteElement(element);
            }

            return ret;
        }

        public nextElementOrder(slide: Slide): number {
            var ret = -1, elements = slide.elements();

            for (var i = 0; i < elements.length; i++) {
                if (elements[i].order() >= ret) {
                    ret = elements[i].order() + 1;
                }
            }

            if (ret < 0) {
                ret = 0;
            }

            return ret;
        }

        public moveElementUp(element: Element, slide?: Slide, recompose?: boolean) {
            this.moveElement(element, -1, slide, recompose);
        }

        public moveElementDown(element: Element, slide?: Slide, recompose?: boolean) {
            this.moveElement(element, 1, slide, recompose);
        }

        private moveElement(element: Element, delta: number, slide?: Slide, recompose?: boolean) {
            var elements = [], filteredElements = [], currentOrder = 0, reordered = null;

            if (!slide && this.selectedSlide) {
                slide = this.selectedSlide;
            }

            if (slide && element) {
                currentOrder = element.order() + delta;
                filteredElements = elements.filter(v => v.position() == element.position());

                if (currentOrder >= 0 && currentOrder < filteredElements.length) {
                    for (var i = 0; i < filteredElements.length; i++) {
                        if (filteredElements[i].order() == currentOrder) {
                            filteredElements[i].order(currentOrder + (delta * -1));
                            break;
                        }
                    }
                }

                if (this.selectedElement.element == element || recompose) {
                    reordered = this.infographic.moveElement(element.serialize(), delta);
                    this.commitElementReoder(element.slideId(), reordered);
                }
            }
        }

        /**
         * Updates element which is bound to a given DOM node.
         * @param {Element} element Element whose properties to update.
         * @param {JQuery} node DOM node associated with an element.
         */
        public updateElementWithNode(element: Element, node: JQuery): JQuery {
            return $(this.infographic.ensureElement(element.serialize(), node));
        }

        /** Clears theme-based element styles and re-applies classes from the current theme. */
        public updateThemeBasedStyles(container: JQuery) {
            container.find('.theme-based')
                .removeClass((i, c) => {
                    var list = (c || '').split(' ');
                    return $.grep(list, e => e != 'theme-based' && e.indexOf('theme-') == 0).join(' ');
                })
                .addClass('theme-' + this.editor.presentation.theme());
        }

        /**
         * Refreshes drag coordinates.
         * @param {JQuery} node Element node.
         * @param {boolean} isVisible Value indicating whether coordinates are visible.
         * @param {number} x X-coordinate (in pixels).
         * @param {number} y Y-coordinate (in pixels).
         */
        private refreshDragCoordinates(node: JQuery, isVisible: boolean, x?: number, y?: number) {
            var coordinates = node.find('.element-current-coordinates'), coordinatesValue = null,
                coordinatesOverlay = null, coordinatesInner = null, update = true;

            if (isVisible && !coordinates.length) {
                coordinates = $('<div class="element-current-coordinates"></div>');

                coordinatesOverlay = $('<div class="element-current-coordinates-overlay"></div>');
                coordinatesInner = $('<div class="element-current-coordinates-inner"></div>');
                coordinatesValue = $('<span>');

                coordinatesInner.append(coordinatesValue);

                coordinates.append(coordinatesOverlay);
                coordinates.append(coordinatesInner);
                
                node.append(coordinates);
            } else if (!isVisible) {
                update = false;

                if (coordinates.length) {
                    coordinates.remove();
                }
            }

            if (update) {
                if (!coordinatesValue) {
                    coordinatesValue = coordinates.find('span');
                }

                coordinatesValue.text(Math.round(y) + ', ' + Math.round(x));
            }
        }

        /**
         * Renders context menu for a given editable element.
         * @param {JQuery} node Element node.
         */
        private renderContextMenu(node: JQuery) {
            var hasLiveData = Ifly.Editor.getInstance().user.subscription.type() != SubscriptionType.basic,
                menu = $('<div class="element-context-menu' + (hasLiveData ? ' element-context-menu-p1' : '') + '"></div>'),
                menuOverlay = $('<div class="element-context-menu-overlay"></div>'),
                menuInner = $('<div class="element-context-menu-inner"></div>'),
                c = Ifly.App.getInstance().components['SlideManager'],
                list = $('<ul />'), item = (contents, css?: string) => { return $('<li />').addClass(css || '').append(contents); },
                button = (title, cssClass, onClick) => { return $('<button />').attr('title', title).append($('<span />').addClass(cssClass)).click(onClick); };

            var onContextMenu = (action: Function, e: any) => {
                action.apply(this);
                e.stopPropagation();
            }

            list.append(item(button(c.terminology.moveElementUp, 'icon-chevron-up', (e) => { onContextMenu(() => { this.moveElementUp(this.findElement(node), null, true); }, e); })));
            list.append(item(button(c.terminology.moveElementDown, 'icon-chevron-down', (e) => { onContextMenu(() => { this.moveElementDown(this.findElement(node), null, true); }, e); })));
            list.append(item(button(c.terminology.lockElement, 'icon-lock', (e) => { onContextMenu(() => { this.toggleElementIsLocked(this.findElement(node), e); }, e); })));
            list.append(item(button(c.terminology.copyElement, 'icon-file', (e) => { onContextMenu(() => { this.copyElement(this.findElement(node)); }, e); }), 'context-menu-item-copy'));

            if (hasLiveData) {
                list.append(item(button(c.terminology.editElementLiveData, 'icon-bolt', (e) => { onContextMenu(() => { this.editElementLiveData(this.findElement(node)); }, e); }), 'context-menu-item-livedata'));
            }

            list.append(item(button(c.terminology.deleteElement, 'icon-remove', (e) => { onContextMenu(() => { this.tryDeleteElement(this.findElement(node)); }, e); }), 'context-menu-item-remove'));

            menuInner.append(list);

            menu.append(menuOverlay);
            menu.append(menuInner);

            node.append(menu);

            /* Duplicated activation logic from Infographic.js */
            menu.hover(e => {
                var currentlyActive = this.infographic.slide.find('.element.element-over');

                if (currentlyActive.attr('id') != node.attr('id')) {
                    currentlyActive.removeClass('element-over');
                }

                node.addClass('element-over');
            });
        }

        /** Updates the "Up" and "Down" context menu buttons' availability. */
        private updateContextMenuOptions() {
            var self = this, hasLiveData = Ifly.Editor.getInstance().user.subscription.type() != SubscriptionType.basic;

            this.infographic.slide.find('.element').each(function() {
                var e = $(this), cm = e.find('.element-context-menu'), cmItems = cm.find('button'), eOffset = null, cmWidth = 0, cmHeight = 0,
                    isTitleOrDescription = (n) => { return n.hasClass('type-title') || n.hasClass('type-description'); }, slideWidth = 0, eWidth = 0;

                /* Not examining title & description. */
                if (cmItems.length > 0) {
                    cmItems[0].disabled = !self.infographic.hasPreviousElement(e, (n) => { return !isTitleOrDescription(n); });
                    cmItems[1].disabled = !self.infographic.hasNextElement(e);

                    if (hasLiveData) {
                        cmItems[4].disabled = e.hasClass('type-widget') || e.hasClass('type-line');
                    }

                    eWidth = e.width();
                    eOffset = e.offset();
                    cmWidth = cm.width();
                    cmHeight = cm.height();
                    slideWidth = self.infographic.slide.width();

                    cm.removeAttr('style');

                    /* Inverting context menu position if element is placed too high on a slide. */
                    cm.toggleClass('element-context-menu-invert', eOffset.top < (cmHeight + 25)); 

                    /* Placing context menu on the left when element is dragged all the way to the right. */
                    cm.toggleClass('element-context-menu-invert-left', (eOffset.left + eWidth) > slideWidth);

                    /* Placing context menu on the right when element is dragged all the way to the left. */
                    cm.toggleClass('element-context-menu-invert-right', eOffset.left < 0 && Math.abs(eOffset.left) > (Math.abs(eWidth - cmWidth)));

                    /* When placed on a left, we have to calculate "left" position manually. */
                    if (cm.hasClass('element-context-menu-invert-left')) {
                        cm.css({
                            left: (-1 * cmWidth - 5) + 'px'
                        });
                    }

                    /* When placed on a right, we have to calculate "right" position manually. */
                    if (cm.hasClass('element-context-menu-invert-right')) {
                        cm.css({
                            right: (-1 * cmWidth - 5) + 'px'
                        });
                    }
                }
            });
        }

        /** 
         * Commits changes to a given element to the server.
         * @param {number} id Element Id.
         * @param {number} slideId Slide Id.
         * @param {Function} complete A function which is executed when data is committed.
         */
        private commitElementChanges(id: number, slideId: number, complete?: Function) {
            if (!this._isLoadingSlide && id > 0) {
                /* Queuing the given element to be updated. */
                Ifly.App.getInstance().api.enqueue('presentations/' +
                    Ifly.App.unwrap(this.selectedSlide.presentationId) + '/slides/' +
                    Ifly.App.unwrap(this.selectedSlide.id) + '/elements/' + id, (url: string, api: Ifly.ApiEndpoint) => {
                        var element = this.findElementById(id, slideId);

                        api.put(url, element.serialize(), complete, true);
                        
                        this.editor.dispatchEvent('elementsUpdated', {
                            elements: [element]
                        });
                    });
            }
        }

        /** 
         * Commits order to a given element(s) to the server.
         * @param {number} id Element Id.
         * @param {object} ordering Element ordering.
         */
        private commitElementReoder(slideId: number, ordering: any) {
            var queueUrl = '', less = null, greater = null, slide;

            if (!this._isLoadingSlide && ordering) {
                less = ordering.first.id > ordering.second.id ? ordering.second : ordering.first;
                greater = ordering.first.id > ordering.second.id ? ordering.first : ordering.second;

                /* The queue URL doesn't contain volatile data (new order) because we want the subsequent pending update to overwrite each other properly (cancel previous queued items). */
                queueUrl = 'presentations/' +
                    Ifly.App.unwrap(this.selectedSlide.presentationId) + '/slides/' +
                    Ifly.App.unwrap(this.selectedSlide.id) + '/elements/reorder?firstId=' + less.id + '&secondId=' + greater.id;

                /* Queuing the given element to be updated. */
                Ifly.App.getInstance().api.enqueue(queueUrl, (url: string, api: Ifly.ApiEndpoint) => {
                    slide = this.editor.slides.findSlideById(slideId);

                    api.put(url + '&firstOrder=' + less.order + '&secondOrder=' + greater.order, null, null, true);

                    if (slide) {
                        this.editor.dispatchEvent('elementsUpdated', {
                            elements: [
                                this.findElementById(ordering.first.id, slideId),
                                this.findElementById(ordering.second.id, slideId)
                            ]
                        });
                    }
                });
            }
        }

        /** 
         * Bulk-updates element position.
         * @param {number} id Element Id.
         * @param {number} slideId Slide Id.
         * @param {Array} others Other positions.
         * @param {Function} complete A function which is executed when data is committed.
         */
        private bulkUpdatePosition(id: number, slideId: number, others: { id: number; left: number; top: number }[], complete?: Function) {
            var queueHash = '', also = '', slide;

            others.sort((x, y) => x.id - y.id);

            queueHash = ko.utils.arrayMap(others, o => o.id).join(',');
            ko.utils.arrayForEach(others, o => {
                also += (o.id + ':' + o.left + ':' + o.top) + '#';
            });

            if (!this._isLoadingSlide && id > 0) {
                /* Queuing the given element to be updated. */
                Ifly.App.getInstance().api.enqueue('presentations/' +
                    Ifly.App.unwrap(this.selectedSlide.presentationId) + '/slides/' +
                    Ifly.App.unwrap(this.selectedSlide.id) + '/elements/' + id + '/position?_h=' + queueHash, (url: string, api: Ifly.ApiEndpoint) => {
                        api.put(url + '&also=' + encodeURIComponent(also) + '/-/', this.findElementById(id, slideId).serialize(), complete, true);
                    });

                slide = this.editor.slides.findSlideById(slideId);

                if (slide) {
                    this.editor.dispatchEvent('elementsUpdated', {
                        elements: ko.utils.arrayPushAll([
                            this.findElementById(id, slideId)
                        ], ko.utils.arrayMap(others, o => {
                            return this.findElementById(o.id, slideId);
                        }))
                    });
                }
            }
        }

        /** Updates the grid. */
        private updateGrid() {
            var c = $(this.host || document).find('.canvas'),
                show = !!this.showGrid() && this.selectedSlide != null,
                grid = c.find('.grid'), pos = 0,
                rw = 0, rh = 0, size = 50,
                visible = grid.hasClass('active'),
                beforeVisibilityChanged = null;

            beforeVisibilityChanged = () => {
                if (show) {
                    rw = Math.floor(c.width() / size);
                    rh = Math.floor(c.height() / size);
                    pos = (-1 * (size / 2));

                    grid.css({
                        top: pos + 'px',
                        left: pos + 'px',
                        right: (pos - 10) + 'px',
                        bottom: (pos - 10) + 'px'
                    }).empty();

                    for (var i = 0; i <= rh; i++) {
                        for (var j = 0; j <= rw; j++) {
                            $('<div />', {
                                width: size,
                                height: size
                            }).appendTo(grid);
                        }
                    }
                }
            };

            if (this._gridShowHideTimeout) {
                clearTimeout(this._gridShowHideTimeout);
                this._gridShowHideTimeout = null;
            }

            if (show && !visible) {
                grid.show();

                this._gridShowHideTimeout = setTimeout(() => {
                    beforeVisibilityChanged();

                    setTimeout(() => {
                        grid.addClass('active');
                    }, 5);
                }, 10);
            } else if (!show && visible) {
                grid.removeClass('active');

                this._gridShowHideTimeout = setTimeout(() => {
                    grid.hide();
                }, 315);
            } else {
                grid.toggle(show);
            }
        }
    }
}