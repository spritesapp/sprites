/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="IModel.ts" />
/// <reference path="ElementProperty.ts" />
/// <reference path="../Utils/Converters.ts" />

module Ifly.Models {
    /** Represents an element that is ediable on the scene. */
    export class EditableElement extends EventSource {
        public element: Element;

        /** Gets or sets element position. */
        public position: KnockoutObservable<ElementPosition>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Editable element data.
         */
        constructor(data?: Element) {
            super();

            this.newEditable('position', (v) => { this.element.position(v); }, true);

            this.load(data);
        }

        /** 
         * Initializes a new editable property.
         * @param {string} propertyName Property name.
         * @param {Function} onUpdated A callback that is executed whenever property value changes.
         * @param {boolean} checkable Value indicating whether "checkable" extension must be created for this property.
         */
        public newEditable(propertyName: string, onUpdated?: Function, checkable?: boolean) {
            this[propertyName] = ko.observable();
            this[propertyName].subscribe((v) => {
                if (onUpdated) {
                    onUpdated.apply(this, [ v ]);
                }
                
                this.onPropertyChanged(propertyName, v.toString());
            });

            if (checkable) {
                this[propertyName].checkable = ko.computed({
                    read: () => {
                        return (this[propertyName]() || 0).toString();
                    },
                    write: (v) => {
                        this[propertyName](parseInt((v || '').toString(), 10));
                    }
                });
            }
        }

        /**
         * Loads editable element data from the given element.
         * @param {Element} element Element to load from.
         */
        public load(element: Element, onlyProperties?: boolean) {
            if (!onlyProperties) {
                this.element = element;
            }

            this.loadProperties(this.element ? this.element.properties() : []);
        }

        /** Serializes editable element into a normal element. */
        public serialize(): Element {
            var properties = this.serializeProperties();
            var ret = new Element(this.element ? this.element.serialize() : {});
            
            ret.properties.removeAll();

            for (var i = 0; i < properties.length; i++) {
                ret.properties.push(properties[i]);
            }

            return ret;
        }

