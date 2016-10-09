/// <reference path="../../Typings/jquery.d.ts" />

module Ifly.Views.Account {
    /** Represents a login view. */
    export class Login {
        private static _instance: Login;

        /**
         * Initializes the application.
         * @param {object} options Initialization options.
         */
        public initialize(options?: any) {
            $('.login-oauth ul.providers input[type="radio"]').change((e) => {
                $(e.target).parents('form').submit();
            });
        }

        /** Returns an instance of the current view. */
        public static getInstance(): Login {
            if (!this._instance) {
                this._instance = new Login();
            }

            return this._instance;
        }
    }

    Ifly.App.getInstance().addEventListener('loaded', () => {
        Ifly.Views.Account.Login.getInstance().initialize();
    });
}