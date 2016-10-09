/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/q.d.ts" />
/// <reference path="../IModel.ts" />

module Ifly.Models.Help {
    /** Represents help panel view. */
    export enum HelpPanelView {
        /** Welcome screen. */
        welcome = 1,

        /** Topic. */
        topic = 2,

        /** Search results. */
        search = 3
    }

    /** Represents view history entry. */
    export interface IViewHistoryEntry {
        /** Gets or sets the view. */
        view: HelpPanelView;

        /** Gets or sets the view data (if any). */
        viewData?: any;
    }

    /** Represents help panel media viewer. */
    export class HelpPanelMediaViewer {
        /** Gets or sets the media items. */
        public items: KnockoutObservableArray<HelpTopicMediaItem>;

        /** Gets or sets value indicating whether viewer is open. */
        public isOpen: KnockoutObservable<boolean>;

        /** Gets or sets the currently selected item. */
        public selectedItem: KnockoutObservable<HelpTopicMediaItem>;

        /** Gets or sets selected item changing timers. */
        private _selectedItemChangingTimers: any;

        /** Initializes a new instance of an object. */
        constructor() {
            this.isOpen = ko.observable<boolean>();
            this.items = ko.observableArray<HelpTopicMediaItem>();
            this.selectedItem = ko.observable<HelpTopicMediaItem>();

            this._selectedItemChangingTimers = {
                started: null,
                changing: null
            };

            (<any>this.isOpen).closing = ko.observable<boolean>();
            this.selectedItem.subscribe(v => {
                if (v) {
                    (<any>this.isOpen).closing(false);
                    this.isOpen(true);
                } else {
                    this.close();
                }
            });

            (<any>this.selectedItem).isChanging = ko.observable<boolean>();
            (<any>this.selectedItem).isChanging.started = ko.observable<boolean>();

            (<any>this.selectedItem).nextItem = ko.computed<HelpTopicMediaItem>(() => {
                var index = -1,
                    items = this.items(),
                    curSelectedItem = this.selectedItem();

                for (var i = 0; i < items.length; i++) {
                    if (items[i] == curSelectedItem) {
                        index = i + 1;
                    }
                }

                if (index < 0 || index > (items.length - 1)) {
                    index = 0;
                }

                return items[index];
            });
        }

        /**
         * Occurs when click event occurs within the viewer area.
         * @param {Event} e Event object.
         */
        public onClick(e: Event) {
            var t = $(e.target);

            if (!t.hasClass('viewer-box') && !t.parents('.viewer-box').length) {
                this.close();
            } else {
                this.selectItem((<any>this.selectedItem).nextItem());
            }
        }

        /** Closes the viewer. */
        public close() {
            (<any>this.isOpen).closing(true);

            setTimeout(() => {
                this.isOpen(false);
                (<any>this.isOpen).closing(false);
            }, 325);
        }

        /** 
         * Loads viewer data.
         * @param data {any} Viewer data.
         */
        public load(data: any) {
            var list = [];

            this.items.removeAll();
            this.selectedItem(null);

            if (data) {
                if ($.isArray(data)) {
                    list = data;
                } else if (data.mediaItems) {
                    if ($.isArray(data.mediaItems)) {
                        list = data.mediaItems;
                    } else if ($.isFunction(data.mediaItems.subscribe)) {
                        list = data.mediaItems();
                    }
                } else if (data.items && $.isArray(data.items)) {
                    list = data.items;
                }

                ko.utils.arrayForEach(list, elem => {
                    this.items.push(new HelpTopicMediaItem($.isFunction(elem.serialize) ? elem.serialize() : elem));
                });
            }
        }

        /**
         * Selects the given item.
         * @param item {object} Item to select.
         */
        public selectItem(item: any) {
            var needsChanging = typeof (item) !== 'undefined' &&
                item !== null &&
                this.selectedItem() &&
                this.selectedItem() != item;

            if (!(<any>this.selectedItem).isChanging() && !(<any>this.selectedItem).isChanging.started()) {
                if (needsChanging) {
                    clearTimeout(this._selectedItemChangingTimers.started);

                    (<any>this.selectedItem).isChanging.started(true);

                    this._selectedItemChangingTimers.started = setTimeout(() => {
                        clearTimeout(this._selectedItemChangingTimers.changing);

                        (<any>this.selectedItem).isChanging.started(false);
                        (<any>this.selectedItem).isChanging(true);

                        this._selectedItemChangingTimers.changing = setTimeout(() => {
                            (<any>this.selectedItem).isChanging(false);
                        }, 325);
                    }, 100);
                }

                if (typeof (item) === 'number') {
                    this.selectedItem(this.items()[<number>item]);
                } else if (item && typeof (item.url) !== 'undefined') {
                    this.selectedItem(<HelpTopicMediaItem>item);
                } else {
                    this.selectedItem(null);
                }
            }
        }
    }
    
