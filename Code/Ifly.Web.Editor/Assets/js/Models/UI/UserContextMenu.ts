/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="Control.ts" />

module Ifly.Models.UI {
    /** Represents a user context menu. */
    export class UserContextMenu extends Control {
        /** Gets or sets value indicating whether the menu is open. */
        public isOpen: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether user has an account. */
        public hasAccount: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether to show archive. */
        public showArchive: KnockoutObservable<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} container Control container.
         */
        constructor(container?: any) {
            this.isOpen = ko.observable<boolean>();
            this.hasAccount = ko.observable<boolean>();
            this.showArchive = ko.observable<boolean>();

            this.showArchive.subscribe(v => {
                setTimeout(() => this.updateScrollbars(), 25);
            });

            super(container);
        }

        /** Toggles menu visibility. */
        public toggleVisibility() {
            this.hasAccount(!Ifly.App.getInstance().options.demo);
            this.isOpen(!this.isOpen());

            if (this.isOpen()) {
                Ifly.App.getInstance().trackEvent('discover', 'user menu');

                this.updateScrollbars();
            }
        }

        /**
         * Shows "Help center" panel.
         */
        public showHelpCenter() {
            var help = Ifly.Editor.getInstance().help;

            if (!help.panel.isOpen()) {
                help.panel.toggleVisibility();

                /* Re-aligning controls. */
                setTimeout(() => {
                    Ifly.App.getInstance().dispatchEvent('resize', {});
                }, 1000);
            }
        }

        /**
         * Hides "Help center" panel.
         */
        public hideHelpCenter() {
            var help = Ifly.Editor.getInstance().help;

            if (help.panel.isOpen()) {
                help.panel.toggleVisibility();

                
            }
        }

        /**
         * Toggles help center visibility.
         */
        public toggleHelpCenter() {
            Ifly.Editor.getInstance().help.panel.toggleVisibility();

            $(window).trigger('resize');
        }

        private updateScrollbars() {
            var presentationList = $('.all-presentations');

            /* Activating scrollbars. */
            presentationList.get(0).nanoscroller = null;
            (<any>presentationList).nanoScroller();
        }

        /** Occurs when item within the menu is clicked. */
        public onClicked() {
            this.isOpen(false);
        }

        /**
         * Occurs when the "Edit collaborators" command is requested.
         * @aram {number} presentationId Presentation Id.
         * @param {string} presentationTitle Presentation title.
         */
        public onEditCollaborators(presentationId: number, presentationTitle: string) {
            Ifly.Editor.getInstance().collaboration.beginEditCollaborators(presentationId, presentationTitle);

            this.toggleVisibility();
        }

        /**
         * Toggles the given presentation as archived/non-archived.
         * @param {number} presentationId Presentation Id.
         * @param {boolean} isArchived Value indicating whether presentation is archived.
         * @param {Function=} onComplete A callback which is called when "is archived" flag is toggled.
         */
        public togglePresentationIsArchived(presentationId: number, isArchived: boolean, onComplete?: Function) {
            var li = null,
                origLi = null,
                component = null,
                presentationTitle = null,
                presentationCreated = null,
                app = Ifly.App.getInstance(),
                archivedPositionFound = false,
                editor = Ifly.Editor.getInstance();

            Ifly.App.getInstance().trackEvent('act', 'archive presentation');

            if (!Ifly.App.getInstance().options.demo) {
                component = component = Ifly.App.getInstance().components['UserMenu'];

                app.api.post('presentations/' + presentationId + '/archive?isArchived=' +
                    (!!isArchived), null, onComplete, true);

                if (presentationId == editor.presentation.id()) {
                    editor.presentation.isArchived(!!isArchived);
                }

                origLi = this.container.find('.all-presentations li[data-presentation-id="' + presentationId + '"]')
                    .toggleClass('um-hide', !!isArchived);

                presentationTitle = origLi.find('.col-link a').text();
                presentationCreated = origLi.find('.col-created').text();

                li = this.container.find('.archived-presentation[data-presentation-id="' + presentationId + '"]');

                li.toggleClass('um-hide', !isArchived);

                this.container.find('.archived-separator').toggleClass('um-hide', !isArchived && !this.container.find('.archived-presentation:not(.um-hide)').length);

                if (isArchived && !li.length) {
                    li = $('<li class="archived-presentation">');

                    li.attr('data-presentation-id', presentationId);
                    li.attr('data-bind', 'visible: $data.userMenu.showArchive');

                    li.append($('<span class="col-link">').text(presentationTitle));
                    li.append($('<span class="col-created">').text(presentationCreated));
                    li.append($('<span class="col-collab">'));

                    li.append($('<span class="col-archive">'));
                    li.find('.col-archive').append($('<a>').attr({
                        href: 'javascript:void(0);'
                    }).click(e => {
                        this.togglePresentationIsArchived(presentationId, false);

                        e.preventDefault();
                        e.stopPropagation();

                        return false;
                    }));

                    li.find('.col-archive a')
                        .append($('<i class="icon icon-ok-circle"></i>'))
                        .append($('<span>').text(component.terminology.unArchive));

                    if (!this.container.find('.archived-presentation').length) {
                        li.insertAfter('.archived-separator');
                    } else {
                        this.container.find('.archived-presentation').each((i, e) => {
                            if (!archivedPositionFound && moment($(e).find('.col-created').text()).toDate() <= moment(presentationCreated).toDate()) {
                                archivedPositionFound = true;

                                li.insertBefore(e);
                            }
                        });

                        if (!archivedPositionFound) {
                            li.insertAfter(this.container.find('.archived-presentation').last());
                        }
                    }

                    ko.applyBindings(editor, li.get(0));
                }

                this.updateScrollbars();
            }
        }

