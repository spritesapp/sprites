/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />

module Ifly.Models.UI {
    /** Represents rich text editor style declaration. */
    export interface RichTextEditorStyleDeclaration<T> {
        /** Gets or sets the style name. */
        name: string;

        /** Gets or sets the style value. */
        value?: T;

        /** Gets or sets the HTML element where the style is declared. */
        declaredOn: HTMLElement;
    }

    /** Represents rich text editor selection data. */
    export interface RichTextEditorSelectionData {
        /** Gets or sets the selection. */
        selection: Selection;

        /** Gets or sets the range. */
        range: Range;
    }

    /** Represents rich text editor selection. */
    export class RichTextEditorSelection {
        /** Gets or sets the owning editor. */
        private editor: RichTextEditor;

        /** Gets or sets value indicating whether the given selection is aligned. */
        public isAligned: KnockoutObservable<string>;

        /** Gets or sets value indicating whether current selection is bold. */
        public isBold: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether current selection is italic. */
        public isItalic: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether current selection is underline. */
        public isUnderline: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether current selection is strikethrough. */
        public isStrikethrough: KnockoutObservable<boolean>;

        /** Gets value indicating whether selection is collapsed. */
        public isCollapsed: KnockoutComputed<boolean>;

        /** Gets or sets the font size scale (value from 1 to 100). */
        public _fontSizeScale: KnockoutObservable<number>;

        /** Gets or sets the font color. */
        private _fontColor: KnockoutObservable<ColorType>;

        /** Gets or sets the font color lock. */
        private _fontColorLock: boolean;

        /** Gets or sets the font size. */
        private _fontSize: KnockoutObservable<number>;

        /** Gets or sets the fonts size update timer. */
        private _fontSizeUpdateTimer: number;

        /** Gets or sets the corresponding DOM selection. */
        private _selection: Selection;

        /** Gets or sets the style properties. */
        private _styleProperties: any[];

        /** Gets or sets alignment commands. */
        private _alignmentCommands: any[];

        /**
         * Initializes a new instance of an object.
         * @param {RichTextEditor} editor Owning editor.
         * @param {Selection} selection The corresponding DOM selection.
         */
        constructor(editor: RichTextEditor, selection?: Selection) {
            this.editor = editor;
            this._selection = selection;

            this.isBold = ko.observable<boolean>();
            this.isItalic = ko.observable<boolean>();
            this.isAligned = ko.observable<string>();
            this.isUnderline = ko.observable<boolean>();
            this.isStrikethrough = ko.observable<boolean>();
            this.isCollapsed = ko.computed<boolean>(() => {
                var data = this.getSelection();
                return data == null || data.range == null || !!data.range.collapsed;
            });

            this._fontColor = ko.observable<ColorType>();

            /* "100" is "100% font size. */
            this._fontSize = ko.observable<number>(100);

            /* "50" is medium font size (50% of the slider value). */
            this._fontSizeScale = ko.observable<number>(50);

            /* "sliderValue" is well-known extension property which font scale slider listens to. */
            (<any>this._fontSizeScale).sliderValue = ko.observable<number>();

            this._styleProperties = [
                { command: 'bold', property: this.isBold },
                { command: 'italic', property: this.isItalic },
                { command: 'underline', property: this.isUnderline },
                { command: 'strikethrough', property: this.isStrikethrough }
            ];

            this._alignmentCommands = [
                { command: 'justifyLeft', propertySuffix: 'left' },
                { command: 'justifyRight', propertySuffix: 'right' },
                { command: 'justifyCenter', propertySuffix: 'center' },
                { command: 'justifyFull', propertySuffix: 'full' }
            ];

            for (var i = 0; i < this._styleProperties.length; i++) {
                (s => {
                    s.property.toggle = () => { s.property(!s.property()); }
                    s.property.isActive = ko.observable<boolean>();

                    s.property.subscribe(v => {
                        this.getSelection(data => {
                            this.editor.document.execCommand(s.command);
                            this.refresh();

                            this.editor.onHtmlChanged();
                        });
                    });
                })(this._styleProperties[i]);
            }

            for (var i = 0; i < this._alignmentCommands.length; i++) {
                (<any>this.isAligned)[this._alignmentCommands[i].propertySuffix] = ko.observable<boolean>();
            }

            this._fontSizeScale.subscribe(v => {
                /* Throttling slider callbacks. */
                if (this._fontSizeUpdateTimer) {
                    clearTimeout(this._fontSizeUpdateTimer);
                }

                this._fontSizeUpdateTimer = setTimeout(() => {
                    var scale = 100;

                    if (v != 50) {
                        if (v > 5) {
                            if (v > 50) {
                                scale = 150 + (2 * (v - 50));
                            } else if (v < 50) {
                                scale = 100 - (50 - v);
                            }
                        } else {
                            scale = 50;
                        }
                    }

                    this.fontSize(scale, v);
                }, 25);
            });

            /* Changing selection color when backing field value changes. */
            this._fontColor.subscribe(v => {
                if (!this._fontColorLock) {
                    this.fontColor(parseInt((v || '').toString(), 10));
                } else {
                    this._fontColorLock = false;
                }
            });
        }

        /** Increases indentation. */
        public indent() {
            this.execCommand('indent');
        }

        /** Decreases indentation. */
        public outdent() {
            this.execCommand('outdent');
        }

        /** Increases ordered list. */
        public insertOrderedList() {
            this.execCommand('insertOrderedList');
        }

        /** Inserts unordered list. */
        public insertUnorderedList() {
            this.execCommand('insertUnorderedList');
        }

        /**
         * Changes text alignment.
         * @param {string} direction Direction.
         */
        public align(direction: string) {
            this.execCommand('justify' +
                (direction.substr(0, 1).toUpperCase() + direction.substr(1)));
        }

        /** Applies subscript. */
        public subScript() {
            this.execCommand('subscript');
        }

        /** Applies superscript. */
        public superScript() {
            this.execCommand('superscript');
        }

        /**
         * Executes the given command.
         * @param {string} command Command to execute.
         */
        public execCommand(command: string) {
            this.getSelection(() => {
                this.editor.document.execCommand(command);

                this.refresh();
                this.editor.onHtmlChanged();
            });
        }

        /** Inserts an icon. */
        public insertIcon() {
            var isSelection = false, html = '', s = null,
                saveSelection = () => {
                    var result = null, sel = null;

                    if (this.editor.window.getSelection) {
                        sel = this.editor.window.getSelection();
                        if (sel.getRangeAt && sel.rangeCount) {
                            result = sel.getRangeAt(0);
                        }
                    } else if (this.editor.document.selection && this.editor.document.selection.type != 'Control') {
                        result = this.editor.document.selection.createRange();
                    }
                    return result;
                }, restoreSelection = (range) => {
                    var sel = null;

                    if (range) {
                        if (this.editor.window.getSelection) {
                            sel = this.editor.window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                        } else if (this.editor.document.selection && range.select) {
                            range.select();
                        }
                    }
                }, getIconCharCode = (icon, callback: Function) => {
                    var n = this.editor.document.createElement('i'), result = '';

                    n.className = 'icon icon-' + icon;
                    n.style.visibility = 'hidden';

                    this.editor.document.body.appendChild(n);

                    setTimeout(() => {
                        result = this.editor.window.getComputedStyle(n, ':before')
                            .getPropertyValue('content');

                        n.parentNode.removeChild(n);

                        callback(result);
                    }, 10);
                };

            s = saveSelection();

            UI.IconSelectorModal.getInstance().open({
                icon: null
            }, {
                replaceCurrent: true,
                save: (i) => {
                    restoreSelection(s);

                    if (i.icon.indexOf('/') < 0) {
                        getIconCharCode(i.icon, ch => {
                            this.replaceContents('<span style="font-family: FontAwesome;">' + ch + '</span>');
                        });
                    } else {
                        this.replaceContents('<img style="width: 3vw;" src="' + i.icon + '" />');
                    }

                    setTimeout(() => {
                        this.editor.onHtmlChanged();
                    }, 5);
                }
            });
        }

        /**
         * Gets or sets the font color of a current selection.
         * @param {ColorType} value Font color.
         */
        public fontColor(value?: ColorType): ColorType {
            var ret = value, isSelection = false, html = '', trimInfo = { before: '', after: '' }, cutFrom = -1, cutTo = -1,
                colorReady = (v) => {
                    if (isSelection) {
                        this.replaceContents(html);
                    }

                    this._fontColorLock = true;
                    this._fontColor(v);

                    setTimeout(() => {
                        this.editor.onHtmlChanged();
                    }, 5);
                };

            if (typeof (value) == 'undefined' || value == null) {
                ret = this._fontColor();
            } else {
                this.getSelection(data => {
                    isSelection = true;
                    html = this.getContents();
                });

                if (html && html.length) {
                    /* The target HTML is already wrapped in color style - 
                    removing in order not to produce unnesesarily nesting. */
                    if (this.editor.tryGetFontColorStyle(html)) {
                        cutFrom = html.indexOf('>');
                        cutTo = html.lastIndexOf('<');

                        html = html.substr(cutFrom + 1, html.length - (cutFrom + 1) - (html.length - cutTo));
                    }

                    if (ret >= 0) {
                        Ifly.Editor.getInstance().composition.infographic.queryElementStyle('accent-' + (ret + 1), e => {
                            html = Utils.Input.trim(html, trimInfo);
                            html = trimInfo.before + '<span class="richtext-color accent-' + (ret + 1) + '" style="color: ' + $(e).css('color') + '">' + html + '</span>' + trimInfo.after;

                            colorReady(ret);
                        });
                    } else {
                        colorReady(null);
                    }
                }
            }

            return ret;
        }

        /**
         * Gets or sets the font size of a current selection.
         * @param {number} value Font size value (from 1 to 100).
         * @param {number} sliderValue Slider value.
         */
        public fontSize(value?: number, sliderValue?: number): number {
            var ret = value, isSelection = false, html = '', cutFrom = -1, cutTo = -1;

            if (typeof (value) == 'undefined' || value == null) {
                ret = this._fontSize();
            } else {
                this.getSelection(data => {
                    isSelection = true;
                    html = this.getContents();
                }, data => {
                    html = this.editor.html();
                });

                if (html && html.length) {
                    /* The target HTML is already wrapped in font-size style - 
                    removing in order not to produce unnesesarily nesting. */
                    if (this.editor.tryGetFontSizeStyle(html)) {
                        cutFrom = html.indexOf('>');
                        cutTo = html.lastIndexOf('<');

                        html = html.substr(cutFrom + 1, html.length - (cutFrom + 1) - (html.length - cutTo));
                    }

                    html = '<span style="font-size: ' + value + '%" data-slider-value="' +
                        sliderValue + '">' + html + '</span>';

                    if (isSelection) {
                        this.replaceContents(html);
                    } else {
                        this.editor.html(html);
                    }

                    setTimeout(() => {
                        this.editor.onHtmlChanged();
                    }, 5);
                }

                this._fontSize(value);
            }

            return ret;
        }

        /** Refreshes the state of the object according to the selection state. */
        public refresh() {
            var activeAlignment = '';

            for (var i = 0; i < this._styleProperties.length; i++) {
                this._styleProperties[i].property.isActive(
                    !!this.editor.document.queryCommandState(this._styleProperties[i].command));
            }

            for (var i = 0; i < this._alignmentCommands.length; i++) {
                if (!!this.editor.document.queryCommandState(this._alignmentCommands[i].command)) {
                    activeAlignment = this._alignmentCommands[i].propertySuffix;
                }
            }

            this.isAligned(activeAlignment);

            for (var i = 0; i < this._alignmentCommands.length; i++) {
                (<any>this.isAligned)[this._alignmentCommands[i].propertySuffix](activeAlignment ===
                    this._alignmentCommands[i].propertySuffix);
            }
        }

        /** Resets the selection state. */
        public reset() {
            for (var i = 0; i < this._styleProperties.length; i++) {
                this._styleProperties[i].property(false);
                this._styleProperties[i].property.isActive(false);
            }
        }

        /**
         * Returns the HTML contents of the current selection.
         * @param {boolean} preserveSelection Value indicating whether to keep the current selection active.
         */
        public getContents(preserveSelection?: boolean): string {
            var ret = '', data = null, p = null, cloned = null, origParent = null, n = null,
                div = null, processContents = false, origSibling = null;

            data = this.getSelection();
            div = document.createElement('div');

            if (data.range) {
                cloned = data.range.cloneContents();

                /* Locating the HTML element the selection starts/ends with. */
                p = data.range.endContainer.nodeType == 3 ?
                    data.range.endContainer : data.range.startContainer;

                if (p) {
                    /* Getting the parent node. */
                    p = p.parentNode;

                    /* Checking whether the parent is the document (in this case we just return the entire HTML). */
                    if (p && Utils.Input.trim(p.textContent).length == Utils.Input.trim(cloned.textContent).length &&
                        (p.tagName || p.nodeName || '').toLowerCase() != 'body') {

                        /* Keeping track of original placement - we'll need it if "preserveSelection" is "true". */
                        origParent = p.parentNode;
                        origSibling = p.nextSibling;

                        div.appendChild(p);
                    } else {
                        processContents = true;
                    }
                } else {
                    processContents = true;
                }
            }

            if (processContents) {
                div.appendChild(cloned);
            }

            ret = div.innerHTML;

            /* Restoring the selection (inserting the node back and selecting it). */
            if (!processContents && preserveSelection) {
                origParent.insertBefore(div.firstChild, origSibling);
                n = origSibling ? origSibling.previousSibling : origParent.firstChild;

                data.range = this.editor.document.createRange();
                data.range.selectNode(n);

                data.selection.removeAllRanges();
                data.selection.addRange(data.range);
            }

            return ret;
        }

        /** 
         * Replaces the contents of the current selection.
         * @param {string} html HTML to replace the selection with.
         */
        private replaceContents(html: string) {
            var selection = null, range = null, node = null,
                div = null, child = null, container = null;

            if (typeof (this.editor.window.getSelection) != 'undefined') {
                selection = this.editor.window.getSelection();

                if (selection.getRangeAt && selection.rangeCount) {
                    range = selection.getRangeAt(0);

                    if (!range.isCollapsed) {
                        range.deleteContents();

                        if (range.createContextualFragment) {
                            node = range.createContextualFragment(html);
                        } else {
                            div = document.createElement('div');

                            div.innerHTML = html;
                            node = document.createDocumentFragment();

                            while ((child = div.firstChild)) {
                                node.appendChild(child);
                            }
                        }

                        range.insertNode(node);

                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            } else if (this.editor.document.selection && this.editor.document.selection.type != 'Control') {
                range = this.editor.document.selection.createRange();
                range.pasteHTML(html);
            }
        }

        /**
         * Returns the current selection data.
         * @param {Function} isSomethingSelected A function which is invoked when the current selection is not collapsed.
         * @param {Function} nothingIsSelected A function which is invoked when the current selection is collapsed.
         */
        public getSelection(isSomethingSelected?: (data: RichTextEditorSelectionData) => any, nothingIsSelected?: (data: RichTextEditorSelectionData) => any): RichTextEditorSelectionData {
            var selection = this._selection || (this.editor.window ? this.editor.window.getSelection() : null), ret = {
                selection: selection,
                range: selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
            };

            if (!ret.selection) {
                ret = null;
            } else {
                if (ret.range && !ret.range.collapsed) {
                    if (isSomethingSelected) {
                        isSomethingSelected(ret);
                    }
                } else if (nothingIsSelected) {
                    nothingIsSelected(ret);
                }
            }

            return ret;
        }
    }

    /** Represents a rich text editor. */
    export class RichTextEditor extends Ifly.EventSource {
        /** Gets or sets the corresponding document. */
        public document: HTMLDocument;

        /** Gets or sets the corresponding window. */
        public window: Window;

        /** Gets or sets the hosting document. */
        public hostingDocument: HTMLDocument;

        /** Gets or sets the hosting window. */
        public hostingWindow: Window;

        /** Gets or sets the current selection. */
        public currentSelection: RichTextEditorSelection;

        /** Gets or sets the HTML assignment timer. */
        private _setHtmlTimer: number;

        /** Gets or sets the focus timer. */
        private _focusTimer: number;

        /**  Initializes a new instance of an object. */
        constructor() {
            super();

            this.hostingWindow = window;
            this.hostingDocument = document;
            this.currentSelection = new RichTextEditorSelection(this);
        }

        /**
         * Initializes the document.
         * @param {HTMLDocument} document Document that has been loaded.
         * @param {Window} window Window that the document has been loaded to.
         * @param {HTMLIFrameElement} frame Frame element.
         */
        public initialize(document: HTMLDocument, window: Window, frame: HTMLIFrameElement) {
            var doc = null;

            this.document = document;
            this.window = window;

            if (frame) {
                $(frame).removeClass('richtext-loading');
            }

            /* Activating design mode. */
            this.document.designMode = 'on';
            doc = $(this.document);

            /* On any user input, refreshing the tools, notifyig that the HTML has changed. */
            doc.on('mouseup keyup', e => {
                this.currentSelection.refresh();
                this.onHtmlChanged();
            });

            $(window).blur(e => { this.dispatchEvent('blur'); });

            /* Propagating necessary key code events. */
            doc.keyup(e => {
                var code = e.keyCode || e.charCode || e.which;

                /* Propagating ESC key press. */
                if (code == 27) {
                    $(this.hostingDocument.body).trigger(<any>e);
                }
            });

            /* Performing initial toolbar update. */
            setTimeout(() => this.currentSelection.refresh(), 50);
        }

        /** Focuses on the editor. */
        public focus() {
            var attempts = 0, tryFocus = null, range = null;

            tryFocus = () => {
                if (this.document && this.document.body) {
                    try {
                        this.document.body.focus();
                    } catch (ex) { }
                } else if (attempts < 200) {
                    attempts++;
                    this._focusTimer = setTimeout(() => tryFocus(), 50);
                }
            };

            if (this._focusTimer) {
                clearTimeout(this._focusTimer);
                this._focusTimer = null;
            }

            tryFocus();
        }

        /**
         * Gets or sets the editor HTML contents.
         * @param {string} value HTML contents.
         */
        public html(value?: string): string {
            var ret = value, attempts = 0, v = '', trySetHtml = null;

            if (typeof (value) == 'undefined' || value == null) {
                ret = this.document && this.document.body ?
                    this.document.body.innerHTML : '';
            } else {
                if (this._setHtmlTimer) {
                    clearTimeout(this._setHtmlTimer);
                    this._setHtmlTimer = null;
                }

                trySetHtml = () => {
                    if (this.document && this.document.body) {
                        v = (value || '').replace(/<scr[^>]+>/gi, '');
                        v = v.replace(/<\\script>/gi, '');

                        this.document.body.innerHTML = value;
                    } else if (attempts < 200) {
                        attempts++;
                        this._setHtmlTimer = setTimeout(() => trySetHtml(), 50);
                    }
                }

                trySetHtml();
            }

            return ret;
        }

        /** Clears the contents of an editor. */
        public clear() {
            this.html('');
            this.onHtmlChanged();
        }

        /** Clears all the formatting. */
        public clearFormatting() {
            if (this.document && this.document.body) {
                /* Removing formatting. */
                this.document.body.innerHTML = (this.document.body.textContent || '')
                    .replace(/[^\x20-\x7E]+/g, '');

                /* Resetting all tool state. */
                this.currentSelection.reset();

                /* Notifying about the changes. */
                this.onHtmlChanged();
            }
        }

        /** 
         * Shows next toolbar.
         * @param {object} target Event target.
         */
        public toggleMoreOptions(target: any) {
            var t = $(target);

            t.parents('.richtext-toolbar').toggleClass('toolbar-more-options-visible');
            t.parents('li').toggleClass('active');
        }

        /** Occurs when HTML changes. */
        public onHtmlChanged() {
            var html = this.document.body.innerHTML;

            /* Removing empty tags. */
            html = html.replace(/<div>/gi, '<br>');
            html = html.replace(/<\/div>/gi, '');
            html = html.replace(/<br>\s*$/gi, '');

            this.dispatchEvent('change', { html: html });
        }

        /**
         * Tries to return the font color style by examining the given HTML.
         * @param {string} html HTML to examine.
         */
        public tryGetFontColorStyle(html: any): RichTextEditorStyleDeclaration<ColorType> {
            var ret = null, temp = null, style = null, m = null, n = null;

            temp = document.createElement('div');
            temp.innerHTML = html;

            if (temp.childNodes.length == 1) {
                n = $(temp.childNodes[0]);

                /* Matching accent color classes. */
                m = (n.attr('class') || '').match(/accent\-[0-9]/gi);

                if ((m && m.length) || (n.attr('color') || '').length) {
                    ret = {
                        name: 'color',
                        value: m && m.length ? parseInt(m[0].split('-')[1], 10) : null,
                        declaredOn: temp.childNodes[0]
                    };
                } 
            }

            return ret;
        }

        /**
         * Tries to return the font size style by examining the given HTML.
         * @param {string} html HTML to examine.
         */
        public tryGetFontSizeStyle(html: any): RichTextEditorStyleDeclaration<number> {
            var ret = null, temp = null, style = null, m = null;

            temp = document.createElement('div');
            temp.innerHTML = html;

            if (temp.childNodes.length == 1) {
                /* We need inline style, thus the attribute. */
                style = $(temp.childNodes[0]).attr('style');

                if (style && style.length) {
                    /* Trying to match style value. */
                    m = style.match(/font-size:\s?([0-9]+)/gi);

                    if (m && m.length) {
                        ret = {
                            name: 'font-size',
                            value: parseInt(m[0].split(':')[1], 10),
                            declaredOn: temp.childNodes[0]
                        };
                    }
                }
            }

            return ret;
        }

        /**
         * Occurs when the font size slider is shown.
         * @param {object} sender Event sender.
         * @param {object} args Event arguments.
         */
        private onFontSizeSliderShow(sender, args) {
            var html = '', fontSize = null, v = null;

            /* Getting the HTML to examine. */
            this.currentSelection.getSelection(data => {
                html = this.currentSelection.getContents(true);
            }, data => {
                html = this.html();
            });

            /* Trying to determine whether there's a "font-size" style defined on a given HTML. */
            fontSize = this.tryGetFontSizeStyle(html);

            /* Parsing slider value from node attribute (since the font size and slider value are two different things). */
            if (fontSize && fontSize.declaredOn) {
                v = parseInt($(fontSize.declaredOn).attr('data-slider-value'), 10);
            }

            /* No explicit font size was found - setting slide to its default position (middle). */
            if (v == null || isNaN(v)) {
                v = 50;
            }

             /* The slider listents to a well-known extension property "sliderValue". */
            (<any>this.currentSelection._fontSizeScale).sliderValue(v);
        }
    }
} 