/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />
/// <reference path="Element.ts" />

module Ifly.Models {
    /** Represents a slide. */
    export class Slide implements IModel {
        /** Gets or sets the slide Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the Id of the corresponding presentation. */
        public presentationId: KnockoutObservable<number>;

        /** Gets or sets the zero-based order number of the slide. */
        public order: KnockoutObservable<number>;

        /** Gets or sets the slide title. */
        public title: KnockoutObservable<string>;

        /** Gets or sets the slide description. */
        public description: KnockoutObservable<string>;

        /** Gets or sets the slide elements. */
        public elements: KnockoutObservableArray<Element>;

        /** Gets or sets the play time for this slide. */
        public playbackTime: KnockoutObservable<number>;

        /** Gets or sets value indicating whether slide is selected. */
        public selected: KnockoutObservable<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.presentationId = ko.observable<number>();
            this.order = ko.observable<number>();
            this.title = ko.observable<string>();
            this.description = ko.observable<string>();
            this.selected = ko.observable<boolean>(false);
            this.elements = ko.observableArray<Element>();
            this.playbackTime = ko.observable<number>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         * @param {boolean} onlyBasics Indicates whether to only load basic properties.
         */
        public load(data: any, onlyBasics?: boolean) {
            var ifGreaterThanZero = v => v > 0 ? v : null;

            data = data || {};

            this.id(data.id || data.Id || 0);
            this.presentationId(data.presentationId || data.PresentationId || 0);
            this.order(data.order || data.Order || 0);
            this.title(data.title || data.Title || '');
            this.description(data.description || data.Description || '');
            this.playbackTime(ifGreaterThanZero(data.playbackTime || data.PlaybackTime || 0));

            if (!onlyBasics) {
                this.elements.removeAll();

                if (data.elements || data.Elements) {
                    ko.utils.arrayForEach(data.elements || data.Elements, (e) => {
                        this.elements.push(new Element(e));
                    });
                }
            }
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                presentationId: this.presentationId(),
                order: this.order(),
                title: this.title(),
                description: this.description(),
                playbackTime: this.playbackTime(),
                elements: ko.utils.arrayMap(this.elements(), (e) => {
                    return (<Element>e).serialize();
                })
            };
        }
    }
}