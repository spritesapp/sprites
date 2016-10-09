/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents a slide. */
    export class User implements IModel {
        /** Gets or sets user Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the user name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the user email. */
        public email: KnockoutObservable<string>;

        /** Gets or sets the user subscription. */
        public subscription: UserSubscription;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.name = ko.observable<string>();
            this.email = ko.observable<string>();
            this.subscription = new UserSubscription();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.id(data.id);
            this.name(data.name);
            this.email(data.email);
            this.subscription.load(data.subscription);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                name: this.name(),
                email: this.email(),
                subscription: this.subscription.serialize()
            };
        }
    }
} 