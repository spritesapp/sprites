/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents a publish configuration. */
    export class PublishConfiguration implements IModel {
        /** Gets or sets the Id of the related presentation. */
        public presentationId: KnockoutObservable<number>;

        /** Gets or sets the zero-based index of a specific slide to display. */
        public slide: KnockoutObservable<number>;

        /** Gets or sets value indicating whether to display navigation controls. */
        public controls: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether to automatically start playing animations. */
        public autoPlay: KnockoutObservable<boolean>;

        /** Gets or sets the MD5 hash of the password which indicates that this is a private presentation. */
        public passwordHash: KnockoutObservable<string>;

        /** Gets the absolute URL of the infographic. */
        public url: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.presentationId = ko.observable<number>();
            this.slide = ko.observable<number>(-1);
            this.controls = ko.observable<boolean>(true);
            this.autoPlay = ko.observable<boolean>(true);
            this.url = ko.observable<string>();
            this.passwordHash = ko.observable<string>();
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
            this.slide(this.valueOrDefault<number>(data, 'slide', 'Slide', -1));
            this.controls(this.valueOrDefault<boolean>(data, 'controls', 'Controls', true));

            this.autoPlay(ifDefined(data.autoPlay) ? !!data.autoPlay : (ifDefined(data.AutoPlay) ? !!data.AutoPlay : true));
            this.url(data.url || data.Url || '');
            this.passwordHash(data.passwordHash || data.PasswordHash || data.password || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                presentationId: this.presentationId(),
                slide: this.slide(),
                controls: this.controls(),
                autoPlay: this.autoPlay(),
                url: this.url(),
                passwordHash: this.passwordHash()
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