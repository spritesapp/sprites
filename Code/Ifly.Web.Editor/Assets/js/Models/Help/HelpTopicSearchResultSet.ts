/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../IModel.ts" />

module Ifly.Models.Help {
    /** Represents a help topic search result set. */
    export class HelpTopicSearchResultSet implements IModel {
        /** Gets or sets the search results. */
        public results: KnockoutObservableArray<HelpTopicSearchResult>;
        
        /** Gets or sets the total number of results available. */
        public total: KnockoutObservable<number>;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.results = ko.observableArray<HelpTopicSearchResult>();
            this.total = ko.observable<number>();

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            this.results.removeAll();

            ko.utils.arrayForEach(data.results || data.Results || [], (result: any) => {
                this.results.push(new HelpTopicSearchResult(result));
            });

            this.total(data.total || data.Total || 0);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                results: ko.utils.arrayMap(this.results(), result => result.serialize()),
                total: this.total()
            };
        }
    }
}