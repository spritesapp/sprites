/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents a data cell input type. */
    export enum DataColumnCellInputType {
        /** Text input. */
        text = 0,

        /** Used to type in a grade. */
        grades = 1,

        /** Predictable text (typeahead). */
        predictable = 2,

        /** Mark the given row as selected. */
        mark = 3,

        /** Color selector. */
        color = 4,

        /** Percentage input. */
        percentage = 5,

        /** Timeline styles. */
        styles = 6
    }

    /** Represents a data column. */
    export class DataColumn implements IModel {
        /** Gets or sets the name of this column. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the column CSS class. */
        public cssClass: KnockoutObservable<string>;

        /** Gets or sets the input type of all cells within this column. */
        public inputType: KnockoutObservable<DataColumnCellInputType>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.name = ko.observable<string>();
            this.cssClass = ko.observable<string>();
            this.inputType = ko.observable<DataColumnCellInputType>(DataColumnCellInputType.text);

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            this.name(data.Name || data.name);
            this.cssClass(data.CssClass || data.cssClass || '');
            this.inputType(data.inputType || data.InputType || DataColumnCellInputType.text);

            if (data.extensions) {
                ko.utils.extend(this, data.extensions);
            }
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                name: this.name(),
                cssClass: this.cssClass(),
                inputType: this.inputType()
            };
        }
    }
}