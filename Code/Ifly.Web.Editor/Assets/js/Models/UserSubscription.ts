/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents a user subscription. */
    export class UserSubscription implements IModel {
        /** Gets or sets the subscription type. */
        public type: KnockoutObservable<SubscriptionType>;

        /** Gets or sets whether user has active "Pro" subscrition. */
        public isPro: KnockoutComputed<boolean>;

        /** Gets or sets whether user has active "Agency" subscrition. */
        public isAgency: KnockoutComputed<boolean>;

        /** Gets or sets value indicating whether the corresponding subscription is a paid one. */
        public isPaid: KnockoutComputed<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.type = ko.observable<SubscriptionType>(SubscriptionType.basic);

            this.isPro = ko.computed<boolean>(() => {
                return this.type() == SubscriptionType.pro ||
                    this.type() == SubscriptionType.agency;
            });

            this.isAgency = ko.computed<boolean>(() => {
                return this.type() == SubscriptionType.agency;
            });

            this.isPaid = ko.computed<boolean>(() => {
                return this.isPro() || this.isAgency();
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.type(data.type || SubscriptionType.basic);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                type: this.type()
            };
        }
    }
} 