        /** Creates new presentation. */
        public newPresentation() {
            this.onClicked();
            location.href = '/edit';
        }

        /** Performs a user sign out. */
        public signOut() {
            this.onClicked();
            location.href = '/logout';
        }

        /** Opens "My account" page. */
        public openMyAccount() {
            this.onClicked();
            location.href = '/account';
        }

        /** Previews the current presentation. */
        public preview() {
            Ifly.App.getInstance().trackEvent('act', 'preview');

            window.open(UI.PublishSettingsModal.getPresentationUrl());
        }

        /** Presents the current presentation. */
        public present() {
            Ifly.App.getInstance().trackEvent('act', 'present');

            window.open(UI.PublishSettingsModal.getPresenterModeUrl());
        }

        /**
         * Occurs when presentation gets updated.
         * @param {Presentation} presentation Presentation.
         */
        public onPresentationUpdated(presentation: Presentation) {
            var component = null, li = null, isNewPresentation = false;

            if (!Ifly.App.getInstance().options.demo) {
                component = Ifly.App.getInstance().components['UserMenu'];

                this.container.find('.all-presentations-header').removeClass('um-hide');
                this.container.find('.all-presentations-header .col-collab').removeClass('um-hide');
                this.container.find('.all-presentations li.empty').addClass('um-hide');

                li = this.container.find('.all-presentations li[data-presentation-id="' + presentation.id() + '"]');

                if (!li.length) {
                    isNewPresentation = true;

                    li = $('<li>');

                    li.attr('data-presentation-id', presentation.id());

                    li.append($('<span class="col-link">'));
                    li.find('.col-link').append($('<a>').attr({
                        'data-presentation-id': presentation.id(),
                        href: '/edit/' + presentation.id()
                    }).on('click', e => {
                        this.onClicked();
                    }));

                    li.append($('<span class="col-created">').text(moment(presentation.created()).format('M/D/YYYY')));
                    li.append($('<span class="col-collab">'));
                    li.append($('<span class="col-archive">'));

                    if (component.canShare) {
                        li.find('.col-collab').append($('<a>').attr({
                            href: 'javascript:void(0);'
                        }));

                        li.find('.col-collab a')
                            .append($('<i class="icon icon-edit"></i>'))
                            .append($('<span>').text(component.terminology.editCollaborators));
                    }

                    li.find('.col-archive').append($('<a>').attr({
                        href: 'javascript:void(0);'
                    }));

                    li.find('.col-archive a')
                        .append($('<i class="icon icon-ban-circle"></i>'))
                        .append($('<span>').text(component.terminology.archive));

                }

                li.find('.col-link').each((i, e) => {
                    var $e = $(e);

                    if (!$e.parents('.archived-presentation').length) {
                        $e = $e.find('a');
                    }

                    $e.attr('data-presentation-id', presentation.id());
                    $e.attr('title', presentation.title());
                    $e.text(presentation.title() && presentation.title().length ? presentation.title() : ('[' + component.terminology.noTitle + ']'));

                });

                li.find('.col-collab a').off('click').on('click', e => {
                    this.onEditCollaborators(presentation.id(), presentation.title());

                    e.preventDefault();
                    e.stopPropagation();

                    return false;
                });

                li.find('.col-archive a').off('click').on('click', e => {
                    this.togglePresentationIsArchived(presentation.id(), !$(e.target).parents('.archived-presentation').length);

                    e.preventDefault();
                    e.stopPropagation();

                    return false;
                });

                if (isNewPresentation) {
                    this.container.find('.all-presentations ul').prepend(li);
                }
            }
        }
    }
}