/// <reference path="../../Typings/jquery.d.ts" />

module Ifly.Views.Account {
    /** Represents an account details view. */
    export class AccountDetails {
        private static _instance: AccountDetails;

        /** Gets or sets account details container. */
        public container: JQuery;

        /** Gets or sets the checkout handler. */
        private _checkoutHandler: any;

        /** Gets or sets the button reset timer. */
        private _buttonResetStateTimer: number;

        private _rotators: any;

        /**
         * Initializes the application.
         * @param {object} options Initialization options.
         */
        public initialize(options?: any) {
            this._rotators = {};

            this.container = $('.account-details');

            this.container.find('#account-details-save').click(e => { this.save(); })
            this.container.find('.validatable input, .validatable textarea, .validatable select').change(e => { this.toggleValidationMessage(e.target, true); });
            this.container.find('.info-bar').click(e => {
                var t = $(e.target);

                if (!t.hasClass('info-bar')) {
                    t = t.parents('.info-bar');
                }

                if (!t.hasClass('sticky')) {
                    t.remove();
                }
            });

            var plan = this.container.find('input[name="user-plan"]').change(e => {
                this.onSubscriptionTypeChanged(parseInt((<any>e).target.value, 10));
            });

            var duration = this.container.find('#user-plan-duration input');

            if (window['StripeCheckout'] != null) {
                this._checkoutHandler = window['StripeCheckout'].configure({
                    //key: 'pk_test_4a2zBJghEZyrvyQrOUqgVXjn',
                    key: 'pk_live_4a2z8CFB6LO2ZHtWt3cZz6Gs',
                    image: 'https://spritesapp.com/Assets/img/sprites-128x128.jpg',
                    token: (token) => {
                        this.setFormIsBusy(true);

                        $('<form method="post" />').attr('action', '/account/readytocharge')
                            .append($('<input type="hidden" />').attr('name', 'SubscriptionType').val(plan.filter(':checked').val()))
                            .append($('<input type="hidden" />').attr('name', 'Duration').val(duration.filter(':checked').val()))
                            .append($('<input type="hidden" />').attr('name', 'stripeToken').val(token.id))
                            .appendTo(document.body)
                            .submit();
                    }
                });
            }

            var paymentMethodModal = Ifly.Views.Account.PaymentMethodModal.getInstance();

            paymentMethodModal.addEventListener('paymentMethodSelected', (sender, e) => {
                if (e.method === 'stripe') {
                    this._checkoutHandler.open({
                        name: 'Sprites',
                        description: e.paymentInformation.Description,
                        amount: e.paymentInformation.Amount
                    });
                } else if (e.method === 'paypal') {
                    $('form.paypal-button').submit();
                }
            });

            paymentMethodModal.addEventListener('paymentInformationAvailable', (sender, e) => {
                var ppScript = <HTMLScriptElement>document.getElementById('paypal-button-script'),
                    buttonHostedId = '';

                if (ppScript) {
                    ppScript.parentNode.removeChild(ppScript);
                }

                if (e.paymentInformation.SubscriptionType == 1) {
                    if (e.paymentInformation.Duration == 0) {
                        buttonHostedId = 'BFRZTDQQTWA4Y';
                    } else if (e.paymentInformation.Duration == 1) {
                        buttonHostedId = 'NJS4SQ3NDEHWY';
                    }
                } else if (e.paymentInformation.SubscriptionType == 2) {
                    if (e.paymentInformation.Duration == 0) {
                        buttonHostedId = 'MEU24NJ5QX57C';
                    } else if (e.paymentInformation.Duration == 1) {
                        buttonHostedId = 'K9WAJSWE6ERKU';
                    }
                }

                // Sandbox:
                //if (e.paymentInformation.SubscriptionType == 1) {
                //    buttonHostedId = '6SUVAHQSNXM9A';
                //} else if (e.paymentInformation.SubscriptionType == 2) {
                //    buttonHostedId = 'XQJBUVQBML9SA';
                //}

                $('.paypal-button').remove();

                ppScript = document.createElement('script');

                ppScript.async = true;
                ppScript.id = 'paypal-button-script';
                ppScript.src = '/Assets/js/paypal-button.min.js?merchant=GZUDW5GS2XPQQ';
                ppScript.setAttribute('data-button', 'buynow');
                ppScript.setAttribute('data-type', 'form');
                ppScript.setAttribute('data-name', e.paymentInformation.Description);
                ppScript.setAttribute('data-amount', parseInt((e.paymentInformation.Amount / 100).toString(), 10) + '.00');
                ppScript.setAttribute('data-hosted_button_id', buttonHostedId);
                
                ppScript.setAttribute('data-callback', 'https://spritesapp.com/account/paid-with-paypal?userId=' + e.paymentInformation.UserId +
                    '&subscriptionType=' + e.paymentInformation.SubscriptionType + '&duration=' + e.paymentInformation.Duration + '&amount=' + e.paymentInformation.Amount);

                // Sandbox:
                //ppScript.src = '/Assets/js/paypal-button.min.js?merchant=nata.fareast-facilitator@gmail.com';
                //ppScript.setAttribute('data-env', 'sandbox');

                document.body.appendChild(ppScript);
            });

            this.onResize();
            $(window).resize(() => this.onResize());

            try {
                Ifly.Views.Account.PaymentMethodModal.getInstance().initialize();
            } catch (ex) { }

            this.rotate('#signup .rotator');
        }

        public rotate(container: string, active?: string, highlight?: boolean) {
            var c = $(container), elements = c.find('> *'), index = 0,
                clearRotation = () => { clearTimeout(this._rotators[container]); },
                continueRotation = () => {
                    this._rotators[container] = setTimeout(() => {
                        this.rotate(container, null);
                    }, 5000);
                };

            clearRotation();

            if (!$(document.body).hasClass('account')) {
                if (!c.hasClass('rotating')) {
                    c.addClass('rotating').attr('data-rotating-next', '0')
                        .mouseenter(() => { clearRotation(); })
                        .mouseleave(() => { continueRotation(); });

                    this.rotate(container, active);
                } else {
                    c.toggleClass('highlight', !!highlight);

                    if (active) {
                        for (var i = 0; i < elements.length; i++) {
                            if ($(elements[i]).hasClass(active)) {
                                index = i;
                                break;
                            }
                        }
                    } else {
                        index = parseInt(c.attr('data-rotating-next'), 10);

                        if (index >= elements.length) {
                            index = 0;
                        }
                    }

                    for (var i = 0; i < elements.length; i++) {
                        (elm => {
                            if (i == index) {
                                elm.show();

                                setTimeout(() => {
                                    elm.addClass('active');
                                }, 15);
                            } else {
                                elm.hide();

                                setTimeout(() => {
                                    elm.removeClass('active');
                                }, 15);
                            }
                        })($(elements[i]));
                    }

                    c.attr('data-rotating-next', (index + 1).toString());

                    continueRotation();
                }
            }
        }

        /** Occurs when page is resized. */
        public onResize() {
            var wrapper = $('#wrapper'), height = 0, mt = 0, footer = $('#footer');

            if (this.container.length && !this.container.hasClass('signup-details')) {
                height = this.container.outerHeight();
                mt = parseInt(<any>((wrapper.outerHeight() - height) / 2), 10);

                if (mt < 20) {
                    mt = 20;

                    footer.hide();
                } else {
                    footer.show();
                }

                this.container.css({ marginTop: (mt + 40) + 'px' });
            }
        }

        /** 
         * Saves changes to account details.
         * @param {object} params Optional parameters.
         */
        public save(params?: any) {
            if (this.validate()) {
                this.updateDetails(params);
            }
        }

        /** 
         * Loads the data.
         * @param {object} data Data.
         */
        public load(data: any) {
            var setValue = (p, ov?, vali?) => {
                var f = $('#user-' + p);

                if (f && f.length) {
                    f.val((typeof (ov) !== 'undefined' && ov !== null) ? ov.toString() : (data[p] || ''));
                }

                if (typeof (vali) === 'undefined' || vali === null || vali === true) {
                    this.toggleValidationMessage(this.container.find('.account-details-' + p), true);
                }
            }, hasField = (p) => {
                return $('#user-' + p).length > 0;
            }, signUpSubscriptionType = 0;

            data = data || {};

            setValue('name');
            setValue('email');
            setValue('password');

            if (hasField('signup-subscription-type')) {
                if (typeof (data.signUpSubscriptionType) !== 'undefined' || data.signUpSubscriptionType !== null) {
                    signUpSubscriptionType = parseInt(data.signUpSubscriptionType, 10);
                    setValue('signup-subscription-type', data.signUpSubscriptionType, false);
                } else {
                    setValue('signup-subscription-type', '', false);
                }

                if (isNaN(signUpSubscriptionType)) {
                    signUpSubscriptionType = 0;
                }

                $('#user-plan input').each((i, e) => {
                    (<any>e).checked = parseInt((<any>e).value, 10) === signUpSubscriptionType;
                });
            }

            $('#account-details-save').removeAttr('disabled')
        }

        /** Validates account details and returns value indicating whether they're valid. */
        public validate(): boolean {
            var isNameValid = this.toggleValidationMessage(this.container.find('.account-details-name')),
                isEmailValid = this.toggleValidationMessage(this.container.find('.account-details-email')),
                isPasswordValid = this.toggleValidationMessage(this.container.find('.account-details-password'));

            return isNameValid && isEmailValid && isPasswordValid;
        }

        /** 
         * Triggers form's "busy" state.
         * @param {boolean} isBusy Value indicating whether form is busy.
         */
        public setFormIsBusy(isBusy: boolean) {
            var submit = $('#account-details-save'),
                name = $('#user-name'),
                email = $('#user-email'),
                password = $('#user-password'),
                companyName = $('#company-name'),
                companyAddress = $('#company-address'),
                plan = $('#user-plan input'),
                fields = [submit, name, email, password, companyName, companyAddress, plan];

            if (isBusy) {
                $.each(fields, (i, v) => v.attr('disabled', 'disabled'));
                submit.val(submit.attr('data-text-busy'));
            } else {
                $.each(fields, (i, v) => {
                    if (i != 0 && !v.hasClass('always-disabled')) {
                        v.removeAttr('disabled');
                    }
                });
            }
        }

        /**
         * Validates user email.
         * @param {Function} onComplete A callback which is executed when validation completes.
         */
        public validateEmail(onComplete: (isValid: boolean) => any) {
            var email = $('#user-email');

            $.ajax('/pre-update-email', {
                type: 'post',
                data: {
                    email: email.val()
                },
                complete: (xhr) => {
                    onComplete((xhr.responseText || '') == 'true');
                }
            });
        }

        /** 
         * Updates account details.
         * @param {object} params Optional parameters.
         */
        public updateDetails(params?: any) {
            var app = Ifly.App.getInstance(),
                submit = $('#account-details-save'),
                name = $('#user-name'),
                email = $('#user-email'),
                password = $('#user-password'),
                companyName = $('#company-name'),
                companyAddress = $('#company-address'),
                plan = $('#user-plan input'),
                signUpSubscriptionType = $('#user-signup-subscription-type'),
                emailValidated = null,
                completed = (xhr) => {
                    var paymentInfo = null;

                    this.setFormIsBusy(false);

                    submit.val(submit.attr('data-text-success'));

                    if (this._buttonResetStateTimer) {
                        clearTimeout(this._buttonResetStateTimer);
                    }

                    this._buttonResetStateTimer = setTimeout(() => {
                        submit.val(submit.attr('data-text-normal')).removeAttr('disabled');
                    }, 2000);

                    try {
                        paymentInfo = typeof (xhr) == 'string' ? $.parseJSON(xhr) :
                            (xhr && typeof(xhr.responseText) == 'string' ? $.parseJSON(xhr.responseText) : xhr);
                    } catch (ex) { }

                    if (paymentInfo != null && paymentInfo.Info && paymentInfo.Info[0].RequiresPayment) {
                        Ifly.Views.Account.PaymentMethodModal.getInstance().show({
                            paymentInformation: paymentInfo
                        });
                    } 

                    if (params.onComplete) {
                        params.onComplete(xhr);
                    }
                };

            params = params || {};

            emailValidated = (isValid: boolean) => {
                if (isValid) {
                    $.ajax(params.url || '/account', {
                        type: 'post',
                        data: {
                            name: app.htmlEncode(name.val()),
                            email: app.htmlEncode(email.val()),
                            password: app.htmlEncode(password.val()),
                            companyName: app.htmlEncode(companyName.val()),
                            companyAddress: app.htmlEncode(companyAddress.val()),
                            subscriptionType: parseInt(plan.filter(':checked').val(), 10) || 0,
                            signUpSubscriptionType: signUpSubscriptionType.length > 0 ? signUpSubscriptionType.val() : ''
                        },
                        success: completed,
                        error: completed
                    });
                } else {
                    this.setFormIsBusy(false);
                    submit.val(submit.attr('data-text-normal')).removeAttr('disabled');

                    this.toggleValidationMessage(this.container.find('.account-details-email'), false,
                        '.existing-email'); 
                }
            };

            this.setFormIsBusy(true);

            if (params.url) {
                emailValidated(true);
            } else {
                this.validateEmail(emailValidated);
            }
        }

        /** 
         * Occurs when subscription type changes.
         * @param {number} subscriptionType Subscription type.
         */
        public onSubscriptionTypeChanged(subscriptionType: number) {
            var cmd = $('#account-details-save'), isPaidCustomer = subscriptionType != 0,
                subscriptionExpiring = $('#account-subscription-expiring').val() == 'true',
                paymentsEnabled = $('#account-payments-enabled').val() == 'true';

            $('#user-signup-subscription-type').val(subscriptionType.toString());

            cmd.val(cmd.attr('data-text-' + ((isPaidCustomer && paymentsEnabled && (subscriptionExpiring ||
                !$('.payment-history table .payment-receipt-row').length)) ? 'pay' : 'normal')));

            $('.user-plan-options').toggleClass('double-line', !isPaidCustomer)
                .find('div').toggle(!isPaidCustomer);
        }

        /** 
         * Toggles validation message visibility on the given input(s).
         * @param {object} target Target DOM element.
         * @param {boolean} isValid Value indicating whether the given field is valid.
         * @param {string} filter Filter for messages.
         */
        public toggleValidationMessage(target: any, isValid?: boolean, filter?: string) {
            var row = (t => { return t.hasClass('validatable') ? t : t.parents('.validatable'); })($(target)),
                trim = (s: string) => { return (s || '').replace(/^\s+|\s+$/g, ''); },
                hasValue = (input: JQuery) => {
                    var v = input.val();
                    return v != null && trim(v).length > 0;
                }, input = row.find('input, textarea, select, .form-input'),
                validationMessages = row.find('.form-field-label i.validation-message');

            if (typeof (isValid) == 'undefined' || isValid == null) {
                isValid = !input.length || input.attr('disabled') != null || hasValue(input);
            }
            
            input.toggleClass('invalid', !isValid);

            validationMessages.addClass('hidden');

            row.find('.form-field-label label').toggleClass('invalid', !isValid);
            row.find('.form-field-label span').toggleClass('hidden', !isValid);
            (filter ? validationMessages.filter(filter) : validationMessages.not('.conditional')).toggleClass('hidden', isValid);

            return isValid;
        }

        /** Returns an instance of the current view. */
        public static getInstance(): AccountDetails {
            if (!this._instance) {
                this._instance = new AccountDetails();
            }

            return this._instance;
        }
    }

    Ifly.App.getInstance().addEventListener('loaded', () => {
        Ifly.Views.Account.AccountDetails.getInstance().initialize();
    });
} 