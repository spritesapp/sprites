/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />
/// <reference path="Element.ts" />

module Ifly.Models {
    /** Represents impression summary channel. */
    export enum ImpressionSummaryChannel {
        /** Direct. */
        direct = 0,
        
        /** Facebook. */
        facebook = 1,
        
        /** Twitter. */
        twitter = 2,
        
        /** LinkedIn. */
        linkedIn = 3,

        /** Google+. */
        googlePlus = 4
    }

    /** Represents an impression summary. */
    export class ImpressionSummary implements IModel {
        /** Gets or sets the impression summary channel. */
        public channel: KnockoutObservable<ImpressionSummaryChannel>;

        /** Gets or sets the point in time (hour, day, month, etc. depending on a scale). */
        public pointInTime: KnockoutObservable<number>;

        /** Gets or sets the total number of impressions. */
        public totalImpressions: KnockoutObservable<number>;

        /** Gets or sets the relative order of this summary. */
        public order: KnockoutObservable<number>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.channel = ko.observable<ImpressionSummaryChannel>();
            this.pointInTime = ko.observable<number>();
            this.totalImpressions = ko.observable<number>();
            this.order = ko.observable<number>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {boolean} onlyBasics Indicates whether to only load basic properties.
         */
        public load(data: any, onlyBasics?: boolean) {
            data = data || {};

            this.channel(data.channel || data.Channel || 0);
            this.pointInTime(data.pointInTime || data.PointInTime || 0);
            this.totalImpressions(data.totalImpressions || data.TotalImpressions || 0);
            this.order(data.order || data.Order || 0);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                channel: this.channel(),
                pointInTime: this.pointInTime(),
                totalImpressions: this.totalImpressions(),
                order: this.order()
            };
        }
    }
} 