        /**
         * Occurs when element property value changes.
         * @param {string} name Property name.
         * @param {string} value Property value.
         */
        public onPropertyChanged(name: string, value: string) {
            this.dispatchEvent('propertyChanged', { name: name, value: value });
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() { }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) { }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] { return []; }
    }

    /* ********************************************************************************************************** */

    /** Represents widget snippet type. */
    export enum WidgetSnippetType {
        /** None. */
        none = 0,

        /** YouTube. */
        youtube = 1,

        /** Twitter. */
        twitter = 2,

        /** Typeform. */
        typeform = 3,

        /** Twitter tweet. */
        twitterTweet = 4,

        /** Facebook post. */
        facebook = 5
    }

    /** Represents widget snippet. */
    export class WidgetSnippet extends EditableElement {
        /** Gets or sets the property change timer. */
        private _changeTimer: number;

        /**
         * Initializes a new instance of an object.
         * @param {WidgetElement} parent Parent element.
         * @param {Element} data Element.
         */
        constructor(parent: WidgetElement, data?: Element) {
            super(data);

            (<any>this)._getParent = () => parent;
        }

        /**
         * Initializes a new editable property.
         * @param {string} propertyName Property name.
         */
        public newEditable(propertyName: string) {
            super.newEditable(propertyName);

            this[propertyName].changedOn = ko.observable<number>();
            this[propertyName].changedOn.subscribe(v => {
                if (this._changeTimer) {
                    clearTimeout(this._changeTimer);
                }

                this._changeTimer = setTimeout(() => {
                    (<any>this)._getParent().onSnippetParemetersChanged(propertyName, this[propertyName]());
                }, 500);
            });
        }

        public onValueChanging(propertyName: string) {
            this[propertyName].changedOn(new Date().getTime());

            return true;
        }

        public onValuePasting(propertyName: string, e: Event) {
            setTimeout(() => {
                this[propertyName]((<any>e.target).value);
                this[propertyName].changedOn(new Date().getTime());
            }, 10);

            return true;
        }
    }

    /** Represents Typeform widget snippet. */
    export class TypeformWidgetSnippet extends WidgetSnippet {
        /** Gets or sets Typeform survey URL. */
        public url: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {WidgetElement} parent Parent element.
         * @param {Element} data Element.
         */
        constructor(parent: WidgetElement, data?: Element) {
            this.newEditable('url');

            super(parent, data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.url('');

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'typeform_url') {
                    this.url(properties[i].value());
                } 
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'typeform_url', value: this.url() })
            ];
        }
    }

    /** Represents YouTube widget snippet. */
    export class YouTubeWidgetSnippet extends WidgetSnippet {
        /** Gets or sets YouTube video URL. */
        public url: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {WidgetElement} parent Parent element.
         * @param {Element} data Element.
         */
        constructor(parent: WidgetElement, data?: Element) {
            this.newEditable('url');

            super(parent, data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.url('');

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'youtube_url') {
                    this.url(properties[i].value());
                } 
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'youtube_url', value: this.url() })
            ];
        }
    }

    /** Represents Twitter widget snippet. */
    export class TwitterWidgetSnippet extends WidgetSnippet {
        /** Gets or sets widget Id. */
        public widgetId: KnockoutObservable<string>;

        /** Gets or sets Twitter handle. */
        public handle: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {WidgetElement} parent Parent element.
         * @param {Element} data Element.
         */
        constructor(parent: WidgetElement, data?: Element) {
            this.newEditable('widgetId');
            this.newEditable('handle');

            super(parent, data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.widgetId('');
            this.handle('');

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'twitter_widgetId') {
                    this.widgetId(properties[i].value());
                } else if (properties[i].name() == 'twitter_handle') {
                    this.handle(properties[i].value());
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'twitter_widgetId', value: this.widgetId() }),
                new ElementProperty({ name: 'twitter_handle', value: this.handle() })
            ];
        }
    }

    /** Represents Twitter tweet widget snippet. */
    export class TwitterTweetWidgetSnippet extends WidgetSnippet {
        /** Gets or sets tweet Id. */
        public tweetId: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {WidgetElement} parent Parent element.
         * @param {Element} data Element.
         */
        constructor(parent: WidgetElement, data?: Element) {
            this.newEditable('tweetId');

            super(parent, data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.tweetId('');

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'twitterTweet_tweetId') {
                    this.tweetId(properties[i].value());
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'twitterTweet_tweetId', value: this.tweetId() })
            ];
        }
    }

    /** Represents Facebook widget snippet. */
    export class FacebookWidgetSnippet extends WidgetSnippet {
        /** Gets or sets post URL. */
        public postUrl: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {WidgetElement} parent Parent element.
         * @param {Element} data Element.
         */
        constructor(parent: WidgetElement, data?: Element) {
            this.newEditable('postUrl');

            super(parent, data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.postUrl('');

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'facebook_postUrl') {
                    this.postUrl(properties[i].value());
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'facebook_postUrl', value: this.postUrl() })
            ];
        }
    }

    /** Represents a widget element. */
    export class WidgetElement extends EditableElement {
        /** Gets or sets the snippet type. */
        public snippetType: KnockoutObservable<WidgetSnippetType>;

        /** Gets or sets YouTube snippet. */
        public snippetYouTube: YouTubeWidgetSnippet;

        /** Gets or sets Twitter snippet. */
        public snippetTwitter: TwitterWidgetSnippet;

        /** Gets or sets Typeform snippet. */
        public snippetTypeform: TypeformWidgetSnippet;

        /** Gets or sets Twitter tweet snippet. */
        public snippetTwitterTweet: TwitterTweetWidgetSnippet;

        /** Gets or sets Facebook snippet. */
        public snippetFacebook: FacebookWidgetSnippet;

        /** Gets or sets the widget code. */
        public code: KnockoutObservable<string>;

        /** Gets or sets the widget code status. */
        public codeStatus: KnockoutComputed<string>;

        /** Gets or sets value indicating whether widget code is signed. */
        public codeSigned: KnockoutObservable<boolean>;

        /** Gets or sets snippet type change timer. */
        private _snippetTypeChangeTimer: number;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.snippetYouTube = new YouTubeWidgetSnippet(this, data);
            this.snippetTwitter = new TwitterWidgetSnippet(this, data);
            this.snippetTypeform = new TypeformWidgetSnippet(this, data);
            this.snippetTwitterTweet = new TwitterTweetWidgetSnippet(this, data);
            this.snippetFacebook = new FacebookWidgetSnippet(this, data);

            this.newEditable('code');
            this.newEditable('snippetType', null, true);
            this.newEditable('codeSigned');

            this.codeStatus = ko.computed(() => {
                var t = this.code(), c = Ifly.App.getInstance().components['SlideManager'];

                return t && t.length ? c.terminology.slideDefaults.editContents + ' (' + Utils.Input.explainFileSize(t.length) + ')' : '[' + c.terminology.slideDefaults.empty.toLowerCase() + ']';
            });

            this.snippetType.subscribe(v => {
                this.onSnippetTypeChanged(v);
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            var codeWasSigned = null;

            this.code('');
            this.codeSigned(true);
            this.snippetType(WidgetSnippetType.none);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'code') {
                    this.code(properties[i].value());
                    this.codeSigned(!this.code() || this.code().length === 0);
                } else if (properties[i].name() == 'snippetType') {
                    this.snippetType(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'codeSigned') {
                    codeWasSigned = (properties[i].value() || '').toLowerCase() == 'true';
                }
            }

            this.snippetYouTube.loadProperties(properties);
            this.snippetTwitter.loadProperties(properties);
            this.snippetTypeform.loadProperties(properties);
            this.snippetTwitterTweet.loadProperties(properties);
            this.snippetFacebook.loadProperties(properties);

            if (codeWasSigned !== null) {
                this.codeSigned(!!codeWasSigned);
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[]{
            return [
                new ElementProperty({ name: 'code', value: this.code() }),
                new ElementProperty({ name: 'snippetType', value: this.snippetType() }),
                new ElementProperty({ name: 'codeSigned', value: (!!this.codeSigned()).toString().toLowerCase() }),
            ].concat(this.snippetYouTube.serializeProperties())
                .concat(this.snippetTwitter.serializeProperties())
                .concat(this.snippetTypeform.serializeProperties())
                .concat(this.snippetTwitterTweet.serializeProperties())
                .concat(this.snippetFacebook.serializeProperties());
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['SlideManager'];
            
            this.snippetType(WidgetSnippetType.none);
            this.code(Utils.Input.javascriptDecode(c.terminology.slideDefaults.widget.sample));
            this.codeSigned(true);
        }

        /** Opens widget code edit dialog. */
        public editCode() {
            Ifly.Models.UI.CodeEditorModal.getInstance().open({
                text: this.code()
            }, {
                save: (i) => {
                    this.codeSigned(false);
                    this.snippetType(WidgetSnippetType.none);
                    this.code(i.text);
                }
            });
        }

        /** 
         * Occurs when snippet parameters changed.
         * @param {string} propertyName Property name.
         * @param {object} propertyValue Property value.
         */
        public onSnippetParemetersChanged(propertyName?: string, propertyValue?: any) {
            var c = Ifly.App.getInstance().components['SlideManager']
                .terminology.slideDefaults.widget, wt = this.snippetType(), code = '',
                sanitizeUrl = (u) => {
                    var proto = '://', ix = u.indexOf(proto);

                    if (ix >= 0) {
                        u = u.substr(ix + proto.length);
                    }

                    return u;
                }, youtubeUrl = '', typeformUrl = '', facebookUrl = '', twitterTweetId = '',
                    tweetStatusPrefix = '/status/';

            this.onSnippetTypeChanged(wt, (isValid) => {
                if (isValid) {
                    if (wt == WidgetSnippetType.youtube) {
                        code = c.youtube || '';
                        youtubeUrl = sanitizeUrl(this.snippetYouTube.url() || '');

                        if (youtubeUrl.toLowerCase().indexOf('.com/embed/') < 0) {
                            youtubeUrl = youtubeUrl.replace(/\/watch\?v=/gi, '/embed/');
                            youtubeUrl = youtubeUrl.replace(/youtu\.be\//gi, 'youtube.com/embed/');
                        } 

                        code = code.replace(/\{param:url\}/gi, youtubeUrl);
                    } else if (wt == WidgetSnippetType.twitter) {
                        code = c.twitter || '';

                        code = code.replace(/\{param:widgetId\}/gi, (this.snippetTwitter.widgetId() || '').replace('@', ''));
                        code = code.replace(/\{param:handle\}/gi, this.snippetTwitter.handle());
                    } else if (wt == WidgetSnippetType.typeform) {
                        code = c.typeform || '';
                        typeformUrl = sanitizeUrl(this.snippetTypeform.url() || '');

                        code = code.replace(/\{param:url\}/gi, typeformUrl);
                    } else if (wt == WidgetSnippetType.twitterTweet) {
                        code = c.twitterTweet || '';
                        twitterTweetId = Utils.Input.trim((this.snippetTwitterTweet.tweetId() || '').toLowerCase());

                        if (!/^[0-9]+$/g.test(twitterTweetId) && twitterTweetId.indexOf(tweetStatusPrefix) > 0) {
                            twitterTweetId = twitterTweetId.substr(twitterTweetId.indexOf(tweetStatusPrefix) + tweetStatusPrefix.length);
                        }

                        code = code.replace(/\{param:tweetId\}/gi, twitterTweetId);
                    } else if (wt == WidgetSnippetType.facebook) {
                        code = c.facebook || '';
                        facebookUrl = 'https://' + sanitizeUrl(this.snippetFacebook.postUrl() || '');

                        code = code.replace(/\{param:postUrl\}/gi, facebookUrl);
                    }

                    this.code(code);
                    this.codeSigned(true);
                }

                if (propertyName && propertyName.length) {
                    super.onPropertyChanged(WidgetSnippetType[wt] + '_' + propertyName,
                        propertyValue ? propertyValue.toString() : '');
                }
            });
        }

        /**
         * Occurs when snippet type has changed.
         * @param {WidgetSnippetType} type Snippet type.
         */
        private onSnippetTypeChanged(type: WidgetSnippetType, callback?: (isValid: boolean) => any) {
            var parametersValid = false, v = (val): string => val || '';

            if (this._snippetTypeChangeTimer) {
                clearTimeout(this._snippetTypeChangeTimer);
            }

            this._snippetTypeChangeTimer = setTimeout(() => {
                if (type == WidgetSnippetType.youtube) {
                    parametersValid = v(this.snippetYouTube.url()).length > 0;
                } else if (type == WidgetSnippetType.twitter) {
                    parametersValid = v(this.snippetTwitter.widgetId()).length > 0 &&
                        v(this.snippetTwitter.handle()).length > 0;
                } else if (type == WidgetSnippetType.typeform) {
                    parametersValid = v(this.snippetTypeform.url()).length > 0;
                } else if (type == WidgetSnippetType.twitterTweet) {
                    parametersValid = v(this.snippetTwitterTweet.tweetId()).length > 0;
                } else if (type == WidgetSnippetType.facebook) {
                    parametersValid = v(this.snippetFacebook.postUrl()).length > 0;
                }
                
                if (!callback) {
                    if (parametersValid) {
                        this.onSnippetParemetersChanged();
                    }
                } else {
                    callback(parametersValid);
                }
            }, 250);
        }

        /** 
         * Occurs when snippet type is changing.
         * @param {ChartType} type Chart type.
         * @param {Event} e Event object.
         */
        private onSnippetTypeChanging(type: WidgetSnippetType, e: Event) {
            this.snippetType(type);
            $(e.target).parents('.dropdown').blur();
        }
    }

    /* ********************************************************************************************************** */

    /** Represents timeline item. */
    export class TimelineItem implements IModel {
        /** Gets or sets the timeline item label. */
        public label: KnockoutObservable<string>;

        /** Gets or sets the timeline item description. */
        public description: KnockoutObservable<string>;

        /** Gets or sets the timeline item relative size (percentage). */
        public size: KnockoutObservable<number>;

        /** Gets or sets the timeline item style. */
        public style: KnockoutObservable<TimelineItemStyle>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: any) {
            this.label = ko.observable<string>();
            this.description = ko.observable<string>();
            this.size = ko.observable<number>();
            this.style = ko.observable<TimelineItemStyle>();

            (<any>this.style).checkable = ko.computed({
                read: () => {
                    return (this.style() || 0).toString();
                },
                write: (v) => {
                    this.style(parseInt((v || '').toString(), 10));
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

            this.label(data.label || data.Label);
            this.description(data.description || data.Description);
            this.size(data.size || data.Size || 100);
            this.style(data.style || data.Style || 0);
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                label: this.label(),
                description: this.description(),
                size: this.size(),
                style: this.style()
            };
        }
    }

    /** Represents timeline element. */
    export class TimelineElement extends EditableElement {
        /** Gets or sets the timeline items. */
        public items: KnockoutObservableArray<TimelineItem>;

        /** Gets or sets the size of the timeline. */
        public size: KnockoutObservable<number>;

        /** Gets or sets the timeline orientation. */
        public orientation: KnockoutObservable<TimelineOrientation>;

        /** Gets or sets the bar color. */
        public barColor: KnockoutObservable<ColorType>;

        /** Gets or sets the items text. */
        public itemsText: KnockoutComputed<string>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.items = ko.observableArray<TimelineItem>();

            this.newEditable('size', null, true);
            this.newEditable('orientation', null, true);
            this.newEditable('barColor', null, true);

            this.itemsText = ko.computed(() => {
                var n = this.items().length, c = Ifly.App.getInstance().components['SlideManager'];
                return n > 0 ? c.terminology.slideDefaults.editSelection + ' (' + n + ')' : '[' + c.terminology.slideDefaults.notSelected.toLowerCase() + ']';
            });

            this.size.subscribe(v => {
                this.size(Utils.Input.sizeScaleToPercentage(v, TimelineSizeScale));
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.items.removeAll();
            this.size(TimelineSizeScale.fiftyPercent);
            this.orientation(TimelineOrientation.horizontal);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'items') {
                    ((items: Array<TimelineItem>) => {
                        items.forEach((i: TimelineItem) => {
                            this.items.push(i);
                        });
                    })(new Ifly.Utils.TimelineItemArrayConverter().convertFromString(properties[i].value()));
                } else if (properties[i].name() == 'orientation') {
                    this.orientation(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'barColor') {
                    this.barColor(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'size') {
                    this.size(parseInt(properties[i].value(), 10));
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'items', value: new Ifly.Utils.TimelineItemArrayConverter().convertToString(this.items()) }),
                new ElementProperty({ name: 'orientation', value: this.orientation() }),
                new ElementProperty({ name: 'barColor', value: this.barColor() }),
                new ElementProperty({ name: 'size', value: this.size() })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['SlideManager'];

            this.orientation(TimelineOrientation.horizontal);
            this.size(TimelineSizeScale.fiftyPercent);
            this.barColor(ColorType.accent1);

            this.items.removeAll();

            this.items.push(new TimelineItem({ label: '1998', description: c.terminology.slideDefaults.timeline.event1, size: 50 }));
            this.items.push(new TimelineItem({ label: '2007', description: c.terminology.slideDefaults.timeline.event2, size: 25 }));
            this.items.push(new TimelineItem({ label: '2010', description: c.terminology.slideDefaults.timeline.event3, size: 10, style: TimelineItemStyle.dimmed }));
            this.items.push(new TimelineItem({ label: '2011', description: c.terminology.slideDefaults.timeline.event4, size: 15 }));

            this.onPropertyChanged('items', new Utils.TimelineItemArrayConverter().convertToString(this.items()));
        }

        /** Opens item edit dialog. */
        public editItems() {
            var serialized = ko.utils.arrayMap(this.items(), i => {
                return i.serialize();
            });

            Ifly.Models.UI.TimelineItemsModal.getInstance().open({
                items: serialized
            }, {
                save: (i) => {
                    this.items.removeAll();

                    i.items.forEach(itm => {
                        this.items.push(new TimelineItem(itm));
                    });

                    this.onPropertyChanged('items',
                        new Utils.TimelineItemArrayConverter().convertToString(this.items()));
                }
            });
        }

        /** Clears annotations. */
        public clearItems() {
            this.items.removeAll();
            this.onPropertyChanged('items', new Utils.TimelineItemArrayConverter().convertToString(this.items()));
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a callout element. */
    export class CalloutElement extends EditableElement {
        /** Gets or sets the callout text. */
        public text: KnockoutObservable<string>;

        /** Gets or sets value indicating whether rich text is allowed. */
        public isRichText: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether rich text is allowed. */
        public isRichTextAllowed: KnockoutObservable<boolean>;

        /** Gets or sets the callout orientation relative to the tail. */
        public orientation: KnockoutObservable<CalloutOrientation>;

        /** Gets or sets the callout tail size. */
        public tailSize: KnockoutObservable<CalloutTailSize>;

        /** Gets or sets the rich text editor. */
        public richText: UI.RichTextEditor;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.newEditable('text');
            this.newEditable('orientation', null, true);
            this.newEditable('tailSize', null, true);

            /* Rich text is allowed on pro subscriptions. */
            this.isRichText = ko.observable<boolean>(
                Ifly.Editor.getInstance().user.subscription.type() !=
                SubscriptionType.basic);

            this.isRichTextAllowed = ko.observable<boolean>(this.isRichText());

            this.richText = new UI.RichTextEditor();

            this.richText.addEventListener('change', (sender, args) => {
                this.text(args.html);
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.text('');
            this.orientation(0);
            this.tailSize(0);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'text') {
                    this.text(properties[i].value());
                } else if (properties[i].name() == 'orientation') {
                    this.orientation(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'tailSize') {
                    this.tailSize(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'isRichText') {
                    this.isRichText(this.isRichTextAllowed() || properties[i].value() == 'true');
                }
            }

            this.richText.html(this.text());
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'text', value: this.text() }),
                new ElementProperty({ name: 'isRichText', value: this.isRichText() }),
                new ElementProperty({ name: 'orientation', value: this.orientation() || 0 }),
                new ElementProperty({ name: 'tailSize', value: this.tailSize() || 0 })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['SlideManager'];

            this.text(c.terminology.slideDefaults.text);
            this.richText.html(c.terminology.slideDefaults.text);
            this.orientation(0);
            this.tailSize(0);
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a line element. */
    export class LineElement extends EditableElement {
        /** Gets or sets the line type. */
        public type: KnockoutObservable<LineType>;

        /** Gets or sets the length of the line. */
        public length: KnockoutObservable<number>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.newEditable('type', null, true);
            this.newEditable('length', null, true);

            this.length.subscribe(v => {
                this.length(Utils.Input.sizeScaleToPercentage(v));
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.type(LineType.horizontal);
            this.length(ElementSizeScale.tenPercent);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'type') {
                    this.type(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'length') {
                    this.length(parseInt(properties[i].value(), 10));
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'type', value: this.type() }),
                new ElementProperty({ name: 'length', value: this.length() })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            this.type(LineType.horizontal);
            this.length(ElementSizeScale.tenPercent);
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a progress bar. */
    export class ProgressBar implements IModel {
        /** Gets or sets progress bar description. */
        public description: KnockoutObservable<string>;

        /** Gets or sets progress bar percentage. */
        public percentage: KnockoutObservable<number>;

        /** Gets or sets progress bar color. */
        public color: KnockoutObservable<ColorType>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: any) {
            this.description = ko.observable<string>();
            this.percentage = ko.observable<number>();
            this.color = ko.observable<ColorType>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.description(data.description || data.Description);
            this.percentage(data.percentage || data.Percentage || 0);
            this.color(data.color || data.Color);
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                description: this.description(),
                percentage: this.percentage(),
                color: this.color()
            };
        }
    }

    /** Represents a progress element. */
    export class ProgressElement extends EditableElement {
        /** Gets or sets progress bars. */
        public bars: KnockoutObservableArray<ProgressBar>;

        /** Gets the progress bars text. */
        public barsText: KnockoutComputed<string>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.bars = ko.observableArray<ProgressBar>();

            this.barsText = ko.computed(() => {
                var n = this.bars().length, c = Ifly.App.getInstance().components['SlideManager'];
                return n > 0 ? c.terminology.slideDefaults.editSelection + ' (' + n + ')' : '[' + c.terminology.slideDefaults.notSelected.toLowerCase() + ']';
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.bars.removeAll();

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'bars') {
                    ((bars: Array<ProgressBar>) => {
                        bars.forEach((b: ProgressBar) => {
                            this.bars.push(b);
                        });
                    })(new Ifly.Utils.ProgressBarArrayConverter().convertFromString(properties[i].value()));
                } 
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'bars', value: new Ifly.Utils.ProgressBarArrayConverter().convertToString(this.bars()) })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['SlideManager'];

            this.bars.removeAll();

            this.bars.push(new ProgressBar({ description: c.terminology.slideDefaults.progress.item1, percentage: 67, color: ColorType.accent1 }));
            this.bars.push(new ProgressBar({ description: c.terminology.slideDefaults.progress.item2, percentage: 15, color: ColorType.accent3 }));
            this.bars.push(new ProgressBar({ description: c.terminology.slideDefaults.progress.item3, percentage: 31, color: ColorType.accent2 }));

            this.onPropertyChanged('bars', new Utils.ProgressBarArrayConverter().convertToString(this.bars()));
        }

        /** Opens bars edit dialog. */
        public editBars() {
            var serialized = ko.utils.arrayMap(this.bars(), b => {
                return b.serialize();
            });

            Ifly.Models.UI.ProgressBarsModal.getInstance().open({
                bars: serialized
            }, {
                save: (i) => {
                    this.bars.removeAll();

                    i.bars.forEach(b => {
                        this.bars.push(new ProgressBar(b));
                    });

                    this.onPropertyChanged('bars',
                        new Utils.ProgressBarArrayConverter().convertToString(this.bars()));
                }
            });
        }

        /** Clears bars. */
        public clearBars() {
            this.bars.removeAll();
            this.onPropertyChanged('bars', new Utils.ProgressBarArrayConverter().convertToString(this.bars()));
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a figure element. */
    export class FigureElement extends EditableElement {
        /** Gets or sets the icon. */
        public icon: KnockoutObservable<string>;

        /** Gets or sets the figure set size. */
        public size: KnockoutObservable<FigureSetSize>;

        /** Gets or sets the number of items to highlight. */
        public highlight: KnockoutObservable<number>;

        /** Gets or sets the highlight color. */
        public highlightColor: KnockoutObservable<ColorType>;

        /** Gets or sets the icon text. */
        public iconText: KnockoutComputed<string>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.newEditable('icon');
            this.newEditable('size', null, true);
            this.newEditable('highlight');
            this.newEditable('highlightColor', null, true);

            this.iconText = ko.computed(() => {
                var i = this.icon(), c = Ifly.App.getInstance().components['SlideManager'];
                return i && i.length > 0 ? (i.indexOf('/') > 0 ? i.substr(i.lastIndexOf('/') + 1) : i) : '[' + c.terminology.slideDefaults.notSelected.toLowerCase() + ']';
            });

            (<any>this.size).asNumber = ko.computed<number>(() => {
                var ret = 0, s = this.size();

                if (s == FigureSetSize.five) ret = 5;
                else if (s == FigureSetSize.ten) ret = 10;
                else if (s == FigureSetSize.twenty) ret = 20;
                else if (s == FigureSetSize.thirty) ret = 30;
                else if (s == FigureSetSize.fourty) ret = 40;

                return ret;
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.icon('male');
            this.size(FigureSetSize.ten);
            this.highlight(3);
            this.highlightColor(ColorType.accent1);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'icon') {
                    this.icon(properties[i].value());
                }  else if (properties[i].name() == 'size') {
                    this.size(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'highlight') {
                    this.highlight(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'highlightColor') {
                    this.highlightColor(parseInt(properties[i].value(), 10));
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'icon', value: this.icon() }),
                new ElementProperty({ name: 'size', value: this.size() }),
                new ElementProperty({ name: 'highlight', value: this.highlight() }),
                new ElementProperty({ name: 'highlightColor', value: this.highlightColor() })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            this.icon('male');
            this.size(FigureSetSize.ten);
            this.highlight(3);
            this.highlightColor(ColorType.accent1);
        }

        /** Opens icon selection dialog. */
        public selectIcon() {
            Ifly.Models.UI.IconSelectorModal.getInstance().open({ icon: this.icon() }, {
                save: (i) => {
                    this.icon(i.icon);
                }
            });
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a table element. */
    export class TableElement extends EditableElement {
        /** Gets or sets the data. */
        public data: DataTable;

        /** Gets the data text. */
        public dataText: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.data = new DataTable();
            this.dataText = ko.observable<string>();

            super(data);

            this.updateDataText();
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.data.clear();

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'data') {
                    this.data.load(DataTable.trim(<DataTable>new Ifly.Utils.DataTableConverter().convertFromString(properties[i].value())));
                }
            }

            this.updateDataText();
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'data', value: new Ifly.Utils.DataTableConverter().convertToString(new DataTable(DataTable.trim(this.data))) }),
                new ElementProperty({ name: 'isRichText', value: Ifly.Editor.getInstance().user.subscription.type() != SubscriptionType.basic })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['SlideManager'],
                t = new DataTable(), row = null, column = null;

            this.data.clear();
            
            for (var i = 0; i < 3; i++) {
                t.columns.push(new DataColumn({ name: c.terminology.slideDefaults.table.column + ' ' + (i + 1) }));
            }

            for (var i = 0; i < 2; i++) {
                row = new DataRow({ mark: i == 0 });

                for (var j = 0; j < 3; j++) {
                    row.cells.push(new DataCell({ value: c.terminology.slideDefaults.table.cell + ' ' + (j + 1) }));
                }

                t.rows.push(row);
            }

            this.data.load(t.serialize());
            this.updateDataText();

            this.onPropertyChanged('data', new Ifly.Utils.DataTableConverter().convertToString(t));
        }

        /** Opens table edit dialog. */
        public editData() {
            var serialized = this.data.serialize();

            if (!serialized || !serialized.rows || !serialized.rows.length) {
                serialized = DataTable.createEmpty();
                serialized.columns[0].inputType = DataColumnCellInputType.mark;
            } else {
                serialized.columns.unshift({ inputType: DataColumnCellInputType.mark });

                for (var i = 0; i < serialized.rows.length; i++) {
                    serialized.rows[i].cells.unshift({ value: serialized.rows[i].mark ? 'true' : '' });
                }
            }

            Ifly.Models.UI.DataSourceSettingsModal.getInstance().open({
                records: serialized
            }, {
                allowRichText: Ifly.Editor.getInstance().user.subscription.type() !=
                    SubscriptionType.basic,
                save: (result) => {
                    var t = null, r = null, c = null;

                    t = new DataTable(DataTable.trim(new DataTable(result ? result.records : null)));

                    for (var i = 0; i < t.rows().length; i++) {
                        r = t.rows()[i];
                        c = r.cells()[0];

                        r.mark(c.value() == 'true');
                        r.cells.splice(0, 1);
                    }

                    if (t.columns().length > 0) {
                        t.columns.splice(0, 1);
                    }

                    this.data.load(t.serialize());
                    this.updateDataText();

                    this.onPropertyChanged('data', new Ifly.Utils.DataTableConverter().convertToString(t));
                }
            });
        }

        /** Clears data. */
        public clearData() {
            this.data.clear();
            this.updateDataText();

            this.onPropertyChanged('data', new Ifly.Utils.DataTableConverter().convertToString(this.data));
        }

        /** Updates data text. */
        private updateDataText() {
            var n = this.data.rows().length, c = Ifly.App.getInstance().components['SlideManager'];
            this.dataText(n > 0 ? c.terminology.slideDefaults.editSelection + ' (' + n + ')' : '[' + c.terminology.slideDefaults.notSelected.toLowerCase() + ']');

        }
    }

    /* ********************************************************************************************************** */

    /** Represents chart chrome mode. */
    export enum ChartChromeMode {
        /** Automatic. */
        auto = 0,

        /** Hide chrome. */
        hide = 1
    }

    /** Represents a chart element. */
    export class ChartElement extends EditableElement {
        /** Gets or sets the map type. */
        public type: KnockoutObservable<ChartType>;

        /** Gets or sets the chart data. */
        public data: DataTable;

        /** Gets or sets the size of the chart. */
        public size: KnockoutObservable<number>;

        /** Gets or sets the chrome mode. */
        public chrome: KnockoutObservable<ChartChromeMode>;

        /** Gets or sets the data text. */
        public dataText: KnockoutObservable<string>;

        /** Gets or sets the data format help text. */
        public dataFormatHelp: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.newEditable('type', null, true);
            this.newEditable('size', null, true);
            this.newEditable('chrome', null, true);

            this.data = new DataTable();
            this.dataText = ko.observable<string>();
            this.dataFormatHelp = ko.observable<string>();

            this.updateDataText();

            this.size.subscribe(v => {
                this.size(Utils.Input.sizeScaleToPercentage(v));
            });

            super(data);

            this.type.subscribe((v) => {
                this.updateDataFormatHelp();
            });
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            var t = null;

            this.data.clear();
            this.size(ElementSizeScale.fiftyPercent);
            this.chrome(ChartChromeMode.auto);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'data') {
                    t = new Ifly.Utils.DataTableConverter().convertFromString(properties[i].value());
                    this.data.load(typeof(t.serialize) == 'function' ? t.serialize() : t);
                } else if (properties[i].name() == 'type') {
                    this.type(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'size') {
                    this.size(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'chrome') {
                    this.chrome(parseInt(properties[i].value(), 10));
                }
            }

            this.updateDataText();
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'data', value: new Ifly.Utils.DataTableConverter().convertToString(this.data) }),
                new ElementProperty({ name: 'type', value: this.type() }),
                new ElementProperty({ name: 'size', value: this.size() }),
                new ElementProperty({ name: 'chrome', value: this.chrome() })
            ];
        }
        
        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['DataSourceSettingsModal'];

            this.data.clear();

            this.type(ChartType.doughnut);
            this.size(ElementSizeScale.fiftyPercent);
            this.chrome(ChartChromeMode.auto);

            this.data.load({
                columns: [{ name: '' }, { name: c.terminology.column + ' #1'}],
                rows: [
                    { cells: [{ value: null }, { value: '1' }] },
                    { cells: [{ value: null }, { value: '2' }] },
                    { cells: [{ value: null }, { value: '3' }] },
                    { cells: [{ value: null }, { value: '4' }] }
                ]
            });

            this.updateDataText();

            this.onPropertyChanged('data', new Utils.DataTableConverter().convertToString(this.data));
        }

        /** Opens data edit dialog. */
        public editData() {
            Ifly.Models.UI.DataSourceSettingsModal.getInstance().open({
                records: this.data.rows().length > 0 ? this.data.serialize() : null
            }, {
                save: (i) => {
                    this.data.load(i.records);
                    
                    this.updateDataText();

                    this.onPropertyChanged('data',
                        new Utils.DataTableConverter().convertToString(this.data));
                }
            });
        }

        /** Clears data. */
        public clearData() {
            this.data.clear();
            this.updateDataText();

            this.onPropertyChanged('data', new Ifly.Utils.DataTableConverter().convertToString(this.data));
        }

        /** Updates data text. */
        private updateDataText() {
            var n = this.data.rows().length, c = Ifly.App.getInstance().components['SlideManager'];
            this.dataText(n > 0 ? c.terminology.slideDefaults.editSelection + ' (' + n + ')' : '[' + c.terminology.slideDefaults.notSelected.toLowerCase() + ']');

            this.updateDataFormatHelp();
        }

        /** Updates data format help. */
        private updateDataFormatHelp() {
            var m = Ifly.App.getInstance().components['SlideManager'],
                t = this.type(), text = '';

            if (t == null || isNaN(t)) {
                t = 0;
            }

            text = m.terminology.slideDefaults.chart['help_' + ChartType[t]];

            this.dataFormatHelp(text);
        }

        /** 
         * Occurs when chart type is changing.
         * @param {ChartType} type Chart type.
         * @param {Event} e Event object.
         */
        private onChartTypeChanging(type: ChartType, e: Event) {
            this.type(type);
            $(e.target).parents('.dropdown').blur();
        }
    }

    /* ********************************************************************************************************** */

    /** Represents map annotation. */
    export class MapAnnotation implements IModel {
        /** Gets or sets the name of the area. */
        public areaName: KnockoutObservable<string>;

        /** Gets or sets the area code. */
        public areaCode: KnockoutObservable<string>;

        /** Gets or sets relative density for this area. */
        public density: KnockoutObservable<MapAnnotationDensity>;

        /** Gets or sets the base color. */
        public baseColor: KnockoutObservable<ColorType>;

        /** Gets or sets the tooltip. */
        public tooltip: KnockoutObservable<string>;
        
        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: any) {
            this.areaName = ko.observable<string>();
            this.areaCode = ko.observable<string>();
            this.density = ko.observable<MapAnnotationDensity>();
            this.baseColor = ko.observable<ColorType>();
            this.tooltip = ko.observable<string>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.areaName(data.areaName || data.AreaName);
            this.areaCode(data.areaCode || data.AreaCode);
            this.density(data.density || data.Density);
            this.baseColor(data.baseColor || data.BaseColor || 0);
            this.tooltip(data.tooltip || data.Tooltip);
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                areaName: this.areaName(),
                areaCode: this.areaCode(),
                density: this.density(),
                baseColor: this.baseColor(),
                tooltip: this.tooltip()
            };
        }
    }

    /** Represents map scale. */
    export enum MapScale {
        /** 100%. */
        hundredPercent = 0,

        /** 150%. */
        hundredAndFiftyPercent = 1,

        /** 200%. */
        twoHundredPercent = 2
    }

    /** Represents a map element. */
    export class MapElement extends EditableElement {
        /** Gets or sets the map type. */
        public type: KnockoutObservable<MapType>;

        /** Gets or sets map annotations. */
        public annotations: KnockoutObservableArray<MapAnnotation>;

        /** Gets or sets the size of the map. */
        public size: KnockoutObservable<number>;

        /** Gets or sets the bar color. */
        public color: KnockoutObservable<ColorType>;

        /** Gets the annotations text. */
        public annotationsText: KnockoutComputed<string>;

        /** Gets or sets map scale. */
        public scale: KnockoutObservable<MapScale>;

        /** Gets or sets viewport left offset. */
        public viewportLeft: KnockoutObservable<number>;

        /** Gets or sest viewport top offset. */
        public viewportTop: KnockoutObservable<number>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.annotations = ko.observableArray<MapAnnotation>();

            this.newEditable('type', null, true);
            this.newEditable('size', null, true);
            this.newEditable('color', null, true);
            this.newEditable('scale', null, true);

            this.newEditable('viewportLeft');
            this.newEditable('viewportTop');

            this.annotationsText = ko.computed(() => {
                var n = this.annotations().length, c = Ifly.App.getInstance().components['SlideManager'];
                return n > 0 ? c.terminology.slideDefaults.editSelection + ' (' + n + ')' : '[' + c.terminology.slideDefaults.notSelected.toLowerCase() + ']';
            });

            this.size.subscribe(v => {
                this.size(Utils.Input.sizeScaleToPercentage(v));
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.annotations.removeAll();
            this.size(ElementSizeScale.fiftyPercent);
            this.scale(MapScale.hundredPercent);
            this.viewportLeft(0);
            this.viewportTop(0);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'annotations') {
                    ((annotations: Array<MapAnnotation>) => {
                        annotations.forEach((annon: MapAnnotation) => {
                            this.annotations.push(annon);
                        });
                    })(new Ifly.Utils.MapAnnotationArrayConverter().convertFromString(properties[i].value()));
                } else if (properties[i].name() == 'type') {
                    this.type(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'size') {
                    this.size(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'color') {
                    this.color(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'scale') {
                    this.scale(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'viewportLeft') {
                    this.viewportLeft(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'viewportTop') {
                    this.viewportTop(parseInt(properties[i].value(), 10));
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'annotations', value: new Ifly.Utils.MapAnnotationArrayConverter().convertToString(this.annotations()) }),
                new ElementProperty({ name: 'type', value: this.type() }),
                new ElementProperty({ name: 'color', value: this.color() }),
                new ElementProperty({ name: 'size', value: this.size() }),
                new ElementProperty({ name: 'scale', value: this.scale() }),
                new ElementProperty({ name: 'viewportLeft', value: this.viewportLeft() }),
                new ElementProperty({ name: 'viewportTop', value: this.viewportTop() }) 
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['SlideManager'];

            this.annotations.removeAll();
            this.size(ElementSizeScale.fiftyPercent);
            this.scale(MapScale.hundredPercent);
            this.viewportLeft(0);
            this.viewportTop(0);
            this.color(4); /* Auto */

            this.annotations.push(new MapAnnotation({ areaName: c.terminology.slideDefaults.map.newYork, areaCode: 'US-NY', density: MapAnnotationDensity.hight, baseColor: ColorType.accent2, tooltip: c.terminology.slideDefaults.map.newYork }));
            this.annotations.push(new MapAnnotation({ areaName: c.terminology.slideDefaults.map.texas, areaCode: 'US-TX', density: MapAnnotationDensity.low, baseColor: ColorType.accent3, tooltip: c.terminology.slideDefaults.map.texas }));

            this.onPropertyChanged('annotations', new Utils.MapAnnotationArrayConverter().convertToString(this.annotations()));
        }

        /** Opens annotations edit dialog. */
        public editAnnotations() {
            var serialized = ko.utils.arrayMap(this.annotations(), a => {
                return a.serialize();
            });

            Ifly.Models.UI.MapAnnotationsModal.getInstance().open({
                annotations: serialized,
                mapType: this.type()
            }, {
                save: (i) => {
                    this.annotations.removeAll();

                    i.annotations.forEach(a => {
                        this.annotations.push(new MapAnnotation(a));
                    });

                    this.onPropertyChanged('annotations',
                        new Utils.MapAnnotationArrayConverter().convertToString(this.annotations()));
                }
            });
        }

        /** Clears annotations. */
        public clearAnnotations() {
            this.annotations.removeAll();
            this.onPropertyChanged('annotations', new Utils.MapAnnotationArrayConverter().convertToString(this.annotations()));
        }

        /** 
         * Occurs when map type is changing.
         * @param {MapType} type Map type.
         * @param {Event} e Event object.
         */
        private onMapTypeChanging(type: MapType, e: Event) {
            this.type(type);
            $(e.target).parents('.dropdown').blur();
        }
    }

    /* ********************************************************************************************************** */

    /** Represents an image element. */
    export class ImageElement extends EditableElement {
        /** Gets or sets the source type. */
        public sourceType: KnockoutObservable<ImageSourceType>;

        /** Gets or sets the icon. */
        public icon: KnockoutObservable<string>;

        /** Gets or sets the icon color. */
        public iconColor: KnockoutObservable<ColorType>;

        /** Gets or sets the URL of the image. */
        public url: KnockoutObservable<string>;

        /** Gets or sets the width of the image. */
        public width: KnockoutObservable<number>;

        /** Gets or sets the icon text. */
        public iconText: KnockoutComputed<string>;

        /** Gets or sets the rotation angle. */
        public rotationAngle: KnockoutObservable<number>;

        /**
         * Initializes a new instance of an object.
         *
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.newEditable('sourceType', null, true);
            this.newEditable('icon');
            this.newEditable('url');
            this.newEditable('width', null, true);
            this.newEditable('iconColor', null, true);
            this.newEditable('rotationAngle');

            this.iconText = ko.computed(() => {
                var i = this.icon(), c = Ifly.App.getInstance().components['SlideManager'];
                return i && i.length > 0 ? (i.indexOf('/') > 0 ? i.substr(i.lastIndexOf('/') + 1) : i) : '[' + c.terminology.slideDefaults.notSelected.toLowerCase() + ']';
            });

            this.width.subscribe(v => {
                this.width(Utils.Input.sizeScaleToPercentage(v, ImageWidthScale));
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.url('');
            this.icon('');
            this.sourceType(ImageSourceType.url);
            this.width(ImageWidthScale.auto);
            this.rotationAngle(0);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'url') {
                    this.url(properties[i].value());
                } else if (properties[i].name() == 'width') {
                    this.width(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'sourceType') {
                    this.sourceType(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'icon') {
                    this.icon(properties[i].value());
                } else if (properties[i].name() == 'iconColor') {
                    this.iconColor(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'rotationAngle') {
                    this.rotationAngle(parseInt(properties[i].value(), 10));
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'url', value: this.url() }),
                new ElementProperty({ name: 'width', value: this.width() }),
                new ElementProperty({ name: 'sourceType', value: this.sourceType() }),
                new ElementProperty({ name: 'icon', value: this.icon() }),
                new ElementProperty({ name: 'iconColor', value: this.iconColor() }),
                new ElementProperty({ name: 'rotationAngle', value: this.rotationAngle() })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            this.url(Ifly.App.getInstance().rootUrl + '/edit/assets/img/sprites-128x128.png');
            this.icon('male');
            this.width(ImageWidthScale.tenPercent);
            this.sourceType(ImageSourceType.url);
            this.iconColor(ColorType.accent1);
        }

        /** Opens icon selection dialog. */
        public selectIcon() {
            Ifly.Models.UI.IconSelectorModal.getInstance().open({ icon: this.icon() }, {
                save: (i) => {
                    this.icon(i.icon);
                }
            });
        }

        /** Opens media selection dialog. */
        public selectMedia() {
            Ifly.Models.UI.MediaSelectorModal.getInstance().open({ media: this.url(), element: this.element }, {
                save: (i) => {
                    this.url(i.media);
                }
            });
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a fact element. */
    export class FactElement extends EditableElement {
        /** Gets or sets the icon. */
        public icon: KnockoutObservable<string>;

        /** Gets or sets the quantity. */
        public quantity: KnockoutObservable<string>;

        /** Gets or sets the quentity color. */
        public quantityColor: KnockoutObservable<ColorType>;

        /** Gets or sets the measure. */
        public measure: KnockoutObservable<string>;

        /** Gets or sets the description. */
        public description: KnockoutObservable<string>;

        /** Gets or sets the icon text. */
        public iconText: KnockoutComputed<string>;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.newEditable('icon');
            this.newEditable('quantity');
            this.newEditable('measure');
            this.newEditable('description');
            this.newEditable('quantityColor', null, true);

            this.iconText = ko.computed(() => {
                var i = this.icon(), c = Ifly.App.getInstance().components['SlideManager'];
                return i && i.length > 0 ? (i.indexOf('/') > 0 ? i.substr(i.lastIndexOf('/') + 1) : i) : '[' + c.terminology.slideDefaults.notSelected.toLowerCase() + ']';
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.icon('');
            this.quantity('');
            this.measure('');
            this.description('');

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'icon') {
                    this.icon(properties[i].value());
                } else if (properties[i].name() == 'quantity') {
                    this.quantity(properties[i].value());
                } else if (properties[i].name() == 'quantityColor') {
                    this.quantityColor(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'measure') {
                    this.measure(properties[i].value());
                } else if (properties[i].name() == 'description') {
                    this.description(properties[i].value());
                } 
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'icon', value: this.icon() }),
                new ElementProperty({ name: 'quantity', value: this.quantity() }),
                new ElementProperty({ name: 'quantityColor', value: this.quantityColor() }),
                new ElementProperty({ name: 'measure', value: this.measure() }),
                new ElementProperty({ name: 'description', value: this.description() })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['SlideManager'];

            this.quantity(c.terminology.slideDefaults.fact.quantity);
            this.quantityColor(ColorType.accent1);
            this.measure(c.terminology.slideDefaults.fact.measure);
            this.description(c.terminology.slideDefaults.fact.description);
        }

        /** Opens icon selection dialog. */
        public selectIcon() {
            Ifly.Models.UI.IconSelectorModal.getInstance().open({ icon: this.icon() }, {
                save: (i) => {
                    this.icon(i.icon);
                }
            });
        }

        /** Clears the icon. */
        public clearIcon() {
            this.icon('');
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a text font size. */
    export enum TextFontSize {
        /** Medium font size. */
        medium = 0,

        /** Small font size. */
        small = 1,

        /** Extra small font size. */
        extraSmall = 2,

        /** Large font size. */
        large = 3,

        /** Extra large font size. */
        extraLarge = 4
    }

    /** Represents a text block element. */
    export class TextElement extends EditableElement {
        /** Gets or sets the text block text. */
        public text: KnockoutObservable<string>;

        /** Gets or sets value indicating whether text is "rich text" formatted. */
        public isRichText: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether rich text is allowed. */
        public isRichTextAllowed: KnockoutObservable<boolean>;

        /** Gets or sets the signature. */
        public signature: KnockoutObservable<string>;

        /** Gets or sets the text type. */
        public textType: KnockoutObservable<TextType>;

        /** Gets or sets the font size. */
        public fontSize: KnockoutObservable<TextFontSize>;

        /** Gets or sets value indicating whether bold style applies to this text block. */
        public isBold: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether italic style applies to this text block. */
        public isItalic: KnockoutObservable<boolean>;

        /** Gets or sets the maximum width of the text block. */
        public width: KnockoutObservable<number>;

        /** Gets or sets the rich text editor. */
        public richText: UI.RichTextEditor;

        /**
         * Initializes a new instance of an object.
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.newEditable('text');
            this.newEditable('signature');
            this.newEditable('width', null, true);
            this.newEditable('textType', null, true);
            this.newEditable('fontSize', null, true);
            this.newEditable('isBold');
            this.newEditable('isItalic');

            /* Rich text is allowed on pro subscriptions. */
            this.isRichText = ko.observable<boolean>(
                Ifly.Editor.getInstance().user.subscription.type() !=
                    SubscriptionType.basic);

            this.isRichTextAllowed = ko.observable<boolean>(this.isRichText());

            this.richText = new UI.RichTextEditor();

            this.richText.addEventListener('change', (sender, args) => {
                this.text(args.html);
            });

            this.width.subscribe(v => {
                this.width(Utils.Input.sizeScaleToPercentage(v, TextWidthScale));
            });

            super(data);
        }

        /**
         * Loads element properties.
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.text('');
            this.signature('');
            this.textType(0);
            this.fontSize(0);
            this.isBold(false);
            this.isItalic(false);
            this.width(TextWidthScale.auto);

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'textType') {
                    this.textType(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'text') {
                    this.text(properties[i].value());
                } else if (properties[i].name() == 'width') {
                    this.width(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'signature') {
                    this.signature(properties[i].value());
                } else if (properties[i].name() == 'fontSize') {
                    this.fontSize(parseInt(properties[i].value(), 10));
                } else if (properties[i].name() == 'isBold') {
                    this.isBold(properties[i].value() == 'true');
                } else if (properties[i].name() == 'isItalic') {
                    this.isItalic(properties[i].value() == 'true');
                } else if (properties[i].name() == 'isRichText') {
                    this.isRichText(this.isRichTextAllowed() || properties[i].value() == 'true');
                }
            }

            this.richText.html(this.text());
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'text', value: this.text() }),
                new ElementProperty({ name: 'width', value: this.width() }),
                new ElementProperty({ name: 'isRichText', value: this.isRichText() }),
                new ElementProperty({ name: 'signature', value: this.signature() }),
                new ElementProperty({ name: 'textType', value: this.textType() }),
                new ElementProperty({ name: 'fontSize', value: this.fontSize() }),
                new ElementProperty({ name: 'isBold', value: this.isBold() }),
                new ElementProperty({ name: 'isItalic', value: this.isItalic() })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            var c = Ifly.App.getInstance().components['SlideManager'];

            this.text(c.terminology.slideDefaults.text);
            this.width(TextWidthScale.auto);
            this.richText.html(c.terminology.slideDefaults.text);
            this.signature('');
            this.textType(TextType.text);
            this.fontSize(TextFontSize.medium);
            this.isBold(false);
            this.isItalic(false);
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a slide title element. */
    export class TitleElement extends EditableElement {
        /** Gets or sets the title text. */
        public text: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         *
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            this.newEditable('text');

            super(data);
        }

        /**
         * Loads element properties.
         *
         * @param {ElementProperty[]} properties Element properties.
         */
        public loadProperties(properties: ElementProperty[]) {
            this.text('');

            for (var i = 0; i < properties.length; i++) {
                if (properties[i].name() == 'text') {
                    this.text(properties[i].value());
                }
            }
        }

        /** Serializes element properties. */
        public serializeProperties(): ElementProperty[] {
            return [
                new ElementProperty({ name: 'text', value: this.text() })
            ];
        }

        /** Resets element property values to their defaults. */
        public resetToDefaults() {
            this.text('');
        }
    }

    /* ********************************************************************************************************** */

    /** Represents a slide description element. */
    export class DescriptionElement extends TitleElement {
        /**
         * Initializes a new instance of an object.
         *
         * @param {Element} data Element.
         */
        constructor(data?: Element) {
            super(data);
        }
    }

    /* ********************************************************************************************************** */

    /** Represents element position. */
    export enum ElementPosition {
        /** Place the element on the top of the slide. */
        top = 0,

        /** Place the element on the left of the slide. */
        left = 1,

        /** Place the element on the right of the slide. */
        right = 2,

        /** Place the element on the bottom of the slide. */
        bottom = 3,

        /** Place the element in the center of the slide. */
        center = 4,

        /** Element can freely be moved within the slide. */
        free = 5
    }

    /** Represents element size scale. */
    export enum ElementSizeScale {
        /** Ten percent. */
        tenPercent = 0,

        /** Twenty-five percent. */
        twentyFivePercent = 1,

        /** Thirty-five percent. */
        thirtyFivePercent = 2,

        /** Fifty percent. */
        fiftyPercent = 3,

        /** Seventy five percent. */
        seventyFivePersent = 4
    }

    /** Represents element offset viewport. */
    export class ElementOffsetViewport implements IModel {
        /** Gets or sets the viewport width. */
        public width: KnockoutObservable<number>;

        /** Gets or sets the viewport height. */
        public height: KnockoutObservable<number>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.width = ko.observable<number>();
            this.height = ko.observable<number>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.width(data.width || data.Width || 0);
            this.height(data.height || data.Height || 0);
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                width: this.width(),
                height: this.height()
            };
        }
    }

    /** Represents element offset. */
    export class ElementOffset implements IModel {
        /** Gets or sets the offset from the left. */
        public left: KnockoutObservable<number>;

        /** Gets or sets the offset from the top. */
        public top: KnockoutObservable<number>;

        /** Gets or sets the element offset viewport. */
        public viewport: ElementOffsetViewport;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.left = ko.observable<number>();
            this.top = ko.observable<number>();
            this.viewport = new ElementOffsetViewport();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.left(data.left || data.Left || 0);
            this.top(data.top || data.Top || 0);

            this.viewport.load(data.viewport || data.Viewport);
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                left: this.left(),
                top: this.top(),
                viewport: this.viewport.serialize()
            };
        }
    }

    /** Represents a visual element that is placed on a slide. */
    export class Element implements IModel {
        /** Gets or sets the element Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets the name of the element. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the Id of the corresponding slide. */
        public slideId: KnockoutObservable<number>;

        /** Gets or sets the element position. */
        public position: KnockoutObservable<ElementPosition>;

        /** Gets or sets the element type. */
        public type: KnockoutObservable<ElementType>;

        /** Gets or sets element properties. */
        public properties: KnockoutObservableArray<ElementProperty>;

        /** Gets or sets the order of this element relative to other elements in the same position. */
        public order: KnockoutObservable<number>;

        /** Gets or sets the Id of the slide the user will be navigated to when he/she clicks the element. */
        public navigateSlideId: KnockoutObservable<number>;

        /** Gets or sets value indicating whether this element was copied from another element. */
        public isCopied: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether this element is locked for moving. */
        public isLocked: KnockoutObservable<boolean>;

        /** Gets or sets the element offset. */
        public offset: ElementOffset;

        /** Gets or sets element's elevation. */
        public elevation: KnockoutObservable<number>;

        /** Gets or sets realtime data configuration. */
        public realtimeData: RealtimeDataConfiguration;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.name = ko.observable<string>();
            this.slideId = ko.observable<number>();
            this.position = ko.observable<ElementPosition>(ElementPosition.top);
            this.type = ko.observable<ElementType>(ElementType.text);
            this.properties = ko.observableArray<ElementProperty>();
            this.order = ko.observable<number>(0);
            this.navigateSlideId = ko.observable<number>(0);
            this.offset = new ElementOffset();
            this.isCopied = ko.observable<boolean>();
            this.isLocked = ko.observable<boolean>();
            this.elevation = ko.observable<number>();
            this.realtimeData = new RealtimeDataConfiguration();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.id(data.id || data.Id || 0);
            this.name(data.name || data.Name);
            this.slideId(data.slideId || data.SlideId || 0);
            this.position(data.position || data.Position || 0);
            this.type(data.type || data.Type || 0);
            this.order(data.order || data.Order || 0);
            this.navigateSlideId(data.navigateSlideId || data.NavigateSlideId || 0);
            this.isCopied(data.isCopied || data.IsCopied || false);
            this.isLocked(data.isLocked || data.IsLocked || false);
            this.elevation(data.elevation || data.Elevation || 0);
            this.realtimeData.load(data.realtimeData || data.RealtimeData);

            this.properties.removeAll();

            if (data.properties || data.Properties) {
                ko.utils.arrayForEach(data.properties || data.Properties, (p) => {
                    this.properties.push(new ElementProperty(p));
                });
            }

            this.offset.load(data.offset || data.Offset || null);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                name: this.name(),
                slideId: this.slideId(),
                position: this.position(),
                type: this.type(),
                order: this.order(),
                navigateSlideId: this.navigateSlideId(),
                isCopied: this.isCopied(),
                isLocked: this.isLocked(),
                properties: ko.utils.arrayMap(this.properties(), (p) => {
                    return (<ElementProperty>p).serialize();
                }),
                offset: this.offset.serialize(),
                elevation: this.elevation(),
                realtimeData: this.realtimeData.serialize()
            };
        }
    }
}