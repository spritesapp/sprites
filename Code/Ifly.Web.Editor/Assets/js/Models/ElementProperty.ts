/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents an element property. */
    export class ElementProperty implements IModel {
        /** Gets or sets the property Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the element Id. */
        public elementId: KnockoutObservable<number>;

        /** Gets or sets the property name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the property value. */
        public value: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.elementId = ko.observable<number>();
            this.name = ko.observable<string>();
            this.value = ko.observable<string>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.id(data.id || data.Id || 0);
            this.elementId(data.elementId || data.ElementId || 0);
            this.name(data.name || data.Name || '');
            this.value((data.value != null ? data.value : (data.Value != null ? data.Value : '')).toString());
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                elementId: this.elementId(),
                name: this.name(),
                value: this.value()
            };
        }
    }
}