/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="Control.ts" />

module Ifly.Models.UI {
    /** Represents a theme selector. */
    export class TemplateSelector extends Control {
        /** Gets or sets the selected template. */
        public selectedTemplate: KnockoutObservable<ISlideTemplate>;

        /** Gets or sets all templates. */
        public templates: KnockoutObservableArray<ISlideTemplate>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} container Control container.
         */
        constructor(container?: any) {
            this.templates = ko.observableArray<ISlideTemplate>(Ifly.Editor.getInstance().templates.getSlideTemplates());
            this.selectedTemplate = ko.observable<ISlideTemplate>(this.templates()[0]);

            this.selectedTemplate.subscribe(v => {
                this.dispatchEvent('templateChanged', { template: v });
            });

            super(container);

            this.enabled.subscribe(v => {
                if (!v) {
                    this.container.attr('disabled', 'disabled');
                } else {
                    this.container.removeAttr('disabled');
                }
            });
        }

        /** 
         * Occurs when template is changing.
         * @param {string} template Template.
         * @param {Event} e Event object.
         */
        private onTemplateChanging(template: ISlideTemplate, e: Event) {
            Ifly.App.getInstance().trackEvent('act', 'slide template');

            this.selectedTemplate(template);
            $(e.target).parents('.dropdown').blur();
        }
    }
}