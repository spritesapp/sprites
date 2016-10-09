/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />
/// <reference path="DataColumn.ts" />
/// <reference path="DataRow.ts" />

module Ifly.Models {
    /** Represents a data table. */
    export class DataTable implements IModel {
        /** Gets or sets table columns. */
        public columns: KnockoutObservableArray<DataColumn>;

        /** Gets or sets the table rows. */
        public rows: KnockoutObservableArray<DataRow>;

        /** Gets or sets the defined extension methods for table elements. */
        public extensions: any;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.columns = ko.observableArray<DataColumn>();
            this.rows = ko.observableArray<DataRow>();

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            this.extensions = data.extensions || {};

            this.columns.removeAll();

            if (data.columns || data.Columns) {
                ko.utils.arrayForEach(data.columns || data.Columns, (i) => {
                    this.columns.push(new DataColumn(ko.utils.extend(i, {
                        extensions: this.extensions.columns
                    })));
                });
            }

            this.rows.removeAll();

            if (data.rows || data.Rows) {
                ko.utils.arrayForEach(data.rows || data.Rows, (i) => {
                    this.rows.push(new DataRow(ko.utils.extend(i, {
                        extensions: {
                            me: this.extensions.rows,
                            cells: this.extensions.cells
                        }
                    })));
                });
            }
        }

        /** 
         * Serializes object state.
         * @param {boolean} trim Indicates whether to trim empty rows.
         */
        public serialize(trim?: boolean) {
            return !!trim ? DataTable.trim(this) : {
                columns: ko.utils.arrayMap(this.columns(), (i) => {
                    return (<DataColumn>i).serialize()
                }),

                rows: ko.utils.arrayMap(this.rows(), (i) => {
                    return (<DataRow>i).serialize()
                })
            };
        }

        /** Clears this table. */
        public clear() {
            this.rows.removeAll();
            this.columns.removeAll();
        }

        /** Returns the size of the longest table row. */
        public getMaxRowSize(): number {
            var ret = 0;

            if (this.rows().length) {
                for (var i = 0; i < this.rows().length; i++) {
                    if (ret < this.rows()[i].cells().length) {
                        ret = this.rows()[i].cells().length;
                    }
                }
            }

            return ret;
        }

        /** Returns the size of the longest table column. */
        public getMaxColumnSize(): number {
            return this.rows().length;
        }

        public static createEmpty(): any {
            var totalColumns = 5, totalRows = 5, row = null,
                columns = [], rows = [], cells = [];

            for (var i = 0; i < totalColumns; i++) {
                columns.push({});
            }

            for (var i = 0; i < totalRows; i++) {
                row = { cells: [] };

                for (var j = 0; j < totalColumns; j++) {
                    row.cells.push({});
                }

                rows.push(row);
            }

            return new DataTable({
                columns: columns,
                rows: rows
            }).serialize();
        }

        /** 
         * Trims the given table by removing empty rows and columns with empty headers.
         * @param {DataTable} table Table to trim.
         */
        public static trim(table: DataTable): any {
            var c = Ifly.App.getInstance().components['DataSourceSettingsModal'],
                found = false, name = '',  t = new DataTable(table.serialize()), v = null, hasValue = false;
            
            while (t.rows().length > 0) {
                found = false;

                for (var i = 0; i < t.rows().length; i++) {
                    if (ko.utils.arrayFirst(t.rows()[i].cells(), (c) => {
                        return (function (cell: DataCell) {
                            return cell.value() != null && ((typeof (cell.value()) == 'string' && cell.value().length > 0) ||
                                (typeof(cell.value()) != 'string'));
                        })(<DataCell>c);
                    }) == null) {
                        found = true;
                        t.rows.remove(t.rows()[i]);
                        break;
                    }
                }

                if (!found) {
                    break;
                }
            }

            if (t.rows().length > 0) {
                while (t.columns().length > 1) {
                    found = false;

                    for (var i = 1; i < t.columns().length; i++) {
                        name = t.columns()[i].name();
                        if (!name || !name.length) {
                            v = null;
                            found = true;
                            hasValue = false;

                            for (var j = 0; j < t.rows().length; j++) {
                                v = t.rows()[j].cells()[i].value();

                                if (v != null && v.toString().length > 0) {
                                    hasValue = true;
                                    break;
                                }
                            }

                            if (!hasValue) {
                                t.columns.remove(t.columns()[i]);

                                for (var j = 0; j < t.rows().length; j++) {
                                    t.rows()[j].cells.remove(t.rows()[j].cells()[i]);
                                }
                            } else {
                                t.columns()[i].name(c.terminology.column + ' #' + i);
                                found = false;
                            }
                        }
                    }

                    if (!found) {
                        break;
                    }
                }
            }

            return t.serialize();
        }
    }
}