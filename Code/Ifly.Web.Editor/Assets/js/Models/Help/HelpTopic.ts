/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../IModel.ts" />

module Ifly.Models.Help {
    /** Represents a help topic. */
    export class HelpTopic implements IModel {
        /** Gets or sets the topic Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the reference key used to uniquely identify this topic from within the UI. */
        public referenceKey: KnockoutObservable<string>;

        /** Gets or sets a topic score, based on user votes. */
        public score: HelpTopicScope;

        /** Gets or sets the topic title. */
        public title: KnockoutObservable<string>;

        /** Gets or sets the body of the help topic. */
        public body: KnockoutObservable<string>;

        /** Gets or sets the list of media items associated with this topic. */
        public mediaItems: KnockoutObservableArray<string>;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.referenceKey = ko.observable<string>();
            this.score = new HelpTopicScope();
            this.title = ko.observable<string>();
            this.body = ko.observable<string>();
            this.mediaItems = ko.observableArray<string>([]);

            (<any>this.body).html = ko.computed<string>(() => {
                var ret = window['marked'](this.body() || '');

                ret = ret.replace(/href="#([a-zA-Z0-9_\-\.]+)"/gi,
                    'href="javascript:void(0);" onclick="ko.dataFor($(this).parents(\'.help-view\').get(0)).loadTopic(\'$1\');"');

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

            this.id(data.id || data.Id || 0);
            this.referenceKey(data.referenceKey || data.ReferenceKey || '');
            this.score.load(data.score || data.Score || {});
            this.title(data.title || data.Title || '');
            this.body(data.body || data.Body || '');

            this.mediaItems.removeAll();

            ko.utils.arrayForEach(data.mediaItems || data.MediaItems || [], (mediaItem: string) => {
                this.mediaItems.push(mediaItem);
            });
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                referenceKey: this.referenceKey(),
                score: this.score.serialize(),
                title: this.title(),
                body: this.body(),
                mediaItems: this.mediaItems()
            };
        }
    }
}