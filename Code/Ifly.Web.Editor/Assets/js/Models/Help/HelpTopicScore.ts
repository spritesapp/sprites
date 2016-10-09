/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../IModel.ts" />

module Ifly.Models.Help {
    /** Represents a help topic score. */
    export class HelpTopicScope implements IModel {
        /** Gets or sets the positive part of the score. */
        public positive: KnockoutObservable<number>;

        /** Gets or sets the negative part of the score. */
        public negative: KnockoutObservable<number>;

        /** Gets the total scopre. */
        public total: KnockoutComputed<number>;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.positive = ko.observable<number>();
            this.negative = ko.observable<number>();
            this.total = ko.computed<number>(() => this.positive() + this.negative());

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            this.positive(data.positive || data.Positive || 0);
            this.negative(data.negative || data.Negative || 0);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                positive: this.positive(),
                negative: this.negative()
            };
        }
    }
}