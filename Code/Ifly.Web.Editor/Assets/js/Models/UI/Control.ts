/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../App.ts" />

module Ifly.Models.UI {
    /** Represents a reusable control. */
    export class Control extends Ifly.EventSource {
        /** Gets or sets the container. */
        public container: JQuery;

        /** Gets or sets value indicating whether control is enabled. */
        public enabled: KnockoutObservable<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} container Control container.
         */
        constructor(container?: any) {
            super();

            this.container = $(container);
            this.enabled = ko.observable(true);
        }
    }
}