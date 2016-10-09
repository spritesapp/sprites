/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="Control.ts" />

module Ifly.Models.UI {
    /** Represents an image selector. */
    export class ImageSelector extends Control {
        /** Gets or sets the image URL. */
        public image: KnockoutObservable<string>;

        /** Gets or sets value indicating whether image is selected. */
        public imageSelected: KnockoutComputed<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} container Control container.
         */
        constructor(container?: any) {
            super(container);

            this.image = ko.observable<string>();
            this.imageSelected = ko.computed<boolean>(() => {
                var v = this.image();
                return !!v && v.length > 0;
            });

            this.image.subscribe(v => {
                this.dispatchEvent('imageChanged', { image: v });
            });
        }

        /** Selects image. */
        public selectImage() {
            Ifly.Models.UI.MediaSelectorModal.getInstance().open({ media: this.image() }, {
                replaceCurrent: true,
                save: (i) => {
                    this.image(i.media);
                }
            });
        }

        /** Clears image. */
        public clearImage() {
            this.image('');
        }

        /** 
         * Occurs when preview is to be shown.
         * @param {Event} e Event object.
         */
        private onShowImagePreview(e: MouseEvent) {
            var id = 'image-selector-image-preview',
                preview = $('#' + id),
                offset = $(e.target).offset(),
                c = Ifly.App.getInstance().components['ImageSelector'].terminology;

            if (!preview.length) {
                preview = $('<div id="' + id + '" class="item-preview-overlay">')
                    .append($('<div class="heading">').text(c.preview))
                    .append($('<div class="image-container">').append($('<img alt="" />').attr('src', this.image())));

                preview.find('img').bind('load', e => {
                    $(e.target).addClass('active');
                });

                $(document.body).append(preview);

                preview.css({
                    left: (offset.left + 28) + 'px',
                    top: (offset.top + 5) + 'px'
                });
            }
        }

        /** 
         * Occurs when image preview is to be hidden.
         */
        private onHideImagePreview() {
            $('#image-selector-image-preview').remove();
        }
    }
}