/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents user presentation sharing status. */
    export class PresentationUserSharingStatus implements IModel {
        /** Gets or sets the user Id. */
        public userId: KnockoutObservable<number>;

        /** Gets or sets the invite-only email used when originally sharing the presentation. */
        public userInviteEmail: KnockoutObservable<string>;

        /** Gets value indicating whether user has accepted the sharing request. */
        public hasAcceptedSharing: KnockoutComputed<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.userId = ko.observable<number>();
            this.userInviteEmail = ko.observable<string>();
            this.hasAcceptedSharing = ko.computed<boolean>(() => {
                return this.userId() > 0;
            });

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            this.userId(data.userId || data.UserId || 0);
            this.userInviteEmail(data.userInviteEmail || data.UserInviteEmail || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                userId: this.userId(),
                userInviteEmail: this.userInviteEmail()
            };
        }
    }

    /** Represents presentation sharing status. */
    export class PresentationSharingStatus implements IModel {
        /** Gets or sets the presentation Id. */
        public presentationId: KnockoutObservable<number>;

        /** Gets or sets the users this presentation is shared with. */
        public users: KnockoutObservableArray<PresentationUserSharingStatus>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.presentationId = ko.observable<number>();
            this.users = ko.observableArray<PresentationUserSharingStatus>();

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            this.presentationId(data.presentationId || data.PresentationId || 0);

            this.users.removeAll();

            ko.utils.arrayForEach(data.users || data.Users, user => {
                this.users.push(new PresentationUserSharingStatus(user));
            });
        }

        /** Serializes object state. */
        public serialize() {
            return {
                presentationId: this.presentationId(),
                users: ko.utils.arrayMap(this.users(), user => user.serialize())
            };
        }
    }

    /** Represents presentation sharing multi-status. */
    export class PresentationSharingMultiStatus {
        private _contents: any;

        /**
         * Initializes a new instance of an object.
         * @param {PresentationSharingStatus[]} statuses Statuses.
         */
        constructor(statuses?: PresentationSharingStatus[]) {
            this._contents = {};

            if (statuses) {
                ko.utils.arrayForEach(statuses, status => this.setStatus(status.presentationId(), status));
            }
        }

        /**
         * Returns the status for a given presentation.
         * @param {number} presentationId Presentation Id.
         */
        public getStatus(presentationId: number): PresentationSharingStatus {
            return this._contents[presentationId] || null;
        }

        /**
         * Updates the status for a given presentation.
         * @param {number} presentationId Presentation Id.
         * @param {PresentationSharingStatus} status Status.
         */
        public setStatus(presentationId: number, status: PresentationSharingStatus): PresentationSharingStatus {
            this._contents[presentationId] = status;

            if (this._contents[presentationId].presentationId() !== presentationId) {
                this._contents[presentationId].presentationId(presentationId);
            }

            return this.getStatus(presentationId);
        }

        /**
         * Removes the given status.
         * @param {number} presentationId Presentation Id.
         */
        public removeStatus(presentationId: number): PresentationSharingStatus {
            var ret = this.getStatus(presentationId);

            delete this._contents[presentationId];

            return ret;
        }

        /** Removes all sharing statuses from a given multi-status. */
        public removeAll() {
            this._contents = {};
        }

        /**
         * Returns value indicating whether this multi-status contains status for a given presentation.
         * @param {number} presentationId Presentation Id.
         */
        public containsStatus(presentationId: number): boolean {
            return typeof (this._contents[presentationId]) !== 'undefined' &&
                this._contents[presentationId] !== null;
        }

        /**
         * Returns value indicating whether any statuses are defined on a given multi-status.
         */
        public containsAny(): boolean {
            var ret = false;

            for (var id in this._contents) {
                if (this._contents.hasOwnProperty(id)) {
                    ret = true;
                    break;
                }
            }

            return ret;
        }
    }
} 