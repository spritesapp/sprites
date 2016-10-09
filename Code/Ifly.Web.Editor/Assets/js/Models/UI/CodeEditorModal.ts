/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />
/// <reference path="DataTableView.ts" />

module Ifly.Models.UI {
    /** Represents a code editor modal. */
    export class CodeEditorModal extends ModalForm<ModalData> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: CodeEditorModal;

        /** Gets or sets the code editor. */
        public editor: CodeEditor;

        /** Gets or sets an optional callback that is called when editor text is saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#code-editor', () => {
                return new ModalData();
            });

            this.editor = new CodeEditor();
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['CodeEditorModal'],
                editorContainer = this.container.find('.code-editor-contents'),
                revertView = (action) => {
                    action();

                    setTimeout(() => {
                        editorContainer.removeClass('code-editor-visible');
                    }, 150);
                };

            if (!editorContainer.children().length) {
                this.editor.initialize(editorContainer);
            }

            super.load(data);
            this.editor.value(data ? Utils.Input.javascriptDecode(data.text || data.Text || '') : '');

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    buttons: [
                        {
                            text: c.terminology.save,
                            click: () => { revertView(() => this.save()); }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { revertView(() => this.cancel()); }
                        }
                    ]
                });

                this.modal.addEventListener('closed', () => {
                    revertView(() => { });
                });
            } else {
                this.modal.updateButtons();
                this.modal.open();
            }

            setTimeout(() => {
                editorContainer.addClass('code-editor-visible');
            }, 850);

            Ifly.App.getInstance().trackEvent('discover', 'widget editor');
        }

        /** Saves the data. */
        public save() {
            Ifly.App.getInstance().trackEvent('act', 'widget editor');

            if (this._saved) {
                this._saved({ text: Utils.Input.javascriptEncode(this.editor.value()) });
                this._saved = null;
            }

            this.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): CodeEditorModal {
            if (!this._instance) {
                this._instance = new CodeEditorModal();
            }

            return this._instance;
        }
    }
} 