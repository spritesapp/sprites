/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="Component.ts" />
/// <reference path="../Element.ts" />
/// <reference path="ElementPropertiesPanel.ts" />
/// <reference path="../Generators/ElementFactory.ts" />

module Ifly.Models.UI {
    /** Represents element clipboard. */
    export class ElementClipboard {
        /** Gets or sets clipboard data. */
        public data: KnockoutObservable<any>;

        /** Gets or sets the clipboard name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets whether clipboard is empty. */
        public isEmpty: KnockoutComputed<boolean>;

        /** Initializes a new instance of an object. */
        constructor() {
            this.data = ko.observable<any>();
            this.name = ko.observable<string>();
            this.isEmpty = ko.computed(() => this.data() == null);

            this.data.subscribe(v => {
                this.name(v && v.name && v.name.length ? v.name : '');
            });
        }

        /** Returns clipboard data as element. */
        public getElement(): Ifly.Models.Element {
            var ret = null, d = null, properties = [];

            if (!this.isEmpty()) {
                ret = new Ifly.Models.Element(this.data());

                if (ret.name() && ret.name().length) {
                    /* Cleaning properties that shouldn't be copied. */
                    ret.id(0);
                    ret.slideId(0);
                    ret.position(Ifly.Models.ElementPosition.top);
                    ret.order(null);
                    ret.navigateSlideId(0);
                    ret.offset.left(0);
                    ret.offset.top(0);
                    ret.isCopied(true);
                    ret.isLocked(false);

                    properties = ret.properties();

                    for (var i = 0; i < properties.length; i++) {
                        properties[i].id(0);
                        properties[i].elementId(0);
                    }
                } else {
                    /* Not an element. */
                    ret = null;
                }
            }

            return ret;
        }
    }

    /** Represents a gallery manager. */
    export class GalleryManager extends Component {
        /** Gets or sets the element clipboard. */
        public clipboard: ElementClipboard;

        /** Gets or sets value indicating whether gallery drop-down is open. */
        public isOpen: KnockoutObservable<boolean>;

        /** Gets or sets the element properties panel. */
        public elementProperties: ElementPropertiesPanel;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);

            this.clipboard = new ElementClipboard();
            this.isOpen = ko.observable(false);
            (<any>this.isOpen).andReady = ko.observable(false);

            this.elementProperties = new ElementPropertiesPanel(editor);
        }

        /** Toggles gallery drop-down visibility. */
        public toggleVisibility() {
            var isOpen = !this.isOpen();

            (<any>this.isOpen).andReady(isOpen);

            this.isOpen(isOpen);
        }

        /** 
         * Pastes the given element onto the current slide.
         * @param {Element} element Element to pasted (if omitted, will be taken from clipboard).
         */
        public pasteElement(element?: Element) {
            var elm = element || this.clipboard.getElement(), pasteButton = null;

            if (elm && this.editor.presentation.selectedSlide()) {
                /* Hiding "clipboard" button immediately. */
                pasteButton = $('.paste-element');
                pasteButton.css({ visibility: 'hidden' });

                this.clipboard.data(null);
                this.addElement(this.editor.presentation.selectedSlide(), elm);

                setTimeout(() => {
                    pasteButton.css({ visibility: 'visible' });
                }, 350);
            }
        }

        /** 
         * Adds new element to the current slide.
         * @param {ElementType} type Element type.
         * @param {string} name Element name.
         * @param {ElementProperty[]} properties Element properties.
         */
        public newElement(type: ElementType, name: string, properties?: ElementProperty[], isCopied?: boolean) {
            var slide = this.editor.presentation.selectedSlide();

            /* Creating new element with some default values */
            var element = new Element({
                type: type,
                name: name,
                slideId: slide.id(),
                position: ElementPosition.top,
                order: this.editor.composition.nextElementOrder(slide)
            });

            /* Respecting the "is copied" flag. */
            if (typeof (isCopied) !== 'undefined') {
                element.isCopied(!!isCopied);
            }

            /* Assigning properties (if provided). */
            if (properties) {
                ko.utils.arrayForEach(properties, prop => {
                    element.properties().push(prop);
                });
            }

            /* Closing the gallery if it's open */
            if (this.isOpen()) {
                this.toggleVisibility();
            }

            Ifly.App.getInstance().trackEvent('discover', name);

            this.addElement(slide, element);

            return element;
        }

        /** 
         * Adds the given element onto the given slide.
         * @param {Slide} slide Slide.
         * @param {Element} element Element.
         * @param {boolean} compositionOnly Value indicating whether to add element to the composition only (no API call is made).
         */
        public addElement(slide: Slide, element: Element, compositionOnly?: boolean) {
            var node = null, slideIdUpdated = false;

            /* Assigning the correct slide Id. */
            if (element.slideId() <= 0 || element.slideId() != slide.id()) {
                element.slideId(slide.id());
                slideIdUpdated = true;
            }

            /* Assigning the order. */
            if (element.order() == null || slideIdUpdated) {
                element.order(this.editor.composition.nextElementOrder(slide));
            }

            /* New element is added as the last one */
            slide.elements.push(element);

            /* Composing the element and showing its properties */
            node = this.editor.composition.selectElement(element, compositionOnly);

            if (!compositionOnly) {
                /* Element Id is retrieved in the background */
                App.getInstance().api.post('presentations/' + Ifly.App.unwrap(slide.presentationId) + '/slides/' + Ifly.App.unwrap(slide.id) + '/elements/{id}', element.serialize(), (success, data) => {
                    element.id(parseInt(data, 10) || 0);

                    /* Updating associated composition */
                    this.editor.composition.updateElementWithNode(element, node);

                    this.editor.dispatchEvent('elementsUpdated', {
                        elements: [element],
                        type: 'new'
                    });
                }, true);
            }
        }
    }
}