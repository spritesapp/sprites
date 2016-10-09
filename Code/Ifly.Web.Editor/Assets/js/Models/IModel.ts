module Ifly.Models {
    /** Represents a loadable model. */
    export interface IModel {
        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        load(data: any);

        /** Serializes object state. */
        serialize();
    }
}