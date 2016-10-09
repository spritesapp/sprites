/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="Component.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../Generators/ElementFactory.ts" />

module Ifly.Models.UI {
    /** Represents an element properties panel. */
    export class ElementPropertiesPanel extends Component {
        /** Gets or sets value indicating whether panel is open. */
        public isOpen: KnockoutObservable<boolean>;

        /** Gets or sets the selected element. */
        public selectedElement: Element;

        /** Gets or sets the name of the panel sub-title. */
        public subTitle: KnockoutObservable<string>;

        /** Gets or sets value indicating whether to ignore property changes. */
        private _ignorePropertyChanges: boolean;

        /** Gets or sets the closing timer. */
        private _closingTimer: number;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);

            this.subTitle = ko.observable<string>();
            this.isOpen = ko.observable<boolean>(false);
            this.isOpen.subscribe(v => {
                var p = $('.toolbar.element-properties');

                if (!this._closingTimer) {
                    clearTimeout(this._closingTimer);
                    this._closingTimer = null;
                }

                if (!!v) {
                    p.addClass('closing');

                    this._closingTimer = setTimeout(() => {
                        p.removeClass('closing');
                    }, 300);
                } else {
                    p.removeClass('closing');
                }

            }, null, 'beforeChange');
        }

        /** Toggles panel visibility. */
        public toggleVisibility() {
            this.isOpen(!this.isOpen());

            /* Deselecting the element on a slide */
            if (!this.isOpen() && this.selectedElement) {
                this.selectedElement = null;
                this.editor.composition.selectElement(null);
            }

            if (this.isOpen()) {
                this.updateThemeBasedStyles();
            }
        }

        /** 
         * Updates the current editable element's state.
         * @param {EditableElement} element Element to update.
         */
        public update(action: (element: EditableElement) => any) {
            if (this.selectedElement && (<any>this.selectedElement).editable) {
                this._ignorePropertyChanges = true;
                action(<EditableElement>((<any>this.selectedElement).editable));
                this._ignorePropertyChanges = false;
            }
        }

        /**
         * Selects the given element.
         * @param {Element} element Element to select.
         */
        public selectElement(element: Element) {
            var view = null, container = null, isNew = element.id() <= 0, outer = null;
            
            this.selectedElement = element;

            this.subTitle(element.name());

            (<any>this.selectedElement).editable = Generators.ElementFactory.makeEditable(element);
            (<any>this.selectedElement).editable.addEventListener('propertyChanged', (sender, args) => {
                var properties = [];

                if (!this._ignorePropertyChanges) {
                    if (args.name == 'position') {
                        this.selectedElement.position(parseInt(args.value, 10));
                    } else {
                        properties = this.selectedElement.properties();

                        for (var i = 0; i < properties.length; i++) {
                            if (properties[i].name() == args.name) {
                                properties[i].value(args.value);
                                break;
                            }
                        }

                        if (this.selectedElement.id() > 0) {
                            Ifly.App.getInstance().trackEvent('act', this.selectedElement.name());
                        }
                    }

                    this.editor.composition.updateElement(this.selectedElement);
                }
            });

            ko.removeNode($('.element-properties .form')[0]);
            view = $('.element-views .element-' + ElementType[element.type()]);

            container = view.clone(true, true).addClass('form nano-content').attr('data-bind', 'with: selectedElement.editable');
            outer = $('.element-properties .form-outer').removeClass('has-scrollbar').append(container);

            ko.applyBindings(this, container[0]);

            /* Activating scrollbars. */
            outer.get(0).nanoscroller = null;

            if (!Ifly.App.getInstance().browser.mac) {
                (<any>outer).nanoScroller();
            }

            container.removeAttr('tabindex');

            /** On Mac we have a weird issue with nanoscroller where the content gets cut. Enabling native scroll instead. */
            if (Ifly.App.getInstance().browser.mac) {
                outer.attr('style', 'overflow: auto !important; overflow-x: hidden !important;');
                container.attr('style', 'overflow: inherit !important; position: relative !important;');
            } else if (Ifly.App.getInstance().browser.firefox) {
                /* No way to hide Firefox scrollbar but the markup can't be changed to accomodate nagive offset right.
                 * This means scrolling (mousewheel and other cases) won't work but dragging the scrollbar will (initialized earlier). */
                container.css('overflow', 'hidden');
            }

            /* Opening the panel if it's hidden */
            if (!this.isOpen()) {
                this.toggleVisibility();
            } else {
                this.updateThemeBasedStyles();
            }

            /* Initial update - initializing with default values */
            if (isNew && !element.isCopied()) {
                (<any>this.selectedElement).editable.resetToDefaults();
            }
        }

        /** Clears theme-based element styles and re-applies classes from the current theme. */
        private updateThemeBasedStyles() {
            this.editor.composition.updateThemeBasedStyles($('.element-properties'));
        }
    }
}