/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../DataColumn.ts" />
/// <reference path="../DataRow.ts" />
/// <reference path="../DataTable.ts" />

module Ifly.Models {
    /** Represents data table inline rich text editor. */
    export class DataTableInlineRichTextEditor {
        /** Gets or sets the input element. */
        public input: HTMLInputElement;

        /** Gets or sets the editor container. */
        public richTextContainer: JQuery;

        /** Gets or sets the rich text editor. */
        public richText: UI.RichTextEditor;

        /**
         * Initializes a new instance of an object.
         * @param {HTMLInputElement} input Input element.
         */
        constructor(input: HTMLInputElement) {
            this.input = input;

            this.richText = new UI.RichTextEditor();
        }

        /** Shows the editor. */
        public show(): DataTableInlineRichTextEditor {
            var wrapper = null;

            if (!this.richTextContainer) {
                wrapper = $(this.input).parents('.table-wrapper');

                this.richTextContainer = $('.element-misc .element-table-inline-richtext')
                    .clone(true, true).appendTo(wrapper);

                ko.applyBindings(this, this.richTextContainer[0]);
            }

            this.richTextContainer.show();
            Ifly.Editor.getInstance().composition.updateThemeBasedStyles(this.richTextContainer);

            this.richText.html(this.input.value);
            $(this.input).addClass('rich-text-backing-inactive');

            setTimeout(() => {
                this.richText.focus();
            }, 50);

            this.applyPositioning();

            $(document).unbind('.inlinerichtext').bind('mousedown.inlinerichtext', e => {
                var t = $(e.target), hc = c => {
                    return t.hasClass(c) || t.parents('.' + c).length > 0;
                };

                if (!hc('element-table-inline-richtext') && !hc('icn-selector-window')) {
                    this.close();
                }
            });

            return this;
        }

        /** Saves the value. */
        public save() {
            var data = ko.dataFor(this.input);

            data.value(this.richText.html());
            
            this.close();
        }

        /** Closes the editor. */
        public close(): DataTableInlineRichTextEditor {
            if (this.isVisible()) {
                this.richTextContainer.hide();
                $(this.input).removeClass('rich-text-backing-inactive');
            }

            return this;
        }

        /** Returns value indicating whether rich text editor is visible. */
        public isVisible(): boolean {
            return this.richTextContainer != null && this.richTextContainer.is(':visible');
        }

        /** Applies positioning according to the input being backed. */
        public applyPositioning(): DataTableInlineRichTextEditor {
            var offset = null, mvOffset = null;

            if (this.richTextContainer) {
                offset = $(this.input).offset();
                mvOffset = this.richTextContainer.parents('.table-wrapper').offset();

                this.richTextContainer.css({
                    top: (offset.top - mvOffset.top + 4) + 'px',
                    left: (offset.left - mvOffset.left + 4) + 'px'
                });
            }

            return this;
        }
    }

    /** Represents data table view events. */
    export interface DataTableViewEvents {
        /** Gets or sets the callback which is executed when new row is being added to the table. */
        newRow?: (cells: any[]) => any;
    }

    /** Represents data table view options. */
    export interface DataTableViewOptions {
        /** Gets or sets the view events. */
        events?: DataTableViewEvents;

        /** Value indicating whether to enable rich text editing experience for text-based fields. */
        allowRichText?: boolean;
    }

    /** Represents a data table view. */
    export class DataTableView implements IModel {
        /** Gets or sets the data. */
        public data: DataTable;

        /** Gets or sets the DOM element which corresponds to a view container. */
        public container: any;

        /** Gets or sets the custom options. */
        public options: DataTableViewOptions;

        /** Gets or sets value indicating whether to enable rich formatting. */
        public enableRichFormatting: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether to allow enabling/disabling of rich formatting. */
        public allowEnableRichFormatting: KnockoutObservable<boolean>;

        /** Gets or sets the original data this view was loaded from. */
        private _original: any;

