/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents a data cell. */
    export class DataCell implements IModel {
        /** Gets or sets the cell value. */
        public value: KnockoutObservable<string>;

        /** Gets or sets the real (backing) value of this cell. */
        public realValue: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.value = ko.observable<string>();
            this.realValue = ko.observable<string>();

            (<any>this.value).checkable = ko.computed({
                read: () => {
                    return (this.value() || '').length > 0;
                },
                write: (v) => {
                    this.value(v ? 'true' : '');
                }
            });

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            if (data.extensions) {
                ko.utils.extend(this, data.extensions);
            }

            this.value(data.Value || data.value);
            this.realValue(data.RealValue || data.realValue);
        }

        /** 
         * Returns cell extension with the given name.
         * @param {string} name Extension name.
         */
        public getExtension(name: string): any {
            return (<any>this)[name];
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                value: this.value(),
                realValue: this.realValue()
            };
        }
    }
}