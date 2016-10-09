/// <reference path="../Typings/jquery.d.ts" />
/// <reference path="../Typings/knockout.d.ts" />

module Ifly.Utils {
    /** Represents a binding handler. */
    export interface IBindingHandler {
        /** Initializes a handler. */
        initialize();
    }

    /** Represents number handler options. */
    export interface INumberHandlerOptions {
        /** Gets or sets the value which should reflect the change. */
        value: KnockoutObservable<number>;

        /** Gets or sets value update event. */
        valueUpdate?: string;

        /** Gets or sets value indicating whether to allow floating point in a number. */
        allowFloatingPoint?: boolean;

        /** Gets or sets the lower bound (either a static value or an observable). */
        minimum?: any;

        /** Gets or sets the upper bound (either a static value or an observable). */
        maximum?: any;
    }

    /** Represents a tooltip binding handler. */
    export class TooltipHandler implements IBindingHandler {
        private _timer: number;

        /** Initializes a handler. */
        public initialize() {
            var self = this;

            ko.bindingHandlers['tooltip'] = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    self.ensureLayout(element, self.evaluatePossibleObservable(valueAccessor().text),
                        self.evaluatePossibleObservable(valueAccessor().icon), self.evaluatePossibleObservable(valueAccessor().title));

                    $(element).mouseenter(() => self.show(element)).mouseleave(() => self.hide(element));
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    self.ensureLayout(element, self.evaluatePossibleObservable(valueAccessor().text),
                        self.evaluatePossibleObservable(valueAccessor().icon), self.evaluatePossibleObservable(valueAccessor().title));
                }
            };
        }

        public evaluatePossibleObservable(v) {
            return v && typeof (v.apply) === 'function' ? v() : v;
        }

        public ensureLayout(element, text, icon, title) {
            var hasTitle = title != null && title.length > 0,
                hasIcon = icon != null && icon.length > 0,
                t = $(element).next('.tooltip'),
                textElement = null;
            
            if (!t.length) {
                t = $('<div class="tooltip">')
                    .append('<div class="tooltip-corner">')
                    .append('<div class="tooltip-text">')
                    .hide().insertAfter(element);

                this.ensurePosition(element, t);
            }

            t.toggleClass('contains-icon', hasIcon);
            t.toggleClass('contains-title', hasTitle);

            textElement = t.find('.tooltip-text').empty();
            textElement.toggleClass('tooltip-text-with-icon', hasIcon);

            if (hasTitle) {
                textElement.append($('<h3 />').html(title));
            }

            if (hasIcon) {
                textElement.append($('<i class="icon icon-' + icon + '" />'));
            }

            textElement.append($('<span />').html(text));
        }

        public ensurePosition(element, tooltip) {
            tooltip.css({
                'left': (element.offsetLeft + ($(element).outerWidth() - 2)) + 'px',
                'top': (element.offsetTop + (($(element).height() / 2) - 24)) + 'px'
            });
        }

        public show(element) {
            var t = $(element).next('.tooltip');

            if (t.length) {
                t = $(t.get(0));

                this.ensurePosition(element, t);

                if (this._timer) {
                    clearTimeout(this._timer);
                }

                t.show();

                this._timer = setTimeout(() => {
                    t.addClass('visible');
                }, 25);
            }
        }

        public hide(element) {
            var t = $(element).next('.tooltip');

            if (t.length) {
                t = $(t.get(0));

                if (this._timer) {
                    clearTimeout(this._timer);
                }

                t.removeClass('visible');

                this._timer = setTimeout(() => {
                    t.hide();
                }, 325);
            }
        }
    }

    /** Represents a percentage binding handler. */
    export class PercentageHandler implements IBindingHandler {
        /** Initializes a handler. */
        public initialize() {
            var self = this;

            ko.bindingHandlers['percentage'] = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var elm = $(element), valueUpdate = (valueAccessor() || {}).valueUpdate, valueChangeTimer = null,
                        valueUserUpdateTimer = null;

                    elm.bind('keydown', e => {
                        var o = valueAccessor() || {}, code = 0, t = (<any>e.target),
                            val = parseInt(t.value, 10), newVal = 0, valueChaged = false;

                        if (!!o.keyboardNavigation) {
                            code = e.keyCode || e.charCode || e.which;

                            if (code == 38 || code == 40) {
                                if (isNaN(val) || val == null) {
                                    val = 0;
                                }

                                if (code == 38) {
                                    if (val < 100) {
                                        newVal = val + 1;
                                        t.value = newVal;
                                        valueChaged = true;
                                    }
                                } else if (code == 40) {
                                    if ((!o.allowNegative && val > 0) || (o.allowNegative && val > -100)) {
                                        newVal = val - 1;
                                        t.value = newVal;
                                        valueChaged = true;
                                    }
                                }

                                if (o.field && valueChaged) {
                                    if (valueChangeTimer) {
                                        clearTimeout(valueChangeTimer);
                                    }

                                    valueChangeTimer = setTimeout(() => {
                                        o.field(newVal);
                                    }, 100);
                                }
                            }
                        }
                    });

                    elm.bind('change blur', e => {
                        self.formatValue(elm, valueAccessor(), (<any>e.target).value);
                    });

                    if (valueUpdate && valueUpdate.length) {
                        elm.bind(valueUpdate, e => {
                            var code = e.keyCode || e.charCode || e.which, t = (<any>e.target),
                                ignoreCodes = [37, 38, 39, 40, 16, 17, 18, 9, 91, 189];

                            if (!ko.utils.arrayFilter(ignoreCodes, k => k == code).length) {
                                if (valueUserUpdateTimer) {
                                    clearTimeout(valueUserUpdateTimer);
                                }

                                valueUserUpdateTimer = setTimeout(() => {
                                    self.formatValue(elm, valueAccessor(), t.value);
                                }, 250);
                            }
                        });
                    }

                    elm.bind('focus', e => {
                        var v = (<any>e.target).value;

                        if (v && v.length && v.indexOf('%') >= 0) {
                            v = v.replace(/%/g, '');
                        }

                        if (!Utils.Input.getInt(v)) {
                            v = '';
                        }

                        (<any>e.target).value = v;

                        setTimeout(() => {
                            try {
                                (<any>e.target).select();
                            } catch (ex) { }
                        }, 10);
                    });
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    self.formatValue($(element), valueAccessor());
                }
            };
        }

        /** 
         * Formats the value.
         * @param {JQuery} element Element.
         * @param {object} options Options.
         * @param {object} value Value.
         */
        private formatValue(element: JQuery, options: any, value?: any) {
            var isLiteral = false,
                o = options || {},
                boundProperty = o.field,
                allowNegative = !!o.allowNegative,
                c = Ifly.App.getInstance().components['BindingHandlers'],
                v = parseInt((typeof (value) != 'undefined' && value != null) ? value : o.field(), 10);
            
            if (isNaN(v) || v == null || (!allowNegative && v <= 0) || (allowNegative && (v == 0 || v < -100))) {
                if (o.auto && c && c.percentage && c.percentage.terminology) {
                    v = element.is(':focus') ? '' : c.percentage.terminology.auto;
                    isLiteral = true;
                } else {
                    v = 0;
                }
            } else if (v > 100) {
                v = 100;
            }
            
            element.val(v + (isLiteral ? '' : '%'));

            if (boundProperty) {
                boundProperty(v);
            }
        }
    }

    /** Represents a font size scale binding handler. */
    export class FontSizeScaleHandler implements IBindingHandler {
        /** Initializes a handler. */
        public initialize() {
            var self = this;

            ko.bindingHandlers['fontSizeScale'] = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var elm = $(element), container = null, isDragging = false, rulerContainer = null, pixelFontSize = 0, showTracker = null,
                        options = valueAccessor(), field = options.field, doc = $(document), circleHeight = 0, vwFontSize = 0,
                        circle = $('<div class="circle"></div>'), initialValue = field(), 
                        documentMouseMove = e => {
                            if (isDragging) {
                                rulerContainer.addClass('active');
                                self.updateValue(container, field, circleHeight, e);
                            }
                        },
                        documentMouseUp = e => {
                            isDragging = false;
                            rulerContainer.removeClass('active');
                        };

                    container = $('<div class="font-scale-slider"></div>');

                    container.append($('<div class="font-scale-legend small"></div>').text(options.labels.small));
                    container.append($('<div class="font-scale-legend medium"></div>').text(options.labels.medium));
                    container.append($('<div class="font-scale-legend large"></div>').text(options.labels.large));

                    rulerContainer = $('<div class="font-scale-ruler-container"></div>');
                    container.append(rulerContainer.append($('<div class="font-scale-ruler"></div>').append(circle)));

                    elm.append(container);

                    pixelFontSize = parseFloat(parseFloat($(document.body).css('font-size')).toFixed(4));
                    vwFontSize = parseFloat(parseFloat(circle.css('max-width')).toFixed(4));

                    circleHeight = Math.floor(parseFloat(parseFloat(circle.css('height')).toFixed(4)) * pixelFontSize / vwFontSize);

                    circle.on('mousedown', e => {
                        isDragging = true;
                        self.updateValue(container, field, circleHeight);
                    });

                    doc.on('mousemove', documentMouseMove);
                    doc.on('mouseup', documentMouseUp);

                    self.setCirclePosition(initialValue != null && !isNaN(initialValue) ? initialValue : 0, circle, circleHeight);

                    if (typeof (field.sliderValue) == 'undefined') {
                        field.sliderValue = ko.observable<number>();
                    }

                    field.sliderValue.subscribe(v => {
                        self.setCirclePosition(v, circle, circleHeight);
                    });

                    if (options.show) {
                        elm.parents('button, a').click(e => {
                            if (!$(e.target).parents('.font-scale-slider').length) {
                                options.show(self, {});
                            }
                        });
                    }

                    elm.parents('button, a').mousedown(e => {
                        if (!$(e.target).parents('.font-scale-slider').length) {
                            elm.parents('.dropdown-container').addClass('font-scale-slider-visible');

                            clearInterval(showTracker);

                            showTracker = setInterval(() => {
                                if (!elm.parents('.richtext-dropdown-menu:visible').length) {
                                    clearInterval(showTracker);
                                    elm.parents('.dropdown-container').removeClass('font-scale-slider-visible');
                                }
                            }, 10);
                        }
                    });
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) { }
            };
        }

        /** 
         * Updates slider value.
         * @param {JQuery} container Container.
         * @param {Function} field Field.
         * @param {number} circleHeight Circle height (in pixels).
         * @param {MouseEvent} e Event.
         */
        private updateValue(container: JQuery, field: (v: number) => any, circleHeight: number, e?: MouseEvent) {
            var circle = container.find('.circle'), pos = -1,
                ruler = null, rulerTop = 0, rulerHeight = 0, relativeTop = 0;

            if (e) {
                ruler = circle.parent();
                rulerTop = ruler.offset().top;
                rulerHeight = ruler.height();

                if (rulerTop > 0 && rulerHeight > 0) {
                    relativeTop = e.pageY - rulerTop;
                    pos = relativeTop > 0 ? parseInt(Math.ceil(100 * relativeTop / rulerHeight).toString(), 10) : 0;

                    if (pos < 0) pos = 0;
                    else if (pos > 100) pos = 100;
                    else if (pos >= 45 && pos <= 55) pos = 50;

                    this.setCirclePosition(pos, circle, circleHeight);
                }
            } else {
                pos = this.parseCirclePosition(circle);
            }

            if (!isNaN(pos) && pos >= 0) {
                field(pos);
            }
        }

        /** 
         * Sets circle position.
         * @param {number} percentage Percentage value.
         * @param {JQuery} circle Circle DOM element reference.
         * @param {number} circleHeight Circle height (in pixels).
         */
        private setCirclePosition(percentage: number, circle: JQuery, circleHeight: number) {
            circle.css('top', 'calc(' + percentage + '% - ' + (circleHeight / 2) + 'px)');
        }

        /** 
         * Parses circle position.
         * @param {JQuery} circle Circle DOM element reference.
         */
        private parseCirclePosition(circle: JQuery): number {
            var ret = 0, styleValue = circle.attr('style'), m = null;

            if (styleValue && styleValue.length) {
                m = styleValue.match(/([0-9]+)%/gi);
                if (m != null && m.length > 0) {
                    ret = parseInt(m[0], 10);
                }
            }

            return ret;
        }
    }

    /** Represents an upload binding handler. */
    export class UploadButtonHandler implements IBindingHandler {
        /** Initializes a handler. */
        public initialize() {
            ko.bindingHandlers['upload'] = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    UploadButtonHandler.resetInput(element);
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) { }
            };
        }

        /** 
         * Resets the file input.
         * @param {object} element Element.
         */
        public static resetInput(element) {
            var elm = $(element);

            elm.find('input').remove()
            elm.append($('<input type="file" />'));

            UploadButtonHandler.initializeInput(element);
        }

        /** 
         * Initializes the file input.
         * @param {object} element Element.
         */
        private static initializeInput(element) {
            var elm = $(element), upload = elm.find('input'), data = null;

            data = ko.dataFor(elm[0]);

            if (data) {
                upload.change((e) => { data.onFileSelected(e); });
            }

            elm.bind('mousemove', (e) => {
                var offset = elm.offset(),
                    x = e.pageX - offset.left,
                    y = e.pageY - offset.top;

                upload.css({
                    left: (x - 5) + 'px',
                    top: (y - 5) + 'px'
                });
            });
        }
    }

    /** Represents a typeahead binding handler. */
    export class TypeAheadBindingHandler implements IBindingHandler {
        /** Initializes a handler. */
        public initialize() {
            var timeoutId = -1;

            ko.bindingHandlers['typeahead'] = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var elm = $(element), p = elm.parent(), preventResuggest = false;

                    var selectItem = (et: any, menu: any, closeMenu?: boolean) => {
                        var acc = null, v = null;

                        if (et && et.length) {
                            acc = valueAccessor();

                            elm.val(et.text());

                            if (typeof (viewModel['realValue']) == 'function') {
                                viewModel['realValue'](et.attr('data-value'));
                                acc(et.text());
                            } else {
                                acc(et.attr('data-value'));
                            }

                            if (typeof (closeMenu) == 'undefined' || closeMenu == null || !!closeMenu) {
                                menu.find('li.active').removeClass('active');
                                menu.removeClass('active');
                            } else {
                                preventResuggest = true;
                            }
                        }
                    }

                    var getAndShowSuggestions = (e) => {
                        var v = e.target.value, t = v && v.length ? viewModel['suggest'](v) : [], code = e.keyCode || e.which || e.charCode, nextActiveItem = null,
                            ul = null, sug = $(e.target).parent().find('.typeahead-suggestion'), wasActive = sug.hasClass('active'), curActiveItem = null, m = null;

                        if (!preventResuggest) {
                            sug.removeClass('active');
                        }

                        if (t && t.length) {
                            if (!preventResuggest) {
                                sug.empty();

                                ul = $('<ul />').appendTo(sug).mousedown(e => {
                                    var et = $(e.target), tag = et[0].tagName || et[0].nodeName || '';

                                    if (tag.toLowerCase() == 'a') {
                                        selectItem(et, sug);
                                    }
                                });

                                ko.utils.arrayForEach(t, (i: any) => {
                                    ul.append($('<li />').attr('title', i.label || i).append($('<a />').attr({
                                        'href': 'javascript:void(0);',
                                        'data-value': i.value || i
                                    }).text(i.label || i)));
                                });

                                sug.addClass('active');
                            } else {
                                preventResuggest = false;
                            }

                            if (wasActive && (code == 38 || code == 40 || code == 13)) {
                                m = sug.find('ul'), curActiveItem = m.find('li.active');

                                if (code == 13 && curActiveItem.length) {
                                    selectItem(curActiveItem.find('a'), sug);
                                } else {
                                    curActiveItem.removeClass('active');

                                    if (!curActiveItem.length) {
                                        nextActiveItem = m.find('li:first-child');
                                    } else {
                                        if (code == 38) { /* "Up" arrow */
                                            nextActiveItem = curActiveItem.prev();
                                            if (!nextActiveItem.length) {
                                                nextActiveItem = m.find('li:last-child');
                                            }
                                        } else if (code == 40) { /* "Down" arrow */
                                            nextActiveItem = curActiveItem.next();
                                            if (!nextActiveItem.length) {
                                                nextActiveItem = m.find('li:first-child');
                                            }
                                        }
                                    }

                                    nextActiveItem.addClass('active');

                                    selectItem(nextActiveItem.find('a'), sug, false);
                                }
                            }
                        }
                    };

                    if (!p.hasClass('typeahead')) {
                        $('<div class="typeahead" />')
                            .append(elm, $('<div class="typeahead-suggestion" />'))
                            .insertAfter(p);
                    }

                    elm.unbind('keyup.typeahead').bind('keyup.typeahead', (e) => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            timeoutId = null;
                        }

                        timeoutId = setTimeout(() => {
                            getAndShowSuggestions(e);
                        }, 25);
                    });

                    elm.unbind('blur.typeahead').bind('blur.typeahead', (e) => {
                        var sug = $(e.target).parent().find('.typeahead-suggestion');

                        setTimeout(() => {
                            sug.removeClass('active');
                        }, 50);
                    });
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) { }
            };
        }
    }

    export class NumberHandler implements IBindingHandler {
        /** Initializes a handler. */
        public initialize() {
            ko.bindingHandlers['number'] = {
                init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    var o = <INumberHandlerOptions>valueAccessor(), $element = $(element),
                        examineValue = v => {
                            var min = null, max = null, valueChanged = false, isInitiallyNumber = false,
                                parsed = 0, containsValue = false, getBound = b => b != null ? (typeof (b) == 'function' ? b() : b) : null;

                            if (v != null && ((typeof (v) == 'string' && v.length > 0) || (isInitiallyNumber = typeof (v) == 'number'))) {
                                if (isInitiallyNumber) {
                                    parsed = v;
                                } else {
                                    if (!o.allowFloatingPoint) {
                                        parsed = parseInt(v, 10);
                                    } else {
                                        parsed = parseFloat(v);
                                    }
                                }

                                containsValue = !isNaN(parsed) && parsed != null;

                                if (containsValue) {
                                    valueChanged = !v.toString().match(!o.allowFloatingPoint ? /^[0-9]+$/gi : /^[0-9\.]+$/gi);

                                    min = getBound(o.minimum);
                                    max = getBound(o.maximum);

                                    if (min != null || max != null) {
                                        if (min != null && parsed < min) {
                                            valueChanged = true;
                                            parsed = min;
                                        }

                                        if (max != null && parsed > max) {
                                            valueChanged = true;
                                            parsed = max;
                                        }
                                    }

                                    o.value(parsed);

                                    if (valueChanged) {
                                        $element.val(parsed.toString());
                                    }
                                } else {
                                    $element.val('');
                                    o.value(null);
                                }
                            } else {
                                $element.val('');
                                o.value(null);
                            }
                        };

                    $element.change(e => {
                        examineValue($(e.target).val());
                    });

                    if (o.valueUpdate) {
                        $element.bind(o.valueUpdate, e => {
                            examineValue($(e.target).val());
                        });
                    }

                    o.value.subscribe(v => { examineValue(v); });
                },
                update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                    $(element).val(valueAccessor().value());
                }
            };
        }
    }

    /** Represents a binding handler factory. */
    export class BindingHandlerFactory {
        /** initializes all handler. */
        public static initializeAllHandlers(): IBindingHandler[]{
            var ret = [
                new TypeAheadBindingHandler(),
                new UploadButtonHandler(),
                new FontSizeScaleHandler(),
                new PercentageHandler(),
                new NumberHandler(),
                new TooltipHandler()
            ];

            ko.utils.arrayForEach(ret, h => h.initialize());

            return ret;
        }
    }
}