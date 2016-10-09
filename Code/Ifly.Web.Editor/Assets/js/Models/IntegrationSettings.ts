/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents presentation integration settings. */
    export class IntegrationSettings implements IModel {
        /** Gets or sets Google Analytics Tracking Id. */
        public googleAnalyticsTrackingId: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.googleAnalyticsTrackingId = ko.observable<string>();
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.googleAnalyticsTrackingId(data.googleAnalyticsTrackingId || data.GoogleAnalyticsTrackingId || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                googleAnalyticsTrackingId: this.googleAnalyticsTrackingId()
            };
        }
    }
} 