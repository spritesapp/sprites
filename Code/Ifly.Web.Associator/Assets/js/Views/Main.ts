module Ifly.Views {
    export class FactCarousel {
        private _container: JQuery;

        constructor(container: JQuery) {
            this._container = container;

            this._container.find('.next').click(() => {
                this.next();
            });

            this._container.find('.previous').click(() => {
                this.previous();
            });
        }

        public hide() {
            this._container.removeClass('visible')
                .find('ul').css('visibility', 'hidden').removeClass('visible');
        }

        public loadAndShow(query: string, results: any[]) {
            var ratioDescribed = '', ul = this._container.find('ul').empty(),
                createItem = (text, index) => {
                    var item = $('<li />').attr('data-order', index + 1);

                    item.append($('<p>').html(text));

                    return item;
                }, fullText, startsWithVowel = (text) => {
                    return 'AEIOU'.indexOf(text.charAt(0).toUpperCase()) >= 0;
                };

            if (results && results.length) {
                for (var i = 0; i < results.length; i++) {
                    fullText = query + ' is ';
                    ratioDescribed = '';

                    if (results[i].Ratio && results[i].Ratio !== 'null') {
                        ratioDescribed = this.describeRatio(parseFloat(results[i].Ratio));

                        if (ratioDescribed && ratioDescribed.length) {
                            fullText += ratioDescribed + (ratioDescribed.length ? ' ' : '') + 'the';
                        } else {
                            fullText += ('<span class="highlight-ratio">' + results[i].Ratio + '</span> of a');
                        }
                    } else {
                        fullText += 'a';
                    }

                    if (!ratioDescribed || !ratioDescribed.length) {
                        fullText += startsWithVowel(results[i].Description) ? 'n' : '';
                    }

                    fullText += ' ' + results[i].Description;

                    if (fullText.lastIndexOf('.') !== (fullText.length - 1)) {
                        fullText += '.';
                    }

                    ul.append(createItem(fullText, i));
                }
            } else {
                ul.append(createItem(this._container.attr('data-empty-message'), -1).addClass('empty'));
            }

            this._container.addClass('visible');
            ul.css('visibility', 'hidden').removeClass('visible');

            setTimeout(() => {
                ul.css('visibility', 'visible');

                setTimeout(() => {
                    ul.addClass('visible');
                }, 15);
            }, 15);

            this._container.find('.numbers')
                .css('visibility', results && results.length ? 'visible' : 'hidden')
                .find('.number-total').text((results || []).length);

            this.setActive(1);
        }

        public next() {
            return this.setActive(this.getActive() + 1);
        }

        public previous() {
            return this.setActive(this.getActive() - 1);
        }

        private getActive(): number {
            return parseInt(this._container.attr('data-value'), 10) || 0;
        }

        private describeRatio(ratio: number): string {
            var ret = '',
                rounded = 0,
                highlight = null,
                terminologyFound = false,
                roundedTwoDecimals = 0;

            if (ratio < 1) {
                rounded = parseFloat(ratio.toFixed(1));
                roundedTwoDecimals = parseFloat(ratio.toFixed(2));

                if (rounded == 0.1) {
                    ret = 'one tenths';
                } else if (rounded == 0.2) {
                    ret = 'one fifth';
                } else if (roundedTwoDecimals == 0.25) {
                    ret = 'one fourth';
                } else if (rounded == 0.3) {
                    ret = 'one third';
                } else if (rounded < 0.7) {
                    ret = 'half';
                } else if (roundedTwoDecimals <= 0.85) {
                    ret = 'two thirds';
                } else if (rounded <= 0.9) {
                    ret = 'nine tenths';
                } else if (rounded > 0.9) {
                    terminologyFound = true;
                }
            } else {
                rounded = Math.round(ratio);

                if (rounded == 1) {
                    terminologyFound = true;
                } else if (rounded == 2) {
                    ret = 'twice';
                } else {
                    ret = rounded + ' times';
                }
            }

            highlight = () => {
                ret = '<span class="highlight-ratio" title="' + ratio + '">' + ret + '</span>';
            };

            if (ret.length) {
                highlight();
            }

            if ((ret.length || terminologyFound) && rounded != ratio) {
                ret = 'about' + (ret.length ? ' ' : '') + ret;

                if (ret == 'about') {
                    highlight();
                }
            }

            return ret;
        }

        private setActive(index: number) {
            var current = this._container.find('.current'),
                items = this._container.find('li').not('.empty'),
                prevValue = this.getActive();

            this._container.find('.number-current').text(index);

            current.removeClass((i, c) => {
                return $.grep(c.split(' '), (ce: string) => {
                    return ce.indexOf('current-') === 0;
                }).join(' ');
            }).addClass('current-' + index);

            this._container.find('.next').toggleClass('disabled', index >= items.length);
            this._container.find('.previous').toggleClass('disabled', index === 1);

            this._container.attr('data-value', index);

            this._container.find('.results-list-wrapper').css('height',
                this._container.find('li[data-order="' + index + '"]').outerHeight() + 'px');
        }
    }

    export class MeasureSelector {
        private _container: JQuery;
        private _rotationTimer: number;

        constructor(container: JQuery) {
            this._container = container;

            this._container.click((e) => {
                this.stopRotating();

                if (!this.next()) {
                    this.setActive(1);
                }

                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                return false;
            }).on('selectstart', e => {
                e.preventDefault();
                e.stopPropagation();
                e.cancelBubble = true;
                
                return false;
            }); 

            this._container.find('.next').click(() => {
                this.next();
            });

            this._container.find('.previous').click(() => {
                this.previous();
            });
        }

        public rotate() {
            this.stopRotating();

            this._rotationTimer = setInterval(() => {
                if (!this.next()) {
                    this.setActive(1);
                }
            }, 2000);
        }

        public stopRotating() {
            if (this._rotationTimer) {
                clearInterval(this._rotationTimer);
                this._rotationTimer = null;
            }
        }

        public next() {
            return this.setActive(this.getActive() + 1);
        }

        public previous() {
            return this.setActive(this.getActive() - 1);
        }

        public reset() {
            this.setActive(1);
        }

        public getTerminology() {
            return $(this._container.find('li span').get(this.getActive() - 1)).text();
        }

        public updateTerminology(value: number) {
            this._container.find('li span').each((i, e) => {
                var $e = $(e);
                $e.text($e.attr(value === 1 ? 'data-text-single' : 'data-text-plural'));
            });
        }

        public getSelectedUnit(): number {
            return parseInt(this._container.attr('data-value'), 10);
        }

        private getActive(): number {
            return parseInt(this._container.attr('data-value'), 10) || 0;
        }

        private setActive(index: number) {
            var current = this._container.find('.current'),
                items = this._container.find('li'),
                prevValue = this.getActive(),
                ret = false;

            ret = (index > prevValue && index <= items.length) ||
                (index < prevValue && index >= 1);

            if (ret) {
                current.removeClass((i, c) => {
                    return $.grep(c.split(' '), (ce: string) => {
                        return ce.indexOf('current-') === 0;
                    }).join(' ');
                }).addClass('current-' + index);

                this._container.find('.next').toggleClass('disabled', index >= items.length);
                this._container.find('.previous').toggleClass('disabled', index === 1);

                this._container.attr('data-value', index);
            }

            return ret;
        }
    }

    /** Represents the main view. */
    export class Main {
        public value: JQuery; 
        public container: JQuery;
        public measure: MeasureSelector;
        public results: FactCarousel;

        private _takingLongerTimer: number;

        private static _instance: Main;

        /** Initializes the view. */
        public initialize() {
            this.container = $('.landing');

            this.value = this.container.find('.value');
            this.measure = new MeasureSelector(this.container.find('.measure-selector'));
            this.results = new FactCarousel(this.container.find('.results'));

            this.container.find('.submit button').click(() => {
                this.beginCompare();
            });

            this.value.keydown(e => {
                var key = e.keyCode || e.charCode || e.which,
                    cancel = () => {
                        e.stopPropagation();
                        e.preventDefault();

                        return false;
                    };

                if (key === 13) {
                    this.beginCompare();

                    return cancel();
                }
            });

            this.value.keyup(e => {
                this.measure.stopRotating();
                this.measure.updateTerminology(parseInt(this.value.val(), 10));
            });

            this.value.on('blur', e => {
                var parsed = parseFloat(this.value.val());

                if (!/^[0-9\.,\s]+$/gi.test(this.value.val())) {
                    this.value.val(isNaN(parsed) ? '' : parsed.toString());
                }
            });

            this.measure.rotate();

            this.container.find('.input-wrapper .icon').click(e => {
                this.value.focus();
            });
        }

        /** Begins comparing. */
        public beginCompare() {
            var button = this.container.find('.submit button'),
                val = this.value.val(), valParsed = parseFloat(val);

            clearTimeout(this._takingLongerTimer);
            this.container.find('.waiting-longer').removeClass('visible');

            if (val && val.length && !isNaN(valParsed)) {
                button.text(button.attr('data-text-busy'));
                this.container.find('.input-wrapper').addClass('disabled');
                this.value.attr('readonly', 'readonly');

                this.measure.stopRotating();
                this.results.hide();

                this._takingLongerTimer = setTimeout(() => {
                    this.container.find('.waiting-longer').addClass('visible');
                }, 10000);

                this.queryCompare(valParsed, this.measure.getSelectedUnit(), (characteristics) => {
                    this.endCompare(characteristics);
                });
            }
        }

        /**
         * Ends comparing.
         * @param {Array} results Results.
         */
        public endCompare(results: any[]) {
            var button = this.container.find('.submit button');

            clearTimeout(this._takingLongerTimer);
            this.container.find('.waiting-longer').removeClass('visible');

            button.text(button.attr('data-text-normal'));
            this.container.find('.input-wrapper').removeClass('disabled');
            this.value.removeAttr('readonly');

            this.renderComparison('<span class="highlight-value">' + this.value.val() + '</span> ' +
                this.measure.getTerminology(), results);

            this.value.val('');
            this.measure.reset();
        }

        public queryCompare(value: number, unit: number, complete: Function) {
            if (!isNaN(value) && value !== null && unit > 0) {
                $.ajax('/api/compare?value=' + value + '&unit=' + unit, {
                    type: 'post',
                    complete: (xhr) => {
                        var data = null;

                        try {
                            data = JSON.parse(xhr.responseText || '');
                        } catch (ex) { }

                        complete(data || []);
                    }
                });
            } else {
                complete([]);
            }
        }

        public renderComparison(query: string, comparison: any[]) {
            this.results.loadAndShow(query, comparison);
        }

        /** Returns an instance of the current view. */
        public static getInstance(): Main {
            if (!this._instance) {
                this._instance = new Main();
            }

            return this._instance;
        }
    }
}

Ifly.App.getInstance().addEventListener('ready', () => {
    Ifly.Views.Main.getInstance().initialize();
});