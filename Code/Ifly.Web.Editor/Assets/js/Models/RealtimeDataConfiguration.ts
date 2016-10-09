/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents realtime data configuration. */
    export class RealtimeDataConfiguration implements IModel {
        /** Gets or sets the source type. */
        public sourceType: KnockoutObservable<UI.DataImportSourceType>;

        /** Gets or sets the endpoint. */
        public endpoint: KnockoutObservable<string>;

        /** Gets or sets the URL-encoded parameters. */
        public parameters: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.sourceType = ko.observable<UI.DataImportSourceType>(UI.DataImportSourceType.google);
            this.endpoint = ko.observable<string>();
            this.parameters = ko.observable<string>();
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.sourceType(data.sourceType || data.SourceType || UI.DataImportSourceType.google);
            this.endpoint(data.endpoint || data.Endpoint || '');
            this.parameters(data.parameters || data.Parameters || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                sourceType: this.sourceType(),
                endpoint: this.endpoint(),
                parameters: this.parameters()
            };
        }
    }
} 