/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents icon selection. */
    export class CollaboratorData implements IModel {
        /** Gets or sets presentation Id. */
        public presentationId: KnockoutObservable<number>;

        /** Gets or sets presentation title. */
        public presentationTitle: KnockoutObservable<string>;

        /** Gets or sets the users this presentation is shared with. */
        public users: KnockoutObservableArray<PresentationUserSharingStatus>;

        /** Gets or sets the list of removed users. */
        private _removedUsers: KnockoutObservableArray<PresentationUserSharingStatus>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            var reloadTimer = null;

            this.presentationId = ko.observable<number>();
            this.presentationTitle = ko.observable<string>();
            this.users = ko.observableArray<PresentationUserSharingStatus>();
            this._removedUsers = ko.observableArray<PresentationUserSharingStatus>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.presentationId(data.presentationId || data.PresentationId);
            this.presentationTitle(data.presentationTitle || data.PresentationTitle);

            this.users.removeAll();

            ko.utils.arrayForEach(data.users || data.Users || [], user => {
                this.users.push(new PresentationUserSharingStatus(user));
            });
        }

        /** Serializes object state. */
        public serialize() {
            return {
                presentationId: this.presentationId(),
                presentationTitle: this.presentationTitle(),
                users: ko.utils.arrayMap(this.users(), user => user.serialize())
            };
        }

        /**
         * Removes the given user.
         * @param {PresentationUserSharingStatus} user User to remove.
         */
        public removeUser(user: PresentationUserSharingStatus) {
            this.users.remove(user);

            if (user.hasAcceptedSharing()) {
                this._removedUsers.push(user);
            }
        }

        /**
         * Occurs when user is typing new user's email.
         * @param {string} value Current value.
         * @param {KeyboardEvent} event Event.
         */
        public onAddUserKeyUp(value: string, event: KeyboardEvent) {
            var removedUser = null, findUser = (source: PresentationUserSharingStatus[]): PresentationUserSharingStatus => {
                var result = null;

                ko.utils.arrayForEach(source, user => {
                    if (Utils.Input.trim(user.userInviteEmail() || '').toLowerCase() == value.toLowerCase()) {
                        result = user;
                    }
                });

                /* Can't add yourself as collaborator. */
                if (!result && (Ifly.Editor.getInstance().user.email() || '').toLowerCase() === value.toLowerCase()) {
                    result = {};
                }

                return result;
            }, isButton = ((<any>event.target).tagName || (<any>event.target).nodeName || '').toLowerCase() !== 'input';

            if (((event.keyCode || event.charCode || event.which) == 13 || isButton) && value && value.length && value.indexOf('@') > 0) {
                value = Utils.Input.trim(value);

                if (!findUser(this.users())) {
                    removedUser = findUser(this._removedUsers());

                    if (removedUser) {
                        this.users.push(removedUser);
                        this._removedUsers.remove(removedUser);
                    } else {
                        this.users.push(new PresentationUserSharingStatus({
                            userId: -1,
                            userInviteEmail: value
                        }));
                    }
                    
                    (isButton ? $(event.target).parents('.add-search').find('input') : $(event.target)).val('');
                }

                event.preventDefault();
                event.stopPropagation();
            }
        }
    }

    /** Represents collaborator edit modal. */
    export class CollaboratorEditModal extends ModalForm<CollaboratorData> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: CollaboratorEditModal;

        /** Gets or sets an optional callback that is called when collaborators are confirmed. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#collaborator-modal', () => { return new CollaboratorData(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                collaboration = Ifly.Editor.getInstance().collaboration,
                c = app.components['CollaboratorEditModal'], status = null;

            if (!data.users && !data.Users) {
                status = collaboration.sharingStatus.getStatus(data.presentationId || data.PresentationId);

                if (status) {
                    data.users = ko.utils.arrayMap(status.users(),
                        (u: any) => u.serialize());
                }
            }

            super.load(data);

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    cssClass: 'collaborator-modal-window',
                    buttons: [
                        {
                            text: c.terminology.save,
                            click: () => { this.save(); }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this.cancel(); }
                        }
                    ]
                });
            } else {
                this.modal.updateButtons();
                this.modal.open();
            }

            setTimeout(() => {
                try {
                    $(this.container).find('input').get(0).focus();
                } catch (ex) { }
            }, 100);

            Ifly.App.getInstance().trackEvent('discover', 'edit collaborators');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize(),
                collaboration = Ifly.Editor.getInstance().collaboration,
                c = Ifly.App.getInstance().components['CollaboratorEditModal'];

            Ifly.App.getInstance().trackEvent('act', 'edit collaborators');

            if (this.enabled()) {
                this.enabled(false);

                this.modal.updateButtons({
                    primary: {
                        text: c.terminology.saving,
                        enabled: false
                    },
                    secondary: {
                        enabled: false
                    }
                });

                collaboration.updateSharingStatus(this.data.presentationId(), new PresentationSharingStatus(serialized), () => {
                    this.enabled(true);
                    this.modal.updateButtons();

                    if (this._saved) {
                        this._saved(serialized);
                        this._saved = null;
                    }

                    this.close();
                });
            }
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): CollaboratorEditModal {
            if (!this._instance) {
                this._instance = new CollaboratorEditModal();
            }

            return this._instance;
        }
    }
}