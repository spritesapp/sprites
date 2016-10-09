/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents a presenter mode configuration. */
    export class PresenterModeConfiguration implements IModel {
        /** Gets or sets the Id of the related presentation. */
        public presentationId: KnockoutObservable<number>;

        /** Gets or sets the availability of the element/slide animations. */
        public animations: KnockoutObservable<PresenterModeAnimationAvailability>;

        /** Gets or sets value indicating whether Sprites is allowed to ask for fullscreen mode. */
        public allowFullscreen: KnockoutObservable<boolean>;

        /** Gets the absolute URL of the infographic. */
        public url: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.presentationId = ko.observable<number>();
            this.animations = ko.observable<PresenterModeAnimationAvailability>();
            this.allowFullscreen = ko.observable<boolean>();
            this.url = ko.observable<string>();
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var ifDefined = v => {
                return typeof (v) !== 'undefined' && v !== null;
            };

            data = data || {};

            this.presentationId(data.presentationId || data.PresentationId || -1);
            this.animations(this.valueOrDefault<PresenterModeAnimationAvailability>(data, 'animations', 'Animations', PresenterModeAnimationAvailability.minimal));
            this.allowFullscreen(this.valueOrDefault<boolean>(data, 'allowFullscreen', 'AllowFullscreen', true));
            this.url(data.url || data.Url || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                presentationId: this.presentationId(),
                animations: this.animations(),
                allowFullscreen: this.allowFullscreen(),
                url: this.url()
            };
        }

        /** 
         * Returns either the specified value or the default one.
         * @param {object} data Data object.
         * @param {string} p1 Property #1 probe.
         * @param {string} p2 Property #2 probe.
         * @param {T} defautValue Default value.
         */
        private valueOrDefault<T>(data: any, p1: string, p2: string, defaultValue: T): T {
            var ret = defaultValue;

            if (typeof (data[p1]) != 'undefined' || typeof (data[p2]) != 'undefined') {
                ret = typeof (data[p1]) != 'undefined' ? data[p1] : data[p2];
            }

            return ret;
        }
    }
} 