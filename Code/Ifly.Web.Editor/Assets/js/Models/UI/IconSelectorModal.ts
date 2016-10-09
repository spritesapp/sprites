/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Representa an icon. */
    export interface IIcon {
        /** Gets or sets icon name. */
        name: KnockoutObservable<string>;

        /** Gets or sets the preview HTML. */
        previewHtml: KnockoutObservable<string>;

        /** Gets or sets value indicating whether icon is active. */
        isActive: KnockoutObservable<boolean>;
    }

    /** Represents icon source. */
    export class IconSource {
        /** Gets or sets value indicating whether icons are being loaded. */
        public isLoading: KnockoutObservable<boolean>;

        /** Gets or sets all available icons. */
        public icons: KnockoutObservableArray<IIcon>;

        /** Gets or sets value indicating whether to always perform server reload of items. */
        public forceLiveReload: KnockoutObservable<boolean>;

        /** Gets or sets the load timer. */
        private _loadTimer: number;

        /** Initializes a new instance of an object. */
        constructor() {
            this.isLoading = ko.observable<boolean>();
            this.icons = ko.observableArray<IIcon>();
            this.forceLiveReload = ko.observable<boolean>();

            (<any>this.isLoading).done = ko.observable<boolean>();
            this.isLoading.subscribe(v => {
                if (v) {
                    (<any>this.isLoading).done(false);
                } else {
                    setTimeout(() => {
                        (<any>this.isLoading).done(true);
                    }, 100);
                }
            });
        }

        /**
         * Reloads all icons.
         * @param {string} filter Filter.
         */
        public reloadIcons(filter?: string) {
            var clearTimer = () => {
                clearTimeout(this._loadTimer);
                this._loadTimer = null;
            };

            if (!this.icons().length || this.forceLiveReload()) {
                this.icons.removeAll();

                clearTimer();

                this.isLoading(false);

                this._loadTimer = setTimeout(() => {
                    this.isLoading(true);
                }, 25);

                this.getIcons(filter, icons => {
                    clearTimer();

                    ko.utils.arrayForEach(icons, icon => {
                        this.icons.push(icon);
                    });

                    this.isLoading(false);
                });
            } else {
                ko.utils.arrayForEach(this.icons(), icon => {
                    icon.isActive(this.matchesFilter(icon.name(), filter));
                });
            }
        }

        /**
         * Returns value indicating whether the given text matches the given filter.
         * @param {string} text Text.
         * @param {string} filter Filter.
         */
        public matchesFilter(text: string, filter: string) {
            filter = Utils.Input.trim((filter || '').toLowerCase());
            return (text || '').toLowerCase().indexOf(filter) >= 0;
        }

        /**
         * Returns all icons that match the given filter.
         * @param {string} filter Filter.
         * @param {Function} complete A callback which is executed when operation completes.
         */
        public getIcons(filter: string, complete: (icons: IIcon[]) => any) {
            (complete || function () { })([]);
        }
    }

    /** Represents icon source type. */
    export enum IconSourceType {
        /** Sprites. */
        sprites = 0,

        /** Iconfinder. */
        iconFinder = 1
    }

    /** Represents Iconfinder icon source. */
    export class IconfinderIconSource extends IconSource {
        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this.forceLiveReload(true);
        }

        /**
         * Returns all icons that match the given filter.
         * @param {string} filter Filter.
         * @param {Function} complete A callback which is executed when operation completes.
         */
        public getIcons(filter: string, complete: (icons: IIcon[]) => any) {
            $.get('https://api.iconfinder.com/v2/icons/search?count=100&premium=0&vector=0&query=' + encodeURIComponent(filter || 'cat'), data => {
                complete(ko.utils.arrayMap(data && data.icons ? (data.icons || []) : [], (item: any) => {
                    var previewUrl = '', maxSize = 0;

                    if (item.raster_sizes) {
                        for (var i = 0; i < item.raster_sizes.length; i++) {
                            if (item.raster_sizes[i].size_width > maxSize && item.raster_sizes[i].formats &&
                                item.raster_sizes[i].formats.length && item.raster_sizes[i].formats[0].download_url) {

                                maxSize = item.raster_sizes[i].size_width;
                                previewUrl = item.raster_sizes[i].formats[0].preview_url;
                            }
                        }
                    }

                    return {
                        name: ko.observable<string>(previewUrl),
                        previewHtml: ko.observable<string>('<img src="' + previewUrl + '" onload="$(this).addClass(\'has-icon\');" />'),
                        isActive: ko.observable<boolean>(true)
                    };
                }));
            });
        }
    }

    /** Represents Sprites icon source. */
    export class SpritesIconSource extends IconSource {
        private static _icons: IIcon[];

        /**
         * Returns all icons that match the given filter.
         * @param {string} filter Filter.
         * @param {Function} complete A callback which is executed when operation completes.
         */
        public getIcons(filter: string, complete: (icons: IIcon[]) => any) {
            this.ensureIcons(icons => {
                ko.utils.arrayForEach(icons, icon => {
                    icon.isActive(this.matchesFilter(icon.name(), filter));
                });

                (complete || function () { })(icons);    
            });
        }

        /**
         * Ensures that icons are loaded.
         * @param {Function} complete A callback.
         */
        private ensureIcons(complete: (icons: IIcon[]) => any) {
            var root = '', rx = null, m = null;

            if (!SpritesIconSource._icons || !SpritesIconSource._icons.length) {
                root = Ifly.App.getInstance().api.root;
                root = root + (root.lastIndexOf('/') == root.length - 1 ? '' : '/');

                $.ajax({
                    url: root + '/Assets/css/font-awesome.min.css',
                    type: 'get',
                    complete: xhr => {
                        if (xhr && xhr.responseText && xhr.responseText.length) {
                            SpritesIconSource._icons = [];
                            rx = /\.icon-([a-zA-Z0-9\-]+):before([^\.\{]*)\{([^\}]+)/gi;

                            while ((m = rx.exec(xhr.responseText)) != null) {
                                if (m.length > 3 && m[3].toLowerCase().indexOf('content:') >= 0) {
                                    SpritesIconSource._icons.push({
                                        name: ko.observable<string>(m[1]),
                                        previewHtml: ko.observable<string>('<i class="icon-' + m[1] + '"></i>'),
                                        isActive: ko.observable<boolean>(true)
                                    });
                                }
                            }
                        }

                        complete(SpritesIconSource._icons || []);
                    }
                });
            } else {
                complete(SpritesIconSource._icons);
            }
        }
    }

    /** Represents icon selection. */
    export class IconSelection extends Ifly.EventSource implements IModel {
        /** Gets or sets the icon. */
        public icon: KnockoutObservable<string>;

        /** Gets or sets current icon source. */
        public iconSourceType: KnockoutObservable<IconSourceType>;

        /** Gets or sets the current icon source. */
        public iconSource: KnockoutObservable<IconSource>;

        /** Gets or sets the search term. */
        public searchTerm: KnockoutObservable<string>;

        /** Gets or sets all icon sources. */
        private _allIconSources: any;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            super();

            var reloadTimer = null, reloadIcons = null, lockSearchTerm = false;

            this.icon = ko.observable<string>();
            this.iconSource = ko.observable<IconSource>();
            this.iconSourceType = ko.observable<IconSourceType>(IconSourceType.sprites);
            this.searchTerm = ko.observable<string>('');

            (<any>this.iconSourceType).description = ko.computed<string>(() => {
                var terminology = Ifly.App.getInstance().components['IconSelectorModal'].terminology,
                    sourceType = this.iconSourceType();

                return terminology.sourceTypes[sourceType || 0];
            });

            this._allIconSources = {
                0: new SpritesIconSource(),
                1: new IconfinderIconSource()
            };

            reloadIcons = (noWait?: boolean) => {
                if (reloadTimer) {
                    clearTimeout(reloadTimer);
                    reloadTimer = null;
                }

                reloadTimer = setTimeout(() => {
                    this.iconSource().reloadIcons(this.searchTerm());
                }, noWait ? 50 : 500);
            };

            this.iconSource(this._allIconSources[0]);

            this.iconSourceType.subscribe(v => {
                this.iconSource(this._allIconSources[v]);

                if (v == IconSourceType.iconFinder) {
                    lockSearchTerm = true;
                    this.searchTerm('cat');
                } else if (this.searchTerm() && this.searchTerm().length) {
                    lockSearchTerm = true;
                    this.searchTerm('');
                }

                reloadIcons(true);
            });

            this.searchTerm.subscribe(v => {
                if (!lockSearchTerm) {
                    reloadIcons();
                } else {
                    lockSearchTerm = false;
                }
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.icon(data.icon);
            this.searchTerm('');
            this.iconSourceType(data.iconSourceType || IconSourceType.sprites);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                icon: this.icon()
            };
        }

        /**
         * Occurs when the user is changing icon source type.
         * @param {IconSourceType} type Icon source type.
         * @param {object} e Event object.
         */
        public onSourceTypeChanging(type: IconSourceType, e: any) {
            this.iconSourceType(type);

            $(e.target).parents('.dropdown').blur();
        }
    }

    /** Represents an icon selection modal. */
    export class IconSelectorModal extends ModalForm<IconSelection> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: IconSelectorModal;

        /** Gets or sets an optional callback that is called when selection is made. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#icn-selector', () => { return new IconSelection(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['IconSelectorModal'],
                shadowStripe = this.container.find('.scroll-shadow');

            this.container.find('.selector-wrapper').unbind('scroll').bind('scroll', e => {
                shadowStripe.toggle(e.target.scrollTop > 6);
            });

            super.load(data);

            this.data.iconSource().icons.removeAll();

            setTimeout(() => {
                this.data.iconSource().reloadIcons();
            }, 300);

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    cssClass: 'icn-selector-window',
                    replaceCurrent: !!o.replaceCurrent,
                    buttons: [
                        {
                            text: c.terminology.ok,
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
                    this.container.find('.search-box input').focus();
                } catch (ex) { }
            }, 100);

            Ifly.App.getInstance().trackEvent('discover', 'icon picker');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize();

            Ifly.App.getInstance().trackEvent('act', 'icon picker');

            if (this._saved) {
                this._saved(serialized);
                this._saved = null;
            }

            this.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): IconSelectorModal {
            if (!this._instance) {
                this._instance = new IconSelectorModal();
            }

            return this._instance;
        }
    }
}