/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="Component.ts" />

module Ifly.Models.UI {
    /** Represents a collaborator. */
    export class Collaborator implements IModel {
        /** Gets or sets the Id of this collaborator. */
        public id: KnockoutObservable<number>;

        /** gets or sets the name of the collaborator. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the email of this collaborator. */
        public email: KnockoutObservable<string>;

        /** Gets or sets the display name. */
        public displayName: KnockoutComputed<string>;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Object state.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.name = ko.observable<string>();
            this.email = ko.observable<string>();

            this.displayName = ko.computed(() => {
                var ret = this.name();

                if (!ret || !ret.length) {
                    ret = this.email();

                    if (!ret || !ret.length) {
                        ret = (this.id() || 0).toString();
                    }
                }

                return ret;
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.id(data.id || data.Id || 0);
            this.name(data.name || data.Name || '');
            this.email(data.email || data.Email || '');
        }

        /** Serializes object state. */
        public serialize(): any {
            return {
                id: this.id(),
                name: this.name(),
                email: this.email()
            };
        }
    }

    /** Represents a collaboration manager. */
    export class CollaborationManager extends Component {
        /** Gets or sets value indicating whether manager has been initialized. */
        private _initialized: boolean;

        /** Gets or sets the sharing multi-status for a given user. */
        public sharingStatus: PresentationSharingMultiStatus;

        /** Gets or sets the chat manager. */
        public chat: ChatManager;

        /** Gets or sets the collaborative edits manager. */
        public collaborativeEdits: CollaborativeEditsManager;

        /** Gets or sets the current collaborators. */
        public collaborators: KnockoutObservableArray<Collaborator>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);

            this.collaborators = ko.observableArray<Collaborator>();

            (<any>this.collaborators).other = ko.computed(() => {
                return ko.utils.arrayFilter(this.collaborators(), c => {
                    return c.id() != this.editor.user.id();
                });
            });

            this.sharingStatus = new PresentationSharingMultiStatus();
            this.chat = new ChatManager(editor);
            this.collaborativeEdits = new CollaborativeEditsManager(editor);
        }

        /**
         * Opens a modal which allows editing presentation collaborators.
         * @param {number} id Presentation Id.
         * @param {string} title Presentation title.
         */
        public beginEditCollaborators(id: number, title: string) {
            CollaboratorEditModal.getInstance().open({
                presentationId: id,
                presentationTitle: title
            });
        }

        /**
         * Occurs when team is updated.
         * @param {Collaborator[]} team Team.
         */
        public onTeamUpdated(team: Collaborator[]) {
            var findTeamMamber = (whom: number, where: Collaborator[]) => {
                var result = null, filtered = null;

                filtered = ko.utils.arrayFilter(where, c => {
                    return c.id() == whom;
                });

                if (filtered.length) {
                    result = filtered[0];
                }

                return result;
            }, missing = true;

            if (team && team.length) {
                for (var i = 0; i < team.length; i++) {
                    if (!findTeamMamber(team[i].id(), this.collaborators())) {
                        this.collaborators.push(team[i]);
                    }
                }

                do {
                    for (var i = 0; i < this.collaborators().length; i++) {
                        if (missing = !findTeamMamber(this.collaborators()[i].id(), team)) {
                            this.collaborators.remove(this.collaborators()[i]);
                            break;
                        }
                    }
                } while (missing);
            } else {
                this.collaborators.removeAll();
            }

            this.dispatchEvent('teamUpdated', {
                team: this.collaborators()
            });
        }

        /**
         * Finds collaborator by Id.
         * @param {number} id Collaborator Id.
         */
        public findCollaboratorById(id: number): Collaborator {
            var ret = null;

            ko.utils.arrayForEach(this.collaborators(), c => {
                if (!ret && c.id() === id) {
                    ret = c;
                }
            });

            return ret;
        }


        /**
         * Reloads sharing multi-status.
         * @param {Function} A callback which is called when sharing status has finished loading.
         */
        public reloadSharingStatus(complete?: Function) {
            this.sharingStatus.removeAll();

            Ifly.App.getInstance().api.get('sharing/all', null, (success, data) => {
                if (success && data && (data.status || data.Status)) {
                    ko.utils.arrayForEach(data.status || data.Status, (status: any) => {
                        this.sharingStatus.setStatus(status.presentationId || status.PresentationId,
                            new Ifly.Models.PresentationSharingStatus(status));
                    });
                }

                if (complete) {
                    complete(this.sharingStatus);
                }
            }, true);
        }

        /**
         * Updates the given sharing status.
         * @param {number} presentationId Presentation Id.
         * @param {PresentationSharingStatus} overrideStatus Override status for a given presentation.
         * @param {Function} complete A callback which is called when status is updated.
         * @param {boolean} background Value indicating whether to perform the update in a background.
         */
        public updateSharingStatus(presentationId: number, overrideStatus?: PresentationSharingStatus, complete?: Function, background?: boolean) {
            var status = this.sharingStatus.getStatus(presentationId),
                serialized = null;

            if (overrideStatus) {
                overrideStatus.presentationId(presentationId);

                if (status) {
                    status.users.removeAll();

                    ko.utils.arrayForEach(overrideStatus.users(), user => {
                        status.users.push(new PresentationUserSharingStatus(user.serialize()));
                    });
                } else {
                    status = this.sharingStatus.setStatus(presentationId,
                        new PresentationSharingStatus(overrideStatus.serialize()));
                }
            }

            if (status) {
                serialized = status.serialize();
                serialized.presentationId = presentationId;

                Ifly.App.getInstance().api.post('sharing/update', serialized, (success) => {
                    if (complete) {
                        complete(!!success);
                    }
                }, background);
            } else if (complete) {
                complete(false);
            }
        }

        /** Initializes the object. */
        public initialize() {
            if (!this._initialized) {
                this._initialized = true;

                this.editor.user.id.subscribe(() => {
                    this.collaborators.removeAll();

                    this.collaborators.push(new Collaborator({
                        id: this.editor.user.id(),
                        name: this.editor.user.name(),
                        email: this.editor.user.email()
                    }));

                    this.reloadSharingStatus();
                });

                if (this.editor.user.id() > 0) {
                    this.reloadSharingStatus();
                }
            }
        }

        /**
         * Initializes real-time ocmmunication.
         * @param {complete} A callback.
         */
        public initializeRealtimeCommunication(complete?: Function) {
            (<any>$).connection.hub.start().done(() => {
                if (complete) {
                    complete();
                }

                this.dispatchEvent('realtimeCommunicationInitialized', {});
            });
        }
    }
}
