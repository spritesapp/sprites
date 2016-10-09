/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />
/// <reference path="DataCell.ts" />

module Ifly.Models {
    /** Represents a data row. */
    export class DataRow implements IModel {
        /** Gets or sets the row cells. */
        public cells: KnockoutObservableArray<DataCell>;

        /** Gets or sets value indicating whether to mark this row as selected. */
        public mark: KnockoutObservable<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.cells = ko.observableArray<DataCell>();
            this.mark = ko.observable<boolean>();

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            if (data.extensions && data.extensions.me) {
                ko.utils.extend(this, data.extensions.me);
            }

            this.mark(data.mark || data.Mark || false);
            this.cells.removeAll();

            if (data.cells || data.Cells) {
                ko.utils.arrayForEach(data.cells || data.Cells, (i) => {
                    this.cells.push(new DataCell(ko.utils.extend(i, {
                        extensions: data.extensions ? data.extensions.cells : null
                    })));
                });
            }
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                mark: this.mark(),
                cells: ko.utils.arrayMap(this.cells(), (i) => {
                    return (<DataCell>i).serialize();
                })
            };
        }
    }
}