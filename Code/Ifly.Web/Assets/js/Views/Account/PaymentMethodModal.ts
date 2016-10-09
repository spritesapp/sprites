/// <reference path="../../Typings/jquery.d.ts" />

module Ifly.Views.Account {
    /** Represents a login view. */
    export class PaymentMethodModal extends Ifly.EventSource {
        private static _instance: PaymentMethodModal;

        /** Gets or sets payment information. */
        public paymentInformation: any;

        /**
         * Initializes the application.
         * @param {object} options Initialization options.
         */
        public initialize(options?: any) {
            var onSelectedPaymentMethodChanging = () => {
                setTimeout(() => {
                    $('.payment-method-selector .modal-buttons .primary')
                        .hide().filter('#btn-pay-' + this.getSelectedPaymentMethod()).show();
                }, 50);
            };

            setTimeout(() => {
                $('.payment-method-selector ul.payment-methods input[type="radio"]').change(onSelectedPaymentMethodChanging);
                $('.payment-method-selector ul.payment-methods label').click(onSelectedPaymentMethodChanging);
            }, 100);

        }

        /** Begins applying payment. */
        public beginApplyPayment() {
            this.dispatchEvent('paymentMethodSelected', {
                method: this.getSelectedPaymentMethod(),
                paymentInformation: this.resolvePaymentInformationForSelectedDuration()
            });

            this.hide();
        }

        /**
         * Resolves payment information for the selected duration.
         */
        public resolvePaymentInformationForSelectedDuration(): any {
            var ret = null, selectedDuration = parseInt($('#user-plan-duration input').filter(':checked').val(), 10);

            if (this.paymentInformation && this.paymentInformation.Info) {
                for (var i = 0; i < this.paymentInformation.Info.length; i++) {
                    if (this.paymentInformation.Info[i].Duration == selectedDuration) {
                        ret = this.paymentInformation.Info[i];
                        break;
                    }
                }
            }

            return ret;
        }

        /** Returns selected payment method. */
        public getSelectedPaymentMethod() {
            return $('.payment-method-selector ul.payment-methods input[type="radio"]:checked').val();
        }

        /** Returns an instance of the current view. */
        public static getInstance(): PaymentMethodModal {
            if (!this._instance) {
                this._instance = new PaymentMethodModal();
            }

            return this._instance;
        }

        /** Resets the modal. */
        public reset() {
            this.paymentInformation = null;

            $('.payment-method-selector ul.payment-methods input[type="radio"]').each((i, e) => {
                (<any>e).checked = false;
            });

            $('.payment-duration-selector ul.payment-durations input[type="radio"]').each((i, e) => {
                (<any>e).checked = false;
            });

            $('.payment-method-selector .modal-buttons .primary').hide();
        }

        /** 
         * Shows the modal.
         * @param {object} params Parameters.
         */
        public show(params) {
            var m = $('#choose-payment-method');

            m.addClass('modal-show');
            Ifly.App.getInstance().repositionModal(m);

            $('.modal-overlay').addClass('modal-show');

            this.reset();

            if (params) {
                if (params.paymentInformation) {
                    this.paymentInformation = params.paymentInformation;
                }
            }

            this.ensurePaymentInformation(() => {
                var findMatchingPaymentInformation = (duration: number) => {
                    var result = null, info = [];

                    if (this.paymentInformation && (info = (this.paymentInformation.Info || this.paymentInformation.info)) != null) {
                        for (var i = 0; i < info.length; i++) {
                            if (parseInt(info[i].Duration || info[i].Duration, 10) == duration) {
                                result = info[i];
                                break;
                            }
                        }
                    }

                    return result;
                },
                formatAmount = (paymentInformation, note?: boolean) => {
                    return paymentInformation ? (' ' + (note ? '(' : '') + '$' + (parseInt(paymentInformation.Amount || paymentInformation.amount, 10) / 100) + (note ? ')' : ' ')) : (note ? '' : ' ');
                },
                updateDurationCostOnButton = () => {
                    var buttons = $('#choose-payment-method button.primary'),
                        selectedDuration = $('#user-plan-duration input').filter(':checked').val(),
                        matchingSelectedPaymentInformation = findMatchingPaymentInformation(selectedDuration);

                    buttons.each((i, e) => {
                        $(e).find('span').text(formatAmount(matchingSelectedPaymentInformation));
                    });
                },

                paymentChangeDurationThrottle = null,

                onPaymentDurationChanged = () => {
                    clearTimeout(paymentChangeDurationThrottle);

                    paymentChangeDurationThrottle = setTimeout(() => {
                        updateDurationCostOnButton();

                        this.dispatchEvent('paymentInformationAvailable', {
                            paymentInformation: this.resolvePaymentInformationForSelectedDuration()
                        });
                    }, 15);
                };

                $('#user-plan-duration input + label').each((i, e) => {
                    var $label = $(e), $input = $label.prev('input'),
                        duration = parseInt($input.val()),
                        matchingPaymentInformation = null;
                        
                    matchingPaymentInformation = findMatchingPaymentInformation(duration);

                    $label.find('span').text(formatAmount(matchingPaymentInformation, true));

                    $label.off('click').on('click', onPaymentDurationChanged);
                    $input.off('change').on('change', onPaymentDurationChanged);
                });

                onPaymentDurationChanged();
            });
        }

        /** Hides the modal. */
        public hide() {
            this.reset();
            
            $('#choose-payment-method').removeClass('modal-show');
            $('.modal-overlay').removeClass('modal-show');
        }

        /** 
         * Ensures that the payment information is loaded.
         * @param {Function} complete A callback.
         */
        private ensurePaymentInformation(complete?: (info: any) => any) {
            var callback = () => {
                (complete || function () { })(this.paymentInformation);
            };
                
            complete = complete || function () { };

            if (this.paymentInformation) {
                callback();
            } else {
                $.post('/Account/GetPaymentInformation', data => {
                    this.paymentInformation = data;

                    callback();
                });
            }
        }
    }
}