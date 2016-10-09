/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../IModel.ts" />

module Ifly.Models.Help {
    /** Represents a help topic search result. */
    export class HelpTopicSearchResult implements IModel {
        /** Gets or sets the topic Id. */
        public topicId: KnockoutObservable<number>;

        /** Gets or sets the reference key of the topic. */
        public topicReferenceKey: KnockoutObservable<string>;

        /** Gets or sets the search result title. */
        public title: KnockoutObservable<string>;

        /** Gets or sets the search result summary.. */
        public summary: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.topicId = ko.observable<number>();
            this.topicReferenceKey = ko.observable<string>();
            this.title = ko.observable<string>();
            this.summary = ko.observable<string>();

            (<any>this.summary).html = ko.computed<string>(() => {
                var ret = window['marked'](this.summary() || '');

                return ret;
            });

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            this.topicId(data.topicId || data.TopicId || 0);
            this.topicReferenceKey(data.topicReferenceKey || data.TopicReferenceKey || '');
            this.title(data.title || data.Title || '');
            this.summary(data.summary || data.Summary || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                topicId: this.topicId(),
                topicReferenceKey: this.topicReferenceKey(),
                title: this.title(),
                summary: this.summary()
            };
        }
    }
}