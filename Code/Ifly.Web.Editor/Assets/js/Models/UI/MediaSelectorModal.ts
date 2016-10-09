/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents external media source. */
    export enum ExternalMediaSource {
        /** Google Drive. */
        drive = 0,

        /** Dropbox. */
        dropbox = 1
    }

    /** Represents a file picker. */
    export interface IFilePicker {
        /** 
         * Opens file picker.
         * @param {Function} complete A callback which is called when the file has been selected.
         */
        openPicker(complete: (url: string) => any);
    }

    /** Represents gallery media item load watcher. */
    export interface IGalleryMediaItemLoadWatcher {
        /**
         * Occurs when media loads successfully.
         * @param {HTMLImageElement} node HTML node that corresponds to this media.
         * @param {GalleryMediaItem} media Associated media item.
         */
        onLoad: (node: HTMLImageElement, media: GalleryMediaItem) => any;

        /**
         * Occurs when media fails to load successfully.
         * @param {HTMLImageElement} node HTML node that corresponds to this media.
         * @param {GalleryMediaItem} media Associated media item.
         */
        onError: (node: HTMLImageElement, media: GalleryMediaItem) => any;
    }

    /** Represents file drag'n'drop manager. */
    export class FileDragAndDropManager {
        private static _instance: FileDragAndDropManager;

        /** Initializes the manager. */
        public initialize(editor: Editor) {
            /**
             * Initializes the given drop zone.
             * @param {string} id Drop zone Id.
             * @param {Function} parentQuery A function which returns a parent element for a new drop zone.
             */
            var initializeDropZone = (id: string, parentQuery: () => JQuery) => {
                var dropZone = $('#' + id),
                    dragCollection = $(),
                    terminology = null,
                    parent = null;

                /**
                 * Returnes value indicating whether user has selected a slide.
                 */
                var isSlideSelected = (): boolean => {
                    return editor.presentation !== null &&
                        editor.presentation.id() > 0 &&
                        editor.presentation.selectedSlide() !== null &&
                        editor.presentation.selectedSlide().id() > 0;
                };

                /**
                 * Changes the visiblity state of a drop zone.
                 * @param {boolean} isVisible Value indicating whether drop zone is visible.
                 */
                var changeDropZoneIsVisible = (isVisible: boolean) => {
                    if (isVisible && !dropZone.hasClass('visible')) {
                        dropZone.show();
                        setTimeout(() => {
                            dropZone.addClass('visible');
                        }, 10);
                    } else if (!isVisible && dropZone.hasClass('visible')) {
                        dropZone.removeClass('visible');
                        setTimeout(() => {
                            dropZone.hide();
                        }, 310);
                    }
                };

                /**
                 * Occurs when files are dropped.
                 * @param {any[]} files Files that are dropped.
                 */
                var onFilesDropped = (files: any[]) => {
                    var app = Ifly.App.getInstance(),
                        presentationId = null,
                        slideId = null,
                        modal = null;

                    /* We are only interested in image files that are smaller than 1MB. */
                    var imageFiles = ko.utils.arrayFilter(files, file => {
                        return file.type.toLowerCase().indexOf('image/') === 0 && file.size <= (1024 * 1024);
                    });

                    slideId = editor.presentation.selectedSlide() ?
                        editor.presentation.selectedSlide().id() : 0;

                    presentationId = editor.presentation.id();
                    
                    if (imageFiles.length) {
                        /* Uploading the first file (no multi-upload). */
                        app.api.upload('images/upload?id=' + presentationId +
                            '&slideId=' + slideId +
                            '&elementId=0', { files: [imageFiles[0]] }, media => {

                            try {
                                media = typeof (media) === 'string' ? JSON.parse(media) : media;
                            } catch (ex) { }

                            /* Getting the image URL. */
                            var url = media ? (media.url || media.Url) : '';

                            if (url) {
                                /* This will paste a new element onto the current slide. */
                                editor.gallery.newElement(ElementType.image,
                                    app.components['MediaSelectorModal'].terminology.imageElementName, [
                                    new ElementProperty({
                                        name: 'url',
                                        value: url
                                    })
                                ], true).isCopied(false);
                            }
                        });

                    } else if (files.length) {
                        /* Displaying image upload error. */
                        modal = app.openModal({
                            replaceCurrent: true,
                            content: $('#image-upload-error'),
                            buttons: [
                                {
                                    text: app.terminology.ok,
                                    click: () => { modal.close(); },
                                }
                            ]
                        });
                    }
                };
                
                if (!dropZone.length) {
                    parent = parentQuery();
                    
                    terminology = Ifly.App.getInstance().components['MediaSelectorModal'].terminology;

                    /* Creating a drop zone element. */
                    dropZone = $('<div class="media-drop-zone" />')
                        .append($('<span class="ph">').text(terminology.dropFilesHere))
                        .hide()
                        .attr('id', id)
                        .appendTo(parent);

                    parent.on('dragenter', e => {
                        dragCollection = dragCollection.add(e.target);
                    });

                    /* When file is being dragged over, showing the drop zone. */
                    parent.on('dragover', e => {
                        e.stopPropagation();
                        e.preventDefault();

                        if (isSlideSelected()) {
                            changeDropZoneIsVisible(true);
                        }
                    });

                    /* When file is not dragged over, hiding the drop zone. */
                    parent.on('dragleave drop', e => {
                        dragCollection = dragCollection.not(e.target);

                        if (dragCollection.length === 0) {
                            changeDropZoneIsVisible(false);
                        }
                    });

                    /* When file is dropped, processing it. */
                    parent.on('drop', e => {
                        e.stopPropagation();
                        e.preventDefault();
                        
                        if (isSlideSelected()) {
                            changeDropZoneIsVisible(false);
                            onFilesDropped(e.originalEvent.dataTransfer.files);
                        }
                    });
                }

                return dropZone;
            };

            /**
             * Performs internal initialization.
             */
            var initializeInternal = () => {
                if (editor.user.subscription != null && editor.user.subscription.isPaid()) {
                    initializeDropZone('slide-file-drop-zone', () => editor.composition.host.find('.canvas'));
                }
            };

            /* Waiting for the composition to load. */
            var interval = setInterval(() => {
                if (editor.composition.host !== null &&
                    editor.composition.host.length > 0) {

                    clearInterval(interval);

                    initializeInternal();
                }
            }, 500);
        }

        /** Returns the current instance of the manager. */
        public static getInstance(): FileDragAndDropManager {
            if (!this._instance) {
                this._instance = new FileDragAndDropManager();
            }

            return this._instance;
        }
    }

    /** Represents gallery media item. */
    export class GalleryMediaItem implements IModel {
        /** Gets or sets the media item. */
        public media: MediaItem;

        /** Gets or sets value indicating whether this item is active. */
        public isActive: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether image loading failed. */
        public loadingFailed: KnockoutObservable<boolean>;

        /** Gets or sets the load watcher. */
        public loadWatcher: IGalleryMediaItemLoadWatcher;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.media = new MediaItem();
            this.isActive = ko.observable<boolean>(true);
            this.loadingFailed = ko.observable<boolean>(false);

            this.loadWatcher = {
                onLoad: (node: HTMLImageElement, media: GalleryMediaItem) => {
                    setTimeout(() => {
                        var $label = $(node).parents('label');

                        if (!$label.hasClass('has-no-media')) {
                            $label.addClass('has-media');
                            media.loadingFailed(false);
                        }
                    }, 25);
                },

                onError: (node: HTMLImageElement, media: GalleryMediaItem) => {
                    setTimeout(() => {
                        var $label = $(node).parents('label');

                        if (!$label.hasClass('has-media')) {
                            $label.addClass('has-no-media');
                            media.loadingFailed(true);
                        }
                    }, 25);
                }
            };

            this.load(data);
        }

        /** 
        * Populates object state from the given data.
        * @param {object} data Data to load from.
        */
        public load(data: any) {
            data = data || {};

            this.media.load(data.media);

            if (typeof (data.isActive) !== 'undefined' || typeof (data.IsActive) !== 'undefined') {
                this.isActive(!!data.isActive || !!data.IsActive);
            } else {
                this.isActive(true);
            }
        }

        /** Serializes object state. */
        public serialize() {
            return {
                media: this.media.serialize()
            };
        }
    }

    /** Represents media source. */
    export class MediaSource {
        /** Gets or sets value indicating whether medias are being loaded. */
        public isLoading: KnockoutObservable<boolean>;

        /** Gets or sets all available media items. */
        public items: KnockoutObservableArray<GalleryMediaItem>;

        /** Gets or sets value indicating whether to always perform server reload of items. */
        public forceLiveReload: KnockoutObservable<boolean>;

        /** Gets or sets the load timer. */
        private _loadTimer: number;

        /** Initializes a new instance of an object. */
        constructor() {
            this.isLoading = ko.observable<boolean>();
            this.items = ko.observableArray<GalleryMediaItem>();
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
         * Reloads all items.
         * @param {string} filter Filter.
         */
        public reloadItems(filter?: string) {
            var clearTimer = () => {
                clearTimeout(this._loadTimer);
                this._loadTimer = null;
            };

            if (!this.items().length || this.forceLiveReload()) {
                this.items.removeAll();

                clearTimer();

                this.isLoading(false);

                this._loadTimer = setTimeout(() => {
                    this.isLoading(true);
                }, 25);

                this.getItems(filter, items => {
                    clearTimer();

                    ko.utils.arrayForEach(items, item => {
                        this.items.push(item);
                    });

                    this.isLoading(false);
                });
            } else {
                ko.utils.arrayForEach(this.items(), item => {
                    item.isActive(this.matchesFilter(item.media.name(), filter));
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
         * Returns all media items that match the given filter.
         * @param {string} filter Filter.
         * @param {Function} complete A callback which is executed when operation completes.
         */
        public getItems(filter: string, complete: (items: GalleryMediaItem[]) => any) {
            (complete || function () { })([]);
        }
    }

    /** Represents media source type. */
    export enum MediaSourceType {
        /** Sprites cloud. */
        sprites = 0,

        /** Flickr. */
        flickr = 1
    }

    /** Represents Flickr media source. */
    export class FlickrMediaSource extends MediaSource {
        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this.forceLiveReload(true);
        }

        /**
         * Returns all media items that match the given filter.
         * @param {string} filter Filter.
         * @param {Function} complete A callback which is executed when operation completes.
         */
        public getItems(filter: string, complete: (items: GalleryMediaItem[]) => any) {
            var scriptId = 'flickr-api-request', script = null;

            window['jsonFlickrApi'] = function (data) {
                complete(ko.utils.arrayMap(data && data.photos ? (data.photos.photo || []) : [], (item: any) => {
                    return new GalleryMediaItem({
                        media: {
                            name: item.title,
                            url: 'https://farm' + item.farm + '.staticflickr.com/' + item.server +
                            '/' + item.id + '_' + item.secret + '.jpg',
                            created: new Date()
                        }
                    });
                }));
            };

            script = document.getElementById(scriptId);

            if (script) {
                script.parentNode.removeChild(script);
            }

            script = document.createElement('script');
            script.id = scriptId;

            script.src = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=20d56b09888512aca49d7cbc7d399e4f&text=' +
            encodeURIComponent(filter || 'nature') + '&safe_search=1&privacy_filter=1&per_page=100&license=1,2,3&format=json&_t=' + new Date().getTime();

            document.body.appendChild(script);
        }
    }

    /** Represents Sprites media source. */
    export class SpritesMediaSource extends MediaSource {
        /**
         * Returns all media items that match the given filter.
         * @param {string} filter Filter.
         * @param {Function} complete A callback which is executed when operation completes.
         */
        public getItems(filter: string, complete: (items: GalleryMediaItem[]) => any) {
            this.ensureItems(items => {
                ko.utils.arrayForEach(items, item => {
                    item.isActive(this.matchesFilter(item.media.name(), filter));
                });

                (complete || function () { })(items);
            });
        }

        /**
         * Ensures that media items are loaded.
         * @param {Function} complete A callback.
         */
        private ensureItems(complete: (items: GalleryMediaItem[]) => any) {
            Ifly.App.getInstance().api.get('media/all', null, (success, data) => {
                complete(ko.utils.arrayMap(data || [], item => {
                    return new GalleryMediaItem({ media: item });
                }));
            });
        }
    }

    /** Represents Google Drive file picker. */
    export class GoogleDriveFilePicker implements IFilePicker {
        /** Gets or sets the host. */
        public host: MediaSelection;

        /**
         * Initializes a new instance of an object.
         * @param {MediaSelection} host Host.
         */
        constructor(host: MediaSelection) {
            this.host = host;
        }

        /** 
         * Opens file picker.
         * @param {Function} complete A callback which is called when the file has been selected.
         */
        openPicker(complete: (url: string) => any) {
            var api = Ifly.App.getInstance().api.google;

            api.modules.drive.load(() => {
                api.modules.drive.ensureAuthorized(result => {
                    var view = null,
                        picker = null,
                        gapi = window['gapi'],
                        google = window['google'];

                    if (result.accessToken && result.authorized) {
                        view = new google.picker.View(google.picker.ViewId.DOCS);
                        view.setMimeTypes('image/png,image/jpeg,image/jpg,image/bmp,image/svg+xml,image/gif');

                        picker = new google.picker.PickerBuilder()
                            .enableFeature(google.picker.Feature.NAV_HIDDEN)
                            .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
                            .addView(view)
                            .addView(new google.picker.DocsUploadView())
                            .setOAuthToken(result.accessToken)
                            .setDeveloperKey(api.apiKey)
                            .setCallback(status => {
                                if (status.action == 'cancel') {
                                    this.host.dispatchEvent('externalMediaUIStateChanged', {
                                        isVisible: false
                                    });
                                } else if (status.action == 'picked') {
                                    gapi.client.drive.files.get({
                                        fileId: status.docs[0].id
                                    }).execute(response => {
                                        complete(response.webContentLink.replace(/&export=([^&]+)/gi, ''));
                                    });
                                }
                            })
                            .build();

                        picker.setVisible(true);

                        this.host.dispatchEvent('externalMediaUIStateChanged', {
                            isVisible: true
                        });
                    }
                });
            });
        }
    }

    /** Represents Dropbox file picker. */
    export class DropboxFilePicker implements IFilePicker {
        /** Gets or sets the host. */
        public host: MediaSelection;

        /**
         * Initializes a new instance of an object.
         * @param {MediaSelection} host Host.
         */
        constructor(host: MediaSelection) {
            this.host = host;
        }

        /** 
         * Opens file picker.
         * @param {Function} complete A callback which is called when the file has been selected.
         */
        public openPicker(complete: (url: string) => any) {
            this.ensureDropboxApi(() => {
                var db = window['Dropbox'],
                    wrapUIAction = (action?: Function) => {
                        if (action) {
                            action();
                        }

                        this.host.dispatchEvent('externalMediaUIStateChanged', {
                            isVisible: false
                        });
                    };

                if (db) {
                    db.choose({
                        success: files => {
                            wrapUIAction(() => {
                                var viewPart = 'view/',
                                    url = files[0].link,
                                    viewIndex = url.toLowerCase().indexOf(viewPart);

                                url = 'https://dl.dropboxusercontent.com/s/' + url.substr(viewIndex + viewPart.length);

                                if (url.indexOf('?') > 0) {
                                    url = url.substr(0, url.indexOf('?'));
                                }

                                url += '?raw=1';

                                complete(url);
                            });
                        },

                        cancel: () => {
                            wrapUIAction();
                        },

                        linkType: 'direct',
                        multiselect: false,
                        extensions: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
                    });

                    this.host.dispatchEvent('externalMediaUIStateChanged', {
                        isVisible: true
                    });
                }
            });
        }

        /**
         * Ensures that the Dropbox API is loaded.
         * @param {Function} complete A callback.
         */
        private ensureDropboxApi(complete: Function) {
            var scriptId = 'dropboxjs',
                script = <HTMLScriptElement>document.getElementById(scriptId);

            if (script) {
                complete();
            } else {
                script = document.createElement('script');
                script.id = scriptId;
                script.setAttribute('data-app-key', 'ozw1iddkemzff3e');
                script.src = 'https://www.dropbox.com/static/api/2/dropins.js';

                document.body.appendChild(script);

                script.onload = () => {
                    complete();
                };
            }
        }
    }

    /** Represents media selection. */
    export class MediaSelection extends Ifly.EventSource implements IModel {
        /** Gets or sets the target element. */
        public element: KnockoutObservable<Ifly.Models.Element>;

        /** Gets or sets the selected media. */
        public media: KnockoutObservable<string>;

        /** Gets or sets current media source. */
        public mediaSourceType: KnockoutObservable<MediaSourceType>;

        /** Gets or sets the current media source. */
        public mediaSource: KnockoutObservable<MediaSource>;

        /** Gets or sets the search term. */
        public searchTerm: KnockoutObservable<string>;

        /** Gets or sets value indicating whether user is currently uploading an image. */
        public isUploading: KnockoutObservable<boolean>;

        /** Gets or sets all media sources. */
        private _allMediaSources: any;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            super();

            var reloadTimer = null, reloadItems = null, lockSearchTerm = false;

            this.element = ko.observable<Ifly.Models.Element>();
            this.isUploading = ko.observable<boolean>();
            this.media = ko.observable<string>();
            this.mediaSource = ko.observable<MediaSource>();
            this.mediaSourceType = ko.observable<MediaSourceType>(MediaSourceType.sprites);
            this.searchTerm = ko.observable<string>('');

            (<any>this.mediaSourceType).description = ko.computed<string>(() => {
                var terminology = Ifly.App.getInstance().components['MediaSelectorModal'].terminology,
                    sourceType = this.mediaSourceType();

                return terminology.sourceTypes[sourceType || 0];
            });

            this._allMediaSources = {
                0: new SpritesMediaSource(),
                1: new FlickrMediaSource()
            };

            reloadItems = (noWait?: boolean) => {
                if (reloadTimer) {
                    clearTimeout(reloadTimer);
                    reloadTimer = null;
                }

                reloadTimer = setTimeout(() => {
                    this.mediaSource().reloadItems(this.searchTerm());
                }, noWait ? 50 : 500);
            };

            this.mediaSource(this._allMediaSources[0]);

            this.mediaSourceType.subscribe(v => {
                this.mediaSource(this._allMediaSources[v]);

                if (v == MediaSourceType.flickr) {
                    lockSearchTerm = true;
                    this.searchTerm('nature');
                } else if (this.searchTerm() && this.searchTerm().length) {
                    lockSearchTerm = true;
                    this.searchTerm('');
                }

                reloadItems(true);
            });

            this.searchTerm.subscribe(v => {
                if (!lockSearchTerm) {
                    reloadItems();
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
            var elm = null;

            data = data || {};

            if (data.element || data.Element) {
                elm = data.element || data.Element;

                if (typeof (elm.serialize) === 'function') {
                    this.element(<Ifly.Models.Element>elm);
                } else {
                    this.element(new Ifly.Models.Element(elm));
                }
            } else {
                this.element(null);
            }

            this.isUploading(false);
            this.media(data.media);
            this.searchTerm('');
            this.mediaSourceType(data.mediaSourceType || MediaSourceType.sprites);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                media: this.media(),
                element: this.element() ? this.element().serialize() : null
            };
        }

        /**
         * Occurs when the user is changing media source type.
         * @param {MediaSourceType} type Media source type.
         * @param {object} e Event object.
         */
        public onSourceTypeChanging(type: MediaSourceType, e: any) {
            this.mediaSourceType(type);

            $(e.target).parents('.dropdown').blur();
        }

        /**
         * Occurs when the user has requested a file to be selected from external source.
         * @param {ExternalMediaSource} type External media source.
         * @param {object} e Event object.
         */
        public onExternalFileRequest(type: ExternalMediaSource, e: any) {
            var picker = null;

            $(e.target).parents('.dropdown').blur();

            if (type == ExternalMediaSource.drive) {
                picker = new GoogleDriveFilePicker(this);
            } else if (type == ExternalMediaSource.dropbox) {
                picker = new DropboxFilePicker(this);
            }

            if (picker) {
                picker.openPicker(url => {
                    if (url && url.length) {
                        this.media(url);

                        this.dispatchEvent('externalMediaSelected', {
                            media: this.media()
                        });
                    }
                });
            }
        }

        /** 
         * Uploads the given image when the file is selected.
         * @param {object} e Event object.
         */
        public onFileSelected(e: any) {
            var presentationId = Ifly.Editor.getInstance().presentation ?
                    Ifly.Editor.getInstance().presentation.id() : 0,
                app = Ifly.App.getInstance(),
                slideId = this.element() ? this.element().slideId() : 0,
                elementId = this.element() ? this.element().id() : 0,
                modal = null;

            this.isUploading(true);

            app.api.upload('images/upload?id=' + presentationId +
                '&slideId=' + slideId + '&elementId=' + elementId, e.target, (mediaItem) => {
                    var url = '';

                    try {
                        mediaItem = typeof (mediaItem) === 'string' ?
                            JSON.parse(mediaItem) : mediaItem;
                    } catch (ex) { }

                    url = mediaItem ? (mediaItem.url || mediaItem.Url) : '';

                    Utils.UploadButtonHandler.resetInput($(e.target).parent());

                    this.isUploading(false);

                    if (url != null && url.length > 0) {
                        if (url.indexOf('<') == 0) {
                            url = />([^<]+)</gi.exec(url)[1];
                        }

                        this.media.valueWillMutate();
                        this.media(url);
                        this.media.valueHasMutated();

                        this.mediaSource().items.valueWillMutate();

                        this.mediaSource().items().splice(0, 0, new GalleryMediaItem({
                            media: mediaItem
                        }));

                        this.mediaSource().items.valueHasMutated();
                    } else {
                        modal = app.openModal({
                            replaceCurrent: true,
                            content: $('#image-upload-error'),
                            buttons: [
                                {
                                    text: app.terminology.ok,
                                    click: () => { modal.close(); },
                                }
                            ]
                        });
                    }
                });
        }
    }

    /** Represents an media selection modal. */
    export class MediaSelectorModal extends ModalForm<MediaSelection> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: MediaSelectorModal;

        /** Gets or sets an optional callback that is called when selection is made. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#media-selector', () => { return new MediaSelection(); });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['MediaSelectorModal'],
                shadowStripe = this.container.find('.scroll-shadow');

            this.container.find('.selector-wrapper').unbind('scroll').bind('scroll', e => {
                shadowStripe.toggle(e.target.scrollTop > 6);
            });

            super.load(data);

            this.data.removeEventListener('externalMediaSelected');
            this.data.removeEventListener('externalMediaUIStateChanged');

            this.data.addEventListener('externalMediaSelected', (sender, e) => {
                this.modal.fadeIn();
                this.save();
            });

            this.data.addEventListener('externalMediaUIStateChanged', (sender, e) => {
                if (e.isVisible) {
                    this.modal.fadeOut();
                } else {
                    this.modal.fadeIn();
                }
            });

            this.data.mediaSource().items.removeAll();

            setTimeout(() => {
                this.data.mediaSource().reloadItems();
            }, 300);

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    closeOnEscape: false,
                    cssClass: 'media-selector-window',
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

            Ifly.App.getInstance().trackEvent('discover', 'media picker');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize();

            Ifly.App.getInstance().trackEvent('act', 'media picker');

            if (this._saved) {
                this._saved(serialized);
                this._saved = null;
            }

            this.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): MediaSelectorModal {
            if (!this._instance) {
                this._instance = new MediaSelectorModal();
            }

            return this._instance;
        }
    }
}