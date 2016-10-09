/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../Slide.ts" />
/// <reference path="../../App.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="SlideSettingsModal.ts" />
/// <reference path="IconSelectorModal.ts" />
/// <reference path="Component.ts" />
/// <reference path="../../Utils/Input.ts" />

module Ifly.Models.UI {
    /** Represents a slide manager. */
    export class SlideManager extends Component {
        /** Gets or sets the slide delete confirmation modal. */
        private _deleteConfirmModal: any;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);
        }

        /** Initializes the manager. */
        public updateScrollableAreaHeight() {
            var wnd = $(window),
                container = null,
                slideListGap = 85,
                buttonsCumulativeHeight = 0,
                menuOptionsCumulativeHeight = 0,
                outer = this.editor.container.find('.slide-list-outer'),
                headerHeight = this.editor.container.find('.header-wrapper').outerHeight(true);

            wnd.unbind('.slides')
                .bind('resize.slides', () => {
                    this.updateScrollableAreaHeight();
                });

            container = outer.find('.nano-content');

            outer.find('.slide-list-contents > li').each((i, e) => {
                buttonsCumulativeHeight += $(e).outerHeight();
            });

            this.editor.container.find('nav.primary > ul > li').each((i, e) => {
                var menuElement = $(e);

                menuOptionsCumulativeHeight += menuElement.hasClass('slide-list') ?
                    buttonsCumulativeHeight : menuElement.outerHeight(true);
            });

            if ((menuOptionsCumulativeHeight + headerHeight) > (this.editor.container.find('.toolbar-buttons').height() - slideListGap)) {
                buttonsCumulativeHeight = 0;

                container.removeClass('nano-no-native-scroll');

                this.editor.container.find('nav.primary > ul > li').not('.slide-list').each((i, e) => {
                    buttonsCumulativeHeight += $(e).outerHeight(true);
                });

                outer.css('height', (this.editor.container.find('.toolbar-buttons').height() - slideListGap -
                    headerHeight - buttonsCumulativeHeight) + 'px');

                /* Activating scrollbars. */
                outer.get(0).nanoscroller = null;

                setTimeout(() => {
                    (<any>outer).nanoScroller();
                }, 100);

                container.removeAttr('tabindex').removeClass('nano-no-offset');

                if (Ifly.App.getInstance().browser.firefox) {
                    /* No way to hide Firefox scrollbar but the markup can't be changed to accomodate nagive offset right.
                     * This means scrolling (mousewheel and other cases) won't work but dragging the scrollbar will (initialized earlier). */
                    container.css('overflow', 'hidden').addClass('nano-no-offset');
                }
            } else {
                container.removeAttr('style').addClass('nano-no-native-scroll');
                outer.find('.nano-pane').css('display', 'none');

                outer.removeClass('has-scrollbar').css('height', buttonsCumulativeHeight + 'px');
            }
        }

        /** 
         * Returns the zero-based index of a slide with the given Id.
         * @param {number} slideId Slide Id.
         */
        public indexOf(slideId: number): number {
            return this.editor.presentation.slides.indexOf(this.findSlideById(slideId));
        }

        /**
         * Selects the given slide.
         * @param {object} slide Slide to select.
         */
        public selectSlide(slide: Ifly.Models.Slide) {
            var index = -1, prev = null,
                current = this.editor.presentation.selectedSlideIndex();

            prev = current >= 0 ? <any>this.editor.presentation.slides()[current] : null;

            if (slide) {
                index = this.editor.presentation.slides.indexOf(this.findSlideById(slide.id()));

                if (index >= 0) {
                    slide.selected(true);
                    this.editor.presentation.selectedSlideIndex(index);

                    if (prev && prev != slide) {
                        prev.selected(false);
                    }
                }
            } else {
                this.editor.presentation.selectedSlideIndex(-1);
                if (prev) {
                    prev.selected(false);
                }
            }

            /* Initializing the composition */
            this.editor.composition.selectSlide(slide);

            this.dispatchEvent('slideSelected', { slide: slide });
        }

        /** Opens the new slide modal. */
        public newSlide() {
            this.editSlide(new Ifly.Models.Slide());
        }

        /** 
         * Opens the edit slide modal.
         * @param {object} slide Slide to edit.
         * @param {object} options Custom options.
         */
        public editSlide(slide: any, options?: any) {
            Ifly.Models.UI.SlideSettingsModal.getInstance().open(typeof (slide.serialize) == 'function' ? slide.serialize() : slide, options);
        }

        /** 
         * Saves the given slide.
         * @param {object} slide Slide to save.
         * @param {function} function Callback function.
         */
        public saveSlide(slide: any, callback?: Function) {
            var serialized = null, isNew = false;

            serialized = slide.serialize();

            /* To make sure this slide is associated with the current presentation. */
            serialized.presentationId = this.editor.presentation.id();

            Ifly.App.getInstance().api.update('presentations/' + serialized.presentationId + '/slides/{id}/settings', serialized, (success, data) => {
                isNew = typeof(serialized.id) == 'undefined' || serialized.id == null || isNaN(serialized.id) || parseInt(serialized.id, 10) <= 0
                serialized.id = parseInt((data && typeof (data.id) != 'undefined' ? data.id : data), 10) || 0;

                if (callback) {
                    callback(serialized);
                }

                this.editor.dispatchEvent('slidesUpdated', {
                    slides: [this.getBasicSlide(new Slide(serialized))],
                    type: isNew ? 'new' : ''
                });
            });
        }

        /**
         * Applies slide template to the current slide.
         * @param {ISlideTemplate} template Slide template.
         * @param {Function} callback A callback which is executed when template is applied.
         */
        public applySlideTemplate(template: ISlideTemplate, callback?: Function) {
            var slide = this.editor.presentation.selectedSlide(), elements = [], layout = null;

            callback = callback || function () { };

            if (template && slide) {
                layout = template.getLayout();

                if (layout && (layout.title || layout.description || (layout.elements && layout.elements.length))) {
                    /* Updating slide in the background. */
                    Ifly.App.getInstance().api.update('presentations/' + this.editor.presentation.id() + '/slides/' + slide.id() + '/data', template.serialize(), (success, data) => {
                        if (data) {
                            if (!slide.title() || !slide.title().length) {
                                slide.title(data.title || data.Title || '');
                            }

                            if (!slide.description() || !slide.description().length) {
                                slide.description(data.description || data.Description || '');
                            }

                            elements = data.elements || data.Elements || [];

                            for (var i = 0; i < elements.length; i++) {
                                slide.elements.push(new Ifly.Models.Element(elements[i]));
                            }

                            /* Selecting this slide (forcing update of the composition). */
                            this.editor.composition.selectSlide(slide, true);
                        }

                        callback(data);
                    }, true);
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        }

        /** 
         * Begins cloning the given slide.
         * @param {object} slide Slide to clone.
         */
        public beginCloneSlide(slide: any) {
            UI.CloneSlideModal.getInstance().open({
                sourceSlideId: (slide.id || slide.Id || slide.sourceSlideId)(),
                title: slide.title()
            });
        }

        /** 
         * Clones the given slide.
         * @param {object} slide Slide to clone.
         * @param {function} function Callback function.
         */
        public cloneSlide(slide: any, callback?: Function) {
            var serialized = null, clonedSlide = null;

            serialized = slide.serialize();

            /* To make sure this slide is associated with the current presentation. */
            serialized.presentationId = this.editor.presentation.id();

            Ifly.App.getInstance().api.post('presentations/' + serialized.presentationId + '/slides/' + serialized.sourceSlideId + '/clone', serialized, (success, data) => {
                if (callback) {
                    callback(data);
                }

                clonedSlide = new Slide(data);

                this.prepareSlideForCollaboratorDispatch(clonedSlide);

                this.editor.dispatchEvent('slidesUpdated', {
                    slides: [clonedSlide],
                    type: 'new'
                });
            });
        }

        /** 
         * Deletes the given slide.
         * @param {object} slide Slide to delete.
         */
        public tryDeleteSlide(slide: any) {
            var app = Ifly.App.getInstance(),
                c = app.components['SlideSettingsModal'];

            if (!this._deleteConfirmModal) {
                this._deleteConfirmModal = app.openModal({
                    content: $('#slide-delete'),
                    buttons: [
                        {
                            text: c.terminology.deleteSlide,
                            click: (sender, args) => {
                                this._deleteConfirmModal.close();
                                this.deleteSlide(sender.data);
                            }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this._deleteConfirmModal.close(); },
                        }
                    ],
                    closeOnEscape: false,
                    data: slide

                });
            } else {
                this._deleteConfirmModal.open({ data: slide });
            }
        }

        /** 
         * Deletes the given slide.
         * @param {object} slide Slide to delete.
         * @param {boolean} compositionOnly Value indicating whether to only update composition (don't call API).
         */
        public deleteSlide(slide: any, compositionOnly?: boolean) {
            var slides = null, s = null, id = 0, removed = () => {
                var target = this.findSlideById(slide.id()),
                    i = this.editor.presentation.slides.indexOf(target),
                    wasSelected = target.selected(), remaining = 0;

                this.editor.presentation.slides.remove(target);
                remaining = this.editor.presentation.slides().length;

                if (remaining > 0) {
                    if ((i - 1) >= 0) {
                        i -= 1;
                    }

                    if (wasSelected && i >= 0 && i < remaining) {
                        this.selectSlide(this.editor.presentation.slides()[i]);
                    }
                } else {
                    this.selectSlide(null);
                }

                this.updateScrollableAreaHeight();

                this.dispatchEvent('slideDeleted', { slide: slide, remaining: remaining });
            };

            if (slide) {
                id = Ifly.App.unwrap(slide.id);

                if (id > 0) {
                    if (!compositionOnly) {
                        Ifly.App.getInstance().api.delete('presentations/' + Ifly.App.unwrap(slide.presentationId) + '/slides/{id}', id, null, true);

                        this.editor.dispatchEvent('slidesDeleted', {
                            slides: [this.getBasicSlide(slide)]
                        });
                    }

                    s = $(this.editor.container.find('.slide-list-contents > li[data-slide="' + id + '"]')[0]);

                    if (s && s.length) {
                        /* Animating */
                        s.addClass('removing');

                        setTimeout(() => {
                            /* Removing from DOM */
                            s.remove();
                            removed();
                        }, 300);
                    } else {
                        removed();
                    }
                } else {
                    removed();
                }
            }
        }

        /** 
         * Occurs when slide gets updated.
         * @param {object} slide Slide that was updated.
         * @param {boolean} compositionOnly Value indicating whether to only update compositon (don't select the slide).
         */
        public onSlideUpdated(slide: any, compositionOnly?: boolean) {
            var id = slide.id || slide.Id, found = null, s = null,
                target = null;

            if (id > 0) {
                found = this.findSlideById(id);
            }

            if (!found) {
                s = new Models.Slide(slide);

                /* To make sure this slide is associated with the current presentation. */
                s.presentationId(this.editor.presentation.id());

                this.editor.presentation.slides.push(s);

                /* Slide transition on creation */
                this.expand();

                setTimeout(() => {
                    this.editor.container.find('.slide-list-contents > li').not('.active').addClass('active');
                }, 0);

                setTimeout(() => {
                    /* If we have scrollbars, scrolling to the new slide. */
                    this.editor.container.find('.slide-list-outer.nano.has-scrollbar')
                        .nanoScroller({ scroll: 'bottom' });
                }, 150);

                if (!compositionOnly) {
                    /* Selecting the newly created slide */
                    this.selectSlide(s);
                }
            } else {
                found.load(slide, true);
            }

            target = <Slide>(found || s);

            if (!target || (this.editor.presentation.selectedSlide() && target.id() == this.editor.presentation.selectedSlide().id())) {
                /* Updating title and description on the composition */
                this.editor.composition.onSlideUpdated(<Slide>(found || s));
            }
        }

        /** 
         * Expands all hidden slides.
         * @param {boolean} noTransition Value indicating whether not to perform vertical transition of the slide within the list.
         */
        public expand(noTransition?: boolean, expanding?: boolean) {
            var hiddenSlides = this.editor.container.find('.slide-list-contents > li').not('.active'),
                domPropagationTimeout = 15, onExpanded = () => {
                    setTimeout(() => {
                        this.makeSlidesSortable();
                        
                    }, 100);
                };

            /* Before expanding, updating scrollable area height. */
            if (!expanding) {
                this.updateScrollableAreaHeight();
            }

            if (noTransition) {
                hiddenSlides.addClass('no-transition');

                setTimeout(() => {
                    hiddenSlides.addClass('active');

                    setTimeout(() => {
                        hiddenSlides.removeClass('no-transition');
                        onExpanded();
                    }, domPropagationTimeout);
                }, domPropagationTimeout);
            } else {
                if (hiddenSlides.length > 0) {
                    setTimeout(() => {
                        $(hiddenSlides[0]).addClass('active');

                        setTimeout(() => {
                            /* Keep expanding. */
                            this.expand(false, true);
                        }, 100);
                    }, 0);
                } else {
                    onExpanded();
                }
            }
        }

        /**
         * Returns the title of a given slide as HTML string.
         * @param {object} slide Slide.
         */
        public getSlideTitle(slide: Models.Slide): string {
            var ret = '';

            if (slide) {
                ret = slide.title();

                if (!ret || !ret.length) {
                    ret = '[' + Ifly.App.getInstance().components['SlideManager'].terminology.noTitle.toLowerCase() + ']';
                } else {
                    ret = Ifly.Utils.Input.htmlEncode(ret);
                }

                ret = '<small>' + ret + '</small>';
            }

            return ret;
        }

        /**
         * Returns a slide by its Id.
         * @param {number} id Slide Id.
         */
        public findSlideById(id: number): Ifly.Models.Slide {
            var ret = null, slides = [];

            if (id > 0) {
                slides = this.editor.presentation.slides();

                for (var i = 0; i < slides.length; i++) {
                    if (slides[i].id() == id) {
                        ret = slides[i];
                        break;
                    }
                }
            } 

            return ret;
        }

        /**
         * Finds the given slide by its zero-based index.
         * @param {number} index Zero-based index of a slide.
         */
        public findSlideByIndex(index: number): Ifly.Models.Slide {
            var ret = null, slides = this.editor.presentation.slides();

            if (index >= 0 && index < slides.length) {
                ret = slides[index];
            }

            return ret;
        }

        /** Makes slides sortable. */
        private makeSlidesSortable() {
            var slideList = this.editor.container.find('.slide-list-contents'),
                draggingCssClass = 'slide-dragging', updateTimeout = null;

            if (!slideList.hasClass('draggables-initialized')) {
                slideList.off('dragstart.ifly dragend.ifly').on('dragstart.ifly', e => {
                    slideList.addClass(draggingCssClass);
                }).on('dragend.ifly', e => {
                    slideList.removeClass(draggingCssClass);
                });

                new window['Sortable'](slideList.get(0), {
                    draggable: 'li',
                    ghostClass: draggingCssClass,
                    ignore: 'img',
                    onUpdate: e => {
                        slideList.removeClass(draggingCssClass);

                        if (updateTimeout) {
                            clearTimeout(updateTimeout);
                        }

                        updateTimeout = setTimeout(() => {
                            var payload = {
                                slideIds: slideList.find('li[data-slide]').toArray()
                                    .map((e, i) => parseInt($(e).attr('data-slide'), 10))
                            };

                            Ifly.App.getInstance().api.post('presentations/' +
                                Ifly.Editor.getInstance().presentation.id() + '/slides/reorder', payload, (success, data) => {
                                    if (data) {
                                        ko.utils.arrayForEach(data.slides || data.Slides || [], (slideOrderMapping: any) => {
                                            var targetSlide = this.findSlideById(slideOrderMapping.slideId || slideOrderMapping.SlideId);

                                            if (targetSlide) {
                                                targetSlide.order(slideOrderMapping.order || slideOrderMapping.Order || 0);
                                            }
                                        });
                                    }

                                    this.editor.dispatchEvent('slidesReordered', {
                                        slides: ko.utils.arrayMap(payload.slideIds, (sId: number) => this.getBasicSlide(this.findSlideById(sId)))
                                    });
                                }, true);
                        }, Ifly.App.getInstance().api.queueFlushTimeout);
                    }
                });

                slideList.addClass('draggables-initialized');
            }
        }

        /**
         * Returns the basic slide data.
         */
        private getBasicSlide(slide: any): Slide {
            var ret = new Ifly.Models.Slide();

            ret.load(typeof (slide.id) === 'function' ? slide.serialize() : slide, true);

            this.prepareSlideForCollaboratorDispatch(ret);

            return ret;
        }

        /**
         * Prepares this slide to be dispatched to collaborators.
         */
        private prepareSlideForCollaboratorDispatch(slide: Slide) {
            if (slide.playbackTime() == null) {
                slide.playbackTime(0);
            }

            if (!(slide.presentationId() > 0)) {
                slide.presentationId(this.editor.presentation.id());
            }
        }
    }
}