    /** Represents a help panel. */
    export class HelpPanel {
        /** Gets or sets value indicating whether panel is open. */
        public isOpen: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether panel is being rendered. */
        public isRendering: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether view is being loaded. */
        public isLoadingView: KnockoutObservable<boolean>;

        /** Gets or sets the help service. */
        public service: HelpService;

        /** Gets or sets the media viewer. */
        public mediaViewer: HelpPanelMediaViewer;

        /** Gets or sets the current view. */
        public view: KnockoutObservable<HelpPanelView>;

        /** Gets or sets the previous view. */
        public viewHistory: KnockoutObservableArray<IViewHistoryEntry>;

        /** Gets or sets the currently selected help topic. */
        public selectedTopic: KnockoutObservable<HelpTopic>;

        /** Gets or sets the current search results. */
        public searchResults: KnockoutObservableArray<HelpTopicSearchResult>;

        /** Gets or sets the current search term. */
        public searchTerm: KnockoutObservable<string>;

        /** Gets or sets value indicating whether search results are being loaded from the server. */
        public isLoadingSearchResults: KnockoutObservable<boolean>;

        /** Gets or sets the view data. */
        private _viewData: any;

        /** Initializes a new instance of an object. */
        constructor() {
            var api = Ifly.App.getInstance().api,
                bouncingTimer = null,
                loadingTimer = null;

            this.isOpen = ko.observable<boolean>();
            this.isRendering = ko.observable<boolean>();
            this.view = ko.observable<HelpPanelView>(HelpPanelView.welcome);
            this.selectedTopic = ko.observable<HelpTopic>();
            this.viewHistory = ko.observableArray<IViewHistoryEntry>();
            this.isLoadingView = ko.observable<boolean>();
            this.searchResults = ko.observableArray<HelpTopicSearchResult>();
            this.searchTerm = ko.observable<string>();
            this.isLoadingSearchResults = ko.observable<boolean>();
            this.mediaViewer = new HelpPanelMediaViewer();

            (<any>this.isLoadingView).progress = ko.observable<boolean>();

            this.isLoadingView.subscribe(v => {
                clearTimeout(loadingTimer);

                if (v) {
                    $('.help-view:visible').hide().removeClass('showing');

                    loadingTimer = setTimeout(() => {
                        (<any>this.isLoadingView).progress(true);
                    }, 350);
                } else {
                    (<any>this.isLoadingView).progress(false);
                }
            });

            (<any>this.isLoadingView).progress.subscribe(v => {
                if (v) {
                    api.showProgress();
                } else {
                    api.hideProgress();
                }
            });

            (<any>this.selectedTopic).exists = ko.computed<boolean>(() => {
                var topic = this.selectedTopic();

                return topic && topic.id() > 0;
            });

            this.selectedTopic.subscribe(v => {
                this.mediaViewer.load(v ? v.mediaItems() : []);
            });

            (<any>this.isOpen).closing = ko.observable<boolean>();

            this.isOpen.subscribe(v => {
                clearTimeout(bouncingTimer);

                (<any>this.isOpen).closing(false);

                if (!v) {
                    (<any>this.isOpen).closing(true);

                    bouncingTimer = setTimeout(() => {
                        (<any>this.isOpen).closing(false);
                    }, 1000);
                }
            });

            this.isRendering.subscribe(v => {
                var manager = null,
                    interval = null,
                    checkForService = null;

                setTimeout(() => {
                    this.refresh();
                }, 325);

                if (!v) {
                    checkForService = () => {
                        if (!this.service) {
                            this.service = Ifly.Editor.getInstance().help.service;
                        } else {
                            clearInterval(interval);

                            this.reset();
                        }
                    };

                    interval = setInterval(checkForService, 100);
                    checkForService();
                }
            });

            this.refresh();
        }

