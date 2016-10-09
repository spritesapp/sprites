/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="Component.ts" />

module Ifly.Models.UI {
    /** Represents a publish manager. */
    export class PublishManager extends Component {
        /** 
         * Initializes a new instance of an object.
         * @param {object} editor Editor instance.
         */
        constructor(editor: Ifly.Editor) {
            super(editor);
        }

        /** 
         * Opens modal for editing.
         * @param {object} data Settings to edit.
         */
        public editSettings(settings: any) {
            Ifly.Models.UI.PublishSettingsModal.getInstance().open(typeof (settings.serialize) == 'function' ? settings.serialize() : settings);
        }

        /** 
         * Occurs when presentation settings get updated.
         * @param {object} settings Settings.
         */
        public onSettingsUpdated(settings: any, key?: string) {
            this.editor.presentation[key || 'publishSettings']().load(settings);
        }
    }
}