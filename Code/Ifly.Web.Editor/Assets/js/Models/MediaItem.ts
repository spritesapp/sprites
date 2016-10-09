/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="../Typings/moment.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents a media item. */
    export class MediaItem implements IModel {
        /** Gets or sets the item Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the Id of the user who has created this item. */
        public userId: KnockoutObservable<number>;

        /** Gets or sets the name of the given item. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the URL of this item. */
        public url: KnockoutObservable<string>;

        /** Gets or sets the date and time when this item was created. */
        public created: KnockoutObservable<Date>;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.userId = ko.observable<number>();
            this.name = ko.observable<string>();
            this.url = ko.observable<string>();
            this.created = ko.observable<Date>();

            (<any>this.created).fromNow = ko.computed<string>(() => {
                return moment(this.created()).fromNow();
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
            this.userId(data.userId || data.UserId || 0);
            this.name(data.name || data.Name || '');
            this.url(data.url || data.Url || '');
            this.created(moment(data.created || data.Created).toDate());
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                userId: this.userId(),
                name: this.name(),
                url: this.url(),
                created: this.created()
            };
        }
    }
}