        /**
         * Performs a search.
         * @param searchTerm {string} Search term.
         */
        public search(searchTerm: string) {
            var deferred = Q.defer<any>(),

                /**
                 * Ensures that the user is brought to "Search results" view.
                 */
                ensureTransitioned = (): Q.Promise<any> => {
                    return Q.when()
                        .then(() => {
                            return this.view() !== HelpPanelView.search ? this.transitionToView(HelpPanelView.search, { term: searchTerm }) : null;
                        });
                };

            searchTerm = searchTerm || this.searchTerm();

            this.searchTerm(searchTerm);
            this.isLoadingSearchResults(true);

            if (searchTerm && searchTerm.length) {
                this.service.searchForTopics(searchTerm).then(results => {
                    this.searchResults(results.results());
                    
                    ensureTransitioned()
                        .then(() => {
                            deferred.resolve(ko.utils.arrayMap(this.searchResults(), result => {
                                return result.serialize();
                            }));
                        });
                }, err => {
                    this.searchResults([]);

                    ensureTransitioned()
                        .then(() => {
                            deferred.reject(err);
                        });
                })
                .finally(() => {
                    this.isLoadingSearchResults(false);
                });
            } else {
                this.isLoadingSearchResults(false);
                deferred.resolve([]);
            }

            return deferred.promise;
        }

        /** Toggles panel visibility. */
        public toggleVisibility() {
            this.isOpen(!this.isOpen());

            if (this.isOpen()) {
                this.refresh();
            }
        }

        /** Resets the panel's content. */
        public reset() {
            this.view(HelpPanelView.welcome);
        }

        /** 
         * Loads the given topic.
         * @param id {string} Topic Id.
         * @param noHistory {boolean=} Value indicating whether not to keep history of this transition.
         */
        public loadTopic(id: string, noHistory?: boolean): Q.Promise<any> {
            this.isLoadingView(true);
            this.selectedTopic(new HelpTopic());

            return Q.when()
                .then(() => {
                    return this.service.getTopic(id);
                })
                .then((topic: HelpTopic) => {
                    this.selectedTopic(topic);

                    this.isLoadingView(false);
                })
                .then(() => {
                    var delayTask = Q.defer();

                    setTimeout(() => {
                        delayTask.resolve({});
                    }, 50);

                    return delayTask.promise;
                })
                .then(() => {
                    return this.transitionToView(HelpPanelView.topic, { id: id }, noHistory);
                })
                .catch(err => {
                    return Q.reject(err);
                })
                .finally(() => {
                    this.isLoadingView(false);
                });
        }

        /** Goes back to the previous view. */
        public goBack() {
            var prev = this.viewHistory.pop(),
                ret = null;

            if (prev) {
                if (prev.view == HelpPanelView.topic) {
                    ret = this.loadTopic(prev.viewData.id, true);
                } else {
                    ret = this.transitionToView(prev.view, prev.viewData, true);
                }
            } else {
                ret = Q.resolve({});
            }

            return ret;
        }

        /**
         * Returns the user to the home page.
         */
        public goHome() {
            return this.transitionToView(HelpPanelView.welcome, null, true);
        }

        /**
         * Transitions the panel to the given view.
         * @param show {HelpPanelView} View to transition to.
         * @param viewData {object=} Custom view data.
         * @param noHistory {boolean=} Value indicating whether not to keep history of this transition.
         * @returns {Q.Promise} A promise which, when resolves, indicates of a successful transition.
         */
        public transitionToView(show: HelpPanelView, viewData?: any, noHistory?: boolean): Q.Promise<any> {
            if (!noHistory) {
                this.viewHistory.push({
                    view: this.view(),
                    viewData: this._viewData
                });
            }

            return Q.when()
                .then(() => {
                    this.view(show);
                    this._viewData = viewData;
                })
                .then(() => {
                    var task = Q.defer(),
                        hide = $('.help-view:visible'),
                        w = $('.help-panel-content-inner .view-' +
                            HelpPanelView[show].toLowerCase());

                    hide.removeClass('showing').hide();
                    
                    setTimeout(() => {
                        w.show();

                        setTimeout(() => {
                            w.addClass('showing');

                            setTimeout(() => {
                                task.resolve({});
                            }, 350);
                        }, 25);
                    }, 50);
                    
                    return task.promise;
                })
                .then(() => {
                    this.refresh();
                })
                .then(() => {
                    return show;
                })
                .catch(err => {
                    return Q.reject(err);
                });
        }

        /** Updates scrollbars. */
        public refresh() {
            var list = $('.help-panel .nano');

            /* Activating scrollbars. */
            list.get(0).nanoscroller = null;
            (<any>list).nanoScroller();
        }
    }
}