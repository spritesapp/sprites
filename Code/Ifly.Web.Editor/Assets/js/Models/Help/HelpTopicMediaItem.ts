/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../IModel.ts" />

module Ifly.Models.Help {
    /** Represents a help topic media item. */
    export class HelpTopicMediaItem implements IModel {
        /** Gets or sets item URL. */
        public url: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.url = ko.observable<string>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            if (typeof (data) === 'string') {
                this.url(data.toString());
            } else {
                data = data || {};

                this.url(data.url || data.Url || '');
            }
        }

        /** Serializes object state. */
        public serialize() {
            return {
                url: this.url()
            };
        }
    }
}