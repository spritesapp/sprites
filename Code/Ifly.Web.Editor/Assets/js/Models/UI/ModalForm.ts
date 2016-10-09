/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />

module Ifly.Models.UI {
    /** Represents modal data. */
    export class ModalData implements IModel {
        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) { }

        /**  Serializes object state. */
        public serialize() {
            return { };
        }
    }

    /** Represents a modal form. */
    export class ModalForm<TModel extends IModel> {
        /** Gets or sets the modal window. */
        public modal: Ifly.ModalWindow;

        /** Gets or sets the modal container. */
        public container: any;

        /** Gets or sets the previous data. */
        public previous: TModel;

        /** Gets or sets the current data. */
        public data: TModel;

        /** Gets or sets value indicating whether modal is enabled. */
        public enabled: KnockoutObservable<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} container Container element.
         * @param {activator} Activator function.
         * @param {boolean} deferApplyBindings Value indicating whether to defer applying bindings.
         */
        constructor(container: any, activator: Function, deferApplyBindings?: boolean) {
            this.enabled = ko.observable(true);
            this.container = $(container);
            this.previous = <TModel>activator();
            this.data = <TModel>activator();

            if (!deferApplyBindings) {
                this.applyBindings();
            }
        }

        /** Applies bindings. */
        public applyBindings() {
            ko.applyBindings(this, this.container[0]);
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         */
        public open(data?: any) {
            /* Must be redefined. */
        }

        /** 
         * Loads the data.
         * @param {object} data Data.
         */
        public load(data: any) {
            data = data || {};

            (<any>this.previous['load'])(data, true);
            this.data.load(data);
        }

        /** Saves the data. */
        public save() {
            /* Must be redefined. */
        }

        /** Cancels the changes. */
        public cancel() {
            this.close();
            this.data.load(this.previous.serialize());
        }

        /** Closes the form. */
        public close() {
            if (this.modal) {
                this.modal.close();
            }
        }

        /**
         * Occurs when the user presses the key.
         * @param {object} event Event object.
         */
        public onKeyPress(event: any) {
            var code = event.keyCode || event.which || event.charCode, ret = true;

            /* Saving when "Enter" key is pressed. */
            if (code == 13) {
                this.save();
                ret = false;
            }

            return ret;
        }
    }
}