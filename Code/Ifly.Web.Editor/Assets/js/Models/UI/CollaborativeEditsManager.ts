module Ifly.Models.UI {
    /** Represents a collaborative edit indicator. */
    export class CollaborativeEditsIndicator {
        /** 
         * Initializes the indicator.
         * @param {EventSource} emitter Event emitter (source).
         */
        public static initialize(emitter: EventSource) {
            this.watchSlideUpdates(emitter);
            this.watchElementUpdates(emitter);
        }

        /**
         * Watches slide updates.
         * @param {EventSource} emitter Event emitter (source).
         */
        private static watchSlideUpdates(emitter: EventSource) {
            var editor = Ifly.Editor.getInstance(), slideNode = null, collaborator = null;

            ko.utils.arrayForEach(['slidesCreated', 'slidesUpdated', 'slidesReordered', 'slidesDeleted'], eventName => {
                emitter.addEventListener(eventName, (sender, e) => {
                    setTimeout(() => {
                        if (this.isAnotherCollaborator(e.userId) && !Ifly.Editor.getInstance().gallery.elementProperties.isOpen()) {
                            collaborator = editor.collaboration.findCollaboratorById(e.userId);
                            slideNode = $(editor.container).find('.slide-list-contents li[data-slide="' + e.slides[0].id() + '"] a');

                            if (collaborator && slideNode.length) {
                                this.show(slideNode.get(0), e.userId, collaborator.displayName());
                            }
                        }
                    }, 25);
                });
            });
        }

        /**
         * Watches element updates.
         * @param {EventSource} emitter Event emitter (source).
         */
        private static watchElementUpdates(emitter: EventSource) {
            var editor = Ifly.Editor.getInstance(), elementNode = null, collaborator = null;

            ko.utils.arrayForEach(['elementsCreated', 'elementsUpdated', 'elementsDeleted'], eventName => {
                emitter.addEventListener(eventName, (sender, e) => {
                    setTimeout(() => {
                        if (this.isAnotherCollaborator(e.userId)) {
                            collaborator = editor.collaboration.findCollaboratorById(e.userId);
                            elementNode = $(editor.composition.infographic.findElement(e.elements[0].id()));

                            if (collaborator && elementNode.length && editor.presentation.selectedSlide() &&
                                e.elements[0].slideId() === editor.presentation.selectedSlide().id()) {

                                this.show(elementNode.get(0), e.userId, collaborator.displayName());
                            }
                        }
                    }, 25);
                });
            });
        }

        /**
         * Returns value indicating whether the given user is different from the currently authenticated one.
         * @param {number} userId User Id.
         */
        private static isAnotherCollaborator(userId: number): boolean {
            return Ifly.Editor.getInstance().collaboration.collaborativeEdits.getCurrentCollaborator().id() !== userId;
        }

        /**
         * Displays the indicator.
         * @param {JQuery} node Node being edited.
         * @param {number} id User Id.
         * @param {string} name Name of the user editing the node.
         */
        public static show(node: Node, id: number, name: string) {
            var doc = node.ownerDocument, wnd = (<any>doc.defaultView), _$ = wnd.$, $body = _$(doc.body),
                $node = _$(node), offset = $node.offset(), width = $node.width(),
                indicator = null;

            if (!wnd._ifly) wnd._ifly = {};
            if (!wnd._ifly.editIndicatorTimers) wnd._ifly.editIndicatorTimers = {};

            indicator = $body.find('[data-indicator-id="' + id + '"]');

            if (!indicator.length) {
                indicator = _$('<div class="edit-indicator" data-indicator-id="' + id + '"></div>')
                    .append($('<i class="icon icon-pencil"></i>'))
                    .append($('<span></span').text(name));

                $body.append(indicator);
            } else {
                indicator.removeClass('hiding');
            }

            indicator.css({
                top: (offset.top - 36) + 'px',
                left: (offset.left + width - 14) + 'px'
            });

            clearTimeout(wnd._ifly.editIndicatorTimers[id]);

            $body.find('.element-indicator-active').removeClass('element-indicator-active');

            setTimeout(() => {
                $node.addClass('element-indicator-active');

                if (!indicator.hasClass('active')) {
                    indicator.addClass('active');
                }

                wnd._ifly.editIndicatorTimers[id] = setTimeout(() => {
                    indicator.addClass('hiding');

                    setTimeout(() => {
                        indicator.remove();
                        $node.removeClass('element-indicator-active');
                    }, 225);
                }, 3000);
            }, 25);
        }
    }

    /** Represents a collaborative edits SignalR hub. */
    export class CollaborativeEditsHub extends Ifly.EventSource {
        private _collaborativeEdits: any;
        private _isReady: boolean;
        private _onReadyQueue: Function[];

        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this._onReadyQueue = [];
            this._collaborativeEdits = (<any>$).connection.collaborativeEditsHub;

            this._collaborativeEdits.client.onParticipantJoined = (participant: any, team: any[]) => {
                this.dispatchEvent('participantJoined', { participant: new Collaborator(participant), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onParticipantLeft = (participant: any, team: any) => {
                this.dispatchEvent('participantLeft', { participant: new Collaborator(participant), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onSettingsUpdated = (userId: number, settings: any, team: any[]) => {
                this.dispatchEvent('settingsUpdated', { userId: userId, settings: new Ifly.Models.Presentation(settings), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onSlidesCreated = (userId: number, slides: any[], team: any[]) => {
                this.dispatchEvent('slidesCreated', { userId: userId, slides: ko.utils.arrayMap(slides, s => new Ifly.Models.Slide(s)), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onSlidesUpdated = (userId: number, slides: any[], team: any[]) => {
                this.dispatchEvent('slidesUpdated', { userId: userId, slides: ko.utils.arrayMap(slides, s => new Ifly.Models.Slide(s)), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onSlidesReordered = (userId: number, slides: any[], team: any[]) => {
                this.dispatchEvent('slidesReordered', { userId: userId, slides: ko.utils.arrayMap(slides, s => new Ifly.Models.Slide(s)), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onSlidesDeleted = (userId: number, slides: any[], team: any[]) => {
                this.dispatchEvent('slidesDeleted', { userId: userId, slides: ko.utils.arrayMap(slides, s => new Ifly.Models.Slide(s)), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onElementsCreated = (userId: number, elements: any[], team: any[]) => {
                this.dispatchEvent('elementsCreated', { userId: userId, elements: ko.utils.arrayMap(elements, e => new Ifly.Models.Element(e)), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onElementsUpdated = (userId: number, elements: any[], team: any[]) => {
                this.dispatchEvent('elementsUpdated', { userId: userId, elements: ko.utils.arrayMap(elements, e => new Ifly.Models.Element(e)), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            this._collaborativeEdits.client.onElementsDeleted = (userId: number, elements: any[], team: any[]) => {
                this.dispatchEvent('elementsDeleted', { userId: userId, elements: ko.utils.arrayMap(elements, e => new Ifly.Models.Element(e)), team: ko.utils.arrayMap(team, m => new Collaborator(m)) });
            };

            Ifly.Editor.getInstance().collaboration.addEventListener('realtimeCommunicationInitialized', (sender, e) => {
                this._isReady = true;

                while (this._onReadyQueue.length > 0) {
                    this._onReadyQueue.splice(0, 1)[0]();
                }
            });
        }

        /**
         * Joins the team.
         * @param {string} team Team name.
         * @param {Collaborator} participant Participant.
         */
        public join(team: string, participant: Collaborator): boolean {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.join(team, participant.serialize());
            }

            return ret;
        }

        /**
         * Leaves the team.
         * @param {string} room Team name.
         * @param {Collaborator} participant Participant.
         */
        public leave(team: string, participant: Collaborator): boolean {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.leave(team, participant.serialize());
            }

            return ret;
        }

        /**
         * Occurs when presentation settings are updated.
         * @param {string} team Team name.
         * @param {number} userId An Id of the user responsible for this edit.
         * @param {object} settings Presentation settings.
         */
        public onSettingsUpdated(team: string, userId: number, settings: any) {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.onSettingsUpdated(team, userId, settings);
            }

            return ret;
        }

        /**
         * Occurs when slides are created.
         * @param {string} team Team name.
         * @param {number} userId An Id of the user responsible for this edit.
         * @param {Array} slides Slides.
         */
        public onSlidesCreated(team: string, userId: number, slides: any[]) {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.onSlidesCreated(team, userId, slides);
            }

            return ret;
        }

        /**
         * Occurs when slides are updated.
         * @param {string} team Team name.
         * @param {number} userId An Id of the user responsible for this edit.
         * @param {Array} slides Slides.
         */
        public onSlidesUpdated(team: string, userId: number, slides: any[]) {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.onSlidesUpdated(team, userId, slides);
            }

            return ret;
        }

        /**
         * Occurs when slides are reordered.
         * @param {string} team Team name.
         * @param {number} userId An Id of the user responsible for this edit.
         * @param {Array} slides Slides.
         */
        public onSlidesReordered(team: string, userId: number, slides: any[]) {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.onSlidesReordered(team, userId, slides);
            }

            return ret;
        }

        /**
         * Occurs when slides are deleted.
         * @param {string} team Team name.
         * @param {number} userId An Id of the user responsible for this edit.
         * @param {Array} slides Slides.
         */
        public onSlidesDeleted(team: string, userId: number, slides: any[]) {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.onSlidesDeleted(team, userId, slides);
            }

            return ret;
        }

        /**
         * Occurs when elements are created.
         * @param {string} team Team name.
         * @param {number} userId An Id of the user responsible for this edit.
         * @param {Array} elements Elements.
         */
        public onElementsCreated(team: string, userId: number, elements: any[]) {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.onElementsCreated(team, userId, elements);
            }

            return ret;
        }

        /**
         * Occurs when elements are updated.
         * @param {string} team Team name.
         * @param {number} userId An Id of the user responsible for this edit.
         * @param {Array} elements Elements.
         */
        public onElementsUpdated(team: string, userId: number, elements: any[]) {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.onElementsUpdated(team, userId, elements);
            }

            return ret;
        }

        /**
         * Occurs when elements are deleted.
         * @param {string} team Team name.
         * @param {number} userId An Id of the user responsible for this edit.
         * @param {any} elements Elements.
         */
        public onElementsDeleted(team: string, userId: number, elements: any[]) {
            var ret = this._isReady;

            if (ret) {
                this._collaborativeEdits.server.onElementsDeleted(team, userId, elements);
            }

            return ret;
        }

        /**
         * Registers a callback which is fired when hub is ready.
         * @param {Function} callback A callback.
         */
        public onReady(callback: Function) {
            if (this._isReady) {
                callback();
            } else {
                this._onReadyQueue.push(callback);
            }
        }
    }

    /** Represents a collaborative edits manager. */
    export class CollaborativeEditsManager extends Component {
        /** Gets or sets value indicating whether manager has been initialized. */
        private _initialized: boolean;

        /** Gets or sets the collaborative edits hub. */
        private _hub: CollaborativeEditsHub;

        /** Gets or sets the current team name. */
        private _team: string;

        /** Gets or sets the current participant. */
        private _me: string;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);
        }

        /** Initializes the object. */
        public initialize() {
            var c = Ifly.App.getInstance().components['ChatManager'];

            if (!this._initialized) {
                this._initialized = true;

                /* Team name is presentation Id for simplicity. */
                this._team = this.editor.presentation.id().toString();

                /* Resolving the name of the current participant. */
                this._me = Utils.Input.trim(this.editor.user.name() || '');

                if (!this._me || !this._me.length) {
                    this._me = Utils.Input.trim(this.editor.user.email() || '');

                    /* Generating the name of anonymous user. */
                    if (!this._me || !this._me.length) {
                        this._me = c.terminology['anonymous'] + ('_') + new Date().getTime().toString().split(/\d/gi).reverse().slice(0, 5).join('');
                    }
                }

                this._hub = new CollaborativeEditsHub();

                /** When someone joins, updating collaborators. */
                this._hub.addEventListener('participantJoined', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);
                });

                /** When someone leaves, updating collaborators. */
                this._hub.addEventListener('participantLeft', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);
                });

                /** When someone creates slides, reflecting the change in our view. */
                this._hub.addEventListener('settingsUpdated', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);

                    if (e.userId !== this.getCurrentCollaborator().id()) {
                        this.updateSettings(e.settings);
                    }
                });

                /** When someone creates slides, reflecting the change in our view. */
                this._hub.addEventListener('slidesCreated', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);

                    if (e.userId !== this.getCurrentCollaborator().id()) {
                        this.addSlides(e.slides);
                    }
                });

                /** When someone updates slides, reflecting the change in our view. */
                this._hub.addEventListener('slidesUpdated', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);

                    if (e.userId !== this.getCurrentCollaborator().id()) {
                        this.updateSlides(e.slides);
                    }
                });

                /** When someone updates slides order, reflecting the change in our view. */
                this._hub.addEventListener('slidesReordered', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);

                    if (e.userId !== this.getCurrentCollaborator().id()) {
                        this.reorderSlides(e.slides);
                    }
                });

                /** When someone deletes slides, reflecting the change in our view. */
                this._hub.addEventListener('slidesDeleted', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);

                    if (e.userId !== this.getCurrentCollaborator().id()) {
                        this.deleteSlides(e.slides);
                    }
                });

                /** When someone creates elements, reflecting the change in our view. */
                this._hub.addEventListener('elementsCreated', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);

                    if (e.userId !== this.getCurrentCollaborator().id()) {
                        this.addElements(e.elements);
                    }
                });

                /** When someone updates elements, reflecting the change in our view. */
                this._hub.addEventListener('elementsUpdated', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);

                    if (e.userId !== this.getCurrentCollaborator().id()) {
                        this.updateElements(e.elements);
                    }
                });

                /** When someone deletes elements, reflecting the change in our view. */
                this._hub.addEventListener('elementsDeleted', (sender, e) => {
                    Ifly.Editor.getInstance().collaboration.onTeamUpdated(e.team);

                    if (e.userId !== this.getCurrentCollaborator().id()) {
                        this.deleteElements(e.elements);
                    }
                });

                /* Initializing edit indicators. */
                CollaborativeEditsIndicator.initialize(this._hub);

                this._hub.onReady(() => {
                    /* Joining the chat. */
                    this._hub.join(this._team, this.getCurrentCollaborator());

                    /* When we update the slide, broadcasting the change to the rest of the team. */
                    this.editor.addEventListener('settingsUpdated', (sender, e) => {
                        this._hub.onSettingsUpdated(this._team, this.getCurrentCollaborator().id(), e.settings.serialize());
                    });

                    /* When we update the slide, broadcasting the change to the rest of the team. */
                    this.editor.addEventListener('slidesUpdated', (sender, e) => {
                        this._hub[e.type === 'new' ? 'onSlidesCreated' : 'onSlidesUpdated'](this._team, this.getCurrentCollaborator().id(), ko.utils.arrayMap(e.slides, (slide: any) => slide.serialize()));
                    });

                    /* When we reorder slides, broadcasting the change to the rest of the team. */
                    this.editor.addEventListener('slidesReordered', (sender, e) => {
                        this._hub.onSlidesReordered(this._team, this.getCurrentCollaborator().id(), ko.utils.arrayMap(e.slides, (slide: any) => slide.serialize()));
                    });

                    /* When we delete the slide, broadcasting the change to the rest of the team. */
                    this.editor.addEventListener('slidesDeleted', (sender, e) => {
                        this._hub.onSlidesDeleted(this._team, this.getCurrentCollaborator().id(), ko.utils.arrayMap(e.slides, (slide: any) => slide.serialize()));
                    });

                    /* When we update the element, broadcasting the change to the rest of the team. */
                    this.editor.addEventListener('elementsUpdated', (sender, e) => {
                        this._hub[e.type === 'new' ? 'onElementsCreated' : 'onElementsUpdated'](this._team, this.getCurrentCollaborator().id(), ko.utils.arrayMap(e.elements, (element: any) => element.serialize()));
                    });

                    /* When we delete the element, broadcasting the change to the rest of the team. */
                    this.editor.addEventListener('elementsDeleted', (sender, e) => {
                        this._hub.onElementsDeleted(this._team, this.getCurrentCollaborator().id(), ko.utils.arrayMap(e.elements, (element: any) => element.serialize()));
                    });

                    /* Leaving when window unloads (close/follow link). */
                    $(window).on('beforeunload', () => {
                        this._hub.leave(this._team, this.getCurrentCollaborator());
                    });
                });
            }
        }

        /** Updates presentation settings. */
        private updateSettings(settings: any) {
            this.editor.onPresentationAvailable(settings.serialize(), true);
        }

        /** Adds slides to the composition. */
        private addSlides(slides: any[]) {
            ko.utils.arrayForEach(slides, s => this.addSlide(s));
        }

        /** Adds slide to the composition. */
        private addSlide(slide: any) {
            if (this.editor.presentation.selectedSlide() &&
                this.editor.presentation.selectedSlide().id != slide.id()) {

                slide.selected(false);
            }

            this.editor.slides.onSlideUpdated(slide.serialize(), true);
        }

        /** Updates slides to the composition. */
        private updateSlides(slides: any[]) {
            ko.utils.arrayForEach(slides, s => this.updateSlide(s));
        }

        /** Reorders slides. */
        private reorderSlides(slides: any[]) {
            var slide = null,
                slideMap = {},
                slideNodes = this.editor.container.find('.slide-list-contents')
                    .find('li[data-slide]').toArray();

            ko.utils.arrayForEach(slides, s => {
                slide = this.editor.slides.findSlideById(s.id());

                if (slide) {
                    slide.order(s.order());
                    slideMap[s.id()] = s.order();
                }
            });

            ko.utils.arrayForEach(slideNodes.sort((x, y) => {
                return slideMap[parseInt($(x).attr('data-slide'), 10)] -
                    slideMap[parseInt($(y).attr('data-slide'), 10)];
            }), (slideNode: Node) => {
                slideNode.parentNode.appendChild(slideNode);
            });
        }

        /** Updates slide to the composition. */
        private updateSlide(slide: any) {
            this.editor.slides.onSlideUpdated(slide.serialize());
        }

        /** Finds and deletes slides deleted by another team member. */
        private deleteSlides(slides: any[]) {
            ko.utils.arrayForEach(slides, s => this.deleteSlide(s));
        }

        /** Finds and deletes slide deleted by another team member. */
        private deleteSlide(slide: any) {
            this.editor.slides.deleteSlide(slide, true);
        }

        /** Adds element to the composition. */
        private addElements(elements: any[]) {
            ko.utils.arrayForEach(elements, e => this.addElement(e));
        }

        /** Adds elements to the composition. */
        private addElement(element: any) {
            var slide = ko.utils.arrayFirst(this.editor.presentation.slides(), sld => {
                return sld.id() == element.slideId();
            });

            if (slide) {
                this.editor.gallery.addElement(slide, element, true);
            }
        }

        /** Updates elements to the composition. */
        private updateElements(elements: any[]) {
            ko.utils.arrayForEach(elements, e => this.updateElement(e));
        }

        /** Updates element to the composition. */
        private updateElement(element: any) {
            var elm = this.findElement(element), slide = null;

            if (elm) {
                slide = ko.utils.arrayFirst(this.editor.presentation.slides(), sld => {
                    return sld.id() == element.slideId();
                });

                if (slide) {
                    ko.utils.arrayForEach(slide.elements(), (e: Element) => {
                        if (e.id() == elm.id()) {
                            e.load(element.serialize());
                        }
                    });
                }

                if (this.editor.presentation.selectedSlide() && slide.id() == this.editor.presentation.selectedSlide().id()) {
                    this.editor.composition.updateElement(elm, true);

                    if (this.editor.gallery.elementProperties.selectedElement !== null && this.editor.gallery.elementProperties.selectedElement.id() === elm.id()) {
                        this.editor.gallery.elementProperties.update(editable => {
                            editable.load(elm, true);
                        });
                    }
                }
            }
        }

        //** Finds and deletes elements deleted by another team member. */
        private deleteElements(elements: any[]) {
            ko.utils.arrayForEach(elements, e => this.deleteElement(e));
        }

        /** Finds and deletes element deleted by another team member. */
        private deleteElement(element: any) {
            var elm = this.findElement(element);

            if (elm) {
                this.editor.composition.deleteElement(elm, true);
            }
        }

        /** 
         * Finds the element in the composition.
         */
        private findElement(element: any) {
            var ret = null;

            if (this.editor.presentation) {
                ko.utils.arrayFirst(this.editor.presentation.slides(), slide => {
                    var result = false;

                    if (!ret) {
                        ret = ko.utils.arrayFirst(slide.elements(), elm => {
                            return elm.id() == element.id();
                        });

                        if (ret) {
                            result = true;
                        }
                    }

                    return result;
                });
            }

            return ret;
        }

        /**
         * Returns the current collaborator.
         */
        public getCurrentCollaborator(): Collaborator {
            var user = Ifly.Editor.getInstance().user, ret = null;

            ret = new Collaborator({
                id: user.id(),
                name: user.name(),
                email: user.email()
            });

            if (!ret.name() || !ret.name().length) {
                ret.name(this._me);
            }

            return ret;
        }
    }
} 