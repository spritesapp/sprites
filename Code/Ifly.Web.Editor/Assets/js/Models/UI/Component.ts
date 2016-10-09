/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />

module Ifly.Models.UI {
    /** Represents an editor component. */
    export class Component extends Ifly.EventSource {
        /** Gets or sets the editor instance. */
        public editor: Ifly.Editor;

        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super();

            this.editor = editor;
        }
    }
}