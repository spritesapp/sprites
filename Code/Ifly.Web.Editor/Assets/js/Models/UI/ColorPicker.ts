/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="Control.ts" />

module Ifly.Models.UI {
    /** Represents a color selector. */
    export class ColorPicker extends Control {
        /** Gets or sets the selected color. */
        public color: KnockoutObservable<string>;

        /** Gets or sets color picker input. */
        private _input: any;

        /** 
         * Initializes a new instance of an object.
         * @param {object} container Control container.
         */
        constructor(container?: any) {
            super(container);

            this.color = ko.observable<string>('#f4f4f4');

            this.color.subscribe(v => {
                this._input.colorpicker('setValue', v);
                this.dispatchEvent('colorChanged', { color: v });
            });

            this._input = (<any>this.container.find('input'));

            this._input.colorpicker().on('changeColor', e => {
                this.color(e.color.toHex());
            });

            this.enabled.subscribe(v => {
                this._input.colorpicker(v ? 'enable' : 'disable');
            });
        }

        /** Shows picker. */
        public showPicker() {
            this._input.colorpicker('show');
        }
    }
}