        /** Gets or sets the current inline rich text editor. */
        private _currentInlineRichTextEditor: DataTableInlineRichTextEditor;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {object} container DOM element which corresponds to a view container.
         * @param {DataTableViewOptions} options Custom options.
         */
        constructor(data?: any, container?: any, options?: DataTableViewOptions) {
            this.data = new DataTable();
            this.container = $(container);
            this.options = options;

            this.enableRichFormatting = ko.observable<boolean>(true);
            this.allowEnableRichFormatting = ko.observable<boolean>(options != null && !!options.allowRichText);

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {DataTableViewOptions} options Custom options.
         */
        public load(data: any, options?: DataTableViewOptions) {
            data = data || {};

            this._original = data.data;
            this.data.load(data.data);

            if (options) {
                this.options = options;
            }

            this.allowEnableRichFormatting(options != null && !!options.allowRichText);

            setTimeout(() => {
                this.updateRulerSize();

                if (this.container) {
                    this.container.find('.element-table-inline-richtext').remove();
                    this.container.find('.rich-text-backing-inactive').removeClass('rich-text-backing-inactive');
                }
            }, 25);
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                data: this.data.serialize(true)
            };
        }

        /** Creates new column. */
        public newColumn() {
            this.data.columns.push(new DataColumn({
                extensions: this._original && this._original.extensions ?
                    this._original.extensions.columns : null
            }));

            ko.utils.arrayForEach(this.data.rows(), (r) => {
                (<DataRow>r).cells.push(new DataCell({
                    extensions: this._original && this._original.extensions ?
                        this._original.extensions.cells : null
                }));
            });

            setTimeout(() => {
                this.updateRulerSize();
                this.focusOnNewColumn();
            }, 25);
        }

        /** Creates new row. */
        public newRow() {
            var columnsCount = this.data.columns().length, cells = [];

            for (var i = 0; i < columnsCount; i++) {
                cells.push({});
            }

            if (this.options && this.options.events && this.options.events.newRow) {
                this.options.events.newRow(cells);
            }

            this.data.rows.push(new DataRow({
                cells: cells,
                extensions: {
                    me: this._original && this._original.extensions && this._original.extensions.rows ?
                        this._original.extensions.rows : {},
                    cells: this._original && this._original.extensions && this._original.extensions.cells ?
                        this._original.extensions.cells : null
                }
            }));

            setTimeout(() => {
                if (this.container.length) {
                    var rows = this.container.find('tr:not(.new-row)');

                    if (rows && rows.length) {
                        var input = $(rows[rows.length - 1]).find('input[type="text"]:visible').get(0);

                        if (input) {
                            try {
                                input.focus();
                            } catch (ex) { }
                        }
                    }
                }

                this.updateRulerSize();
            }, 25);
        }

        public onTextFocus(event: any) {
            var t = $(event.target || event.srcElement);

            if (this.options && !!this.options.allowRichText && this.enableRichFormatting()) {
                if (this._currentInlineRichTextEditor) {
                    this._currentInlineRichTextEditor.close();
                }

                this._currentInlineRichTextEditor = this.getInlineRichTextForInput(<HTMLInputElement>t.get(0)).show();
            }
        }

        /** 
         * Returns the inline rich text editor for the given input cell.
         * @param {HTMLInputElement} input Input field.
         */
        public getInlineRichTextForInput(input: HTMLInputElement): DataTableInlineRichTextEditor {
            var ipt = <any>input;

            if (!ipt._sprites_inlineRichTextEditor) {
                ipt._sprites_inlineRichTextEditor = new DataTableInlineRichTextEditor(input);
            }

            return ipt._sprites_inlineRichTextEditor;
        }

        public onKeyDown(event: any) {
            var ret = true, code = event.keyCode || event.which || event.charCode, children = null, isHeader = false, isFixed = false, tab = null, substracted = false,
                t = $(event.target || event.srcElement), row = null, col = null, index = 0, elm = null, isFirstColumn = false, hasMarkColumn = false;

            if ((code == 38 || code == 40) && !t.parents('.typeahead').length) {
                ret = false;

                row = t.parents('ul');
                col = t.parents('.row-cell');
                tab = t.parents('.data-table-view');
                isFixed = tab.hasClass('data-table-fixed');
                hasMarkColumn = tab.find('.mark:visible').length > 0;

                if (!col.length) {
                    col = t.parents('.header-cell');
                    isHeader = true;
                }

                children = row.find('.row-cell, .header-cell');
                for (var i = 0; i < children.length; i++) {
                    if (children[i] == col[0]) {
                        index = i;
                        break;
                    }
                }

                isFirstColumn = index == 0;

                if (code == 38) { /* "Up" arrow */
                    row = row.prev('.row');

                    if (!row.length && !isHeader && !isFirstColumn && !isFixed) {
                        row = $(t.parents('.table-wrapper').find('ul.header'));
                        index -= 1;
                        substracted = true;
                    }

                    if (!row.length || !row.find('input[type="text"]:visible').length) {
                        row = t.parents('.table-wrapper').find('ul.row').last();
                        if (row.hasClass('new-row')) {
                            row = row.prev();
                        }
                    }
                } else if (code == 40) { /* "Down" arrow */
                    row = row.next('.row:not(.new-row)');

                    if (!row.length && isHeader) {
                        row = $(t.parents('.table-wrapper').find('ul.row')[0]);
                    }

                    if (!row.length) {
                        if (!isFirstColumn && !isFixed) {
                            index -= 1;
                            substracted = true;
                        }

                        row = t.parents('.table-wrapper').find('ul.header').first();
                        if (!row.find('input[type="text"]:visible').length || isFirstColumn) {
                            row = t.parents('.table-wrapper').find('ul.row').first();
                        }
                    }
                }

                if (hasMarkColumn && !substracted) {
                    index -= 1;
                }

                elm = row.find('input[type="text"]:visible')[index];

                try {
                    elm.focus();
                    elm.select();
                } catch (ex) { }
            }

            return ret;
        }

        /** Places the focus on a newly added column. */
        public focusOnNewColumn() {
            var c = $(this.container), col = c.find('ul.header li:not(.new-column) input[type="text"]').last();
            
            if (col) {
                try {
                    col.focus();

                    setTimeout(() => {
                        if (c.scrollLeft() > 0) {
                            c.scrollLeft(col.offset().left + 1000);
                        }
                    }, 25);
                } catch (ex) { }
            }
        }

        /** Updates rulers's sizes. */
        public updateRulerSize() {
            var rx = null, ry = null, view = null,
                c = $(this.container), cw = 0, ch = 0, vw = 0, vh = 0,
                max = (x, y, a?: number) => { return x > y ? x : y + a; }, ryd = 0;

            if (!c.hasClass('data-table-fixed')) {
                view = c.find('.table-wrapper[data-bind]');

                rx = c.find('.ruler-x');
                ry = c.find('.ruler-y');

                rx.css({ width: '100%' });
                ry.css({ height: '100%' });

                setTimeout(() => {
                    cw = c.innerWidth();
                    ch = c.innerHeight();

                    vw = view.innerWidth();
                    vh = view.innerHeight();

                    rx.css({ width: max(cw, vw) + 'px' });
                    ry.css({ height: max(ch, vh, 10) + 'px' });
                }, 5);
            }

            this.updateThemeBasedStyles();
        }

        /**
         * Rotates the underlying table counter-clockwise.
         */
        public rotateCounterClockwise() {
            var original = this.data.serialize(),
                rowIndex = 0,
                row = null;

            this.data.rows.removeAll();
            this.data.columns.removeAll();

            this.data.columns.push(new DataColumn(original.columns[0]));
            this.data.columns.push(new DataColumn(original.columns[original.columns.length - 1]));

            for (var i = 0; i < original.rows.length; i++) {
                this.data.columns.push(new DataColumn({
                    name: original.rows[i].cells[original.rows[i].cells.length - 1].value
                }));
            }

            for (var i = original.columns.length - 2; i > 0 ; i--) {
                row = {
                    cells: [
                        {},
                        {
                            value: original.columns[i].name
                        }
                    ]
                };

                for (var j = 0; j < original.rows.length; j++) {
                    row.cells.push({
                        value: original.rows[j].cells[i].value,
                        inputType: original.rows[j].cells[i].inputType
                    });
                }

                if (original.rows.length > rowIndex) {
                    row.cells[0] = original.rows[rowIndex].cells[0];
                }

                this.data.rows.push(new DataRow(row));

                rowIndex++;
            }

            setTimeout(() => {
                this.updateRulerSize();
            }, 25);
        }

        /** Clears theme-based element styles and re-applies classes from the current theme. */
        private updateThemeBasedStyles() {
            /* Updating color selectors to reflect the colors of the current theme. */
            Ifly.Editor.getInstance().composition.updateThemeBasedStyles($(this.container));
        }
    }
}