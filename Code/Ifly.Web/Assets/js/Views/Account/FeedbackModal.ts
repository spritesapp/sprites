/// <reference path="../../Typings/jquery.d.ts" />

module Ifly.Views.Account {
    /** Represents a feedback modal. */
    export class FeedbackModal extends Ifly.EventSource {
        private static _instance: FeedbackModal;

        /** Begins applying payment. */
        public submit() {
            $('.feedback-modal input, .feedback-modal textarea, .feedback-modal button').attr('disabled', 'disabled');

            $('.feedback-modal button.primary').each((i, e) => {
                var $e = $(e);
                $e.text($e.attr('data-text-sending'));
            });

            $.post('/contact', {
                name: $('.feedback-modal #feedback-name').val(),
                email: $('.feedback-modal #feedback-email').val(),
                text: $('.feedback-modal #feedback-text').val()
            }, () => {
                this.hide();
            });
        }
        
        /** Returns an instance of the current view. */
        public static getInstance(): FeedbackModal {
            if (!this._instance) {
                this._instance = new FeedbackModal();
            }

            return this._instance;
        }

        /** Resets the modal. */
        public reset() {
            $('.feedback-modal input, .feedback-modal textarea, .feedback-modal button').removeAttr('disabled');

            $('.feedback-modal textarea').val('');

            $('.feedback-modal button.primary').each((i, e) => {
                var $e = $(e);
                $e.text($e.attr('data-text-normal'));
            });

            $('.feedback-modal *[data-default-value]').each((i, e) => {
                var $e = $(e);
                $e.val($e.attr('data-default-value'));
            });
        }

        /** 
         * Shows the modal.
         */
        public show() {
            var m = $('#feedback-modal');

            m.addClass('modal-show');
            Ifly.App.getInstance().repositionModal(m);

            $('.modal-overlay').addClass('modal-show');

            this.reset();
        }

        /** Hides the modal. */
        public hide() {
            this.reset();
            
            $('#feedback-modal').removeClass('modal-show');
            $('.modal-overlay').removeClass('modal-show');
        }
    }
}