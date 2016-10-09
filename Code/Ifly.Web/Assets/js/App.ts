/// <reference path="Typings/jquery.d.ts" />

module Ifly {
    /** Represents an event source. */
    export class EventSource {
        private _callbacks: any;

        /** Initializes a new instance of an object. */
        constructor() {
            this._callbacks = {};
        }

        /** 
         * Subscribes to a given event.
         * @param {string} eventName Event name.
         * @param {Function} callback Callback to execute.
         */
        public addEventListener(eventName: string, callback: Function) {
            var evt = (eventName || '').toLowerCase();

            if (callback) {
                if (!this._callbacks[evt]) {
                    this._callbacks[evt] = [];
                }

                this._callbacks[evt].push(callback);
            }
        }

        /** 
         * Dispatches the given event to all subscribers.
         * @param {string} eventName Event name.
         * @param {object} args Event arguments.
         */
        public dispatchEvent(eventName: string, args?: any) {
            var e = args || {};
            var evt = (eventName || '').toLowerCase();

            if (this._callbacks[evt]) {
                for (var i = 0; i < this._callbacks[evt].length; i++) {
                    this._callbacks[evt][i](this, e);
                }
            }
        }
    }

    /** Represents an application. */
    export class App extends EventSource {
        private static _instance: App;

        private _ready: boolean;
        private _readyInternal: Function;
        private _popstateInitalFired: boolean;
        private _isUpdatingNavigation: boolean;

        private _moreButtonOffsets: any;

        /** Initializes a new instance of an object. */
        constructor() {
            super();
        }

        /**
         * Initializes the application.
         * @param {object} options Initialization options.
         */
        public initialize(options?: any) {
            var body = null;

            this.dispatchEvent('loading');

            $(document).ready(() => {
                var ticker = $('#ticker');

                $('#cookie-warning').toggleClass('unseen',
                    this.getCookieValue('Ifly.CookieWarningAcknowledged') != 'true');

                $('#login-wp-email').add($('#login-wp-password')).change(e => {
                    $(e.target).removeClass('invalid');
                });

                this.tryShowInfoBar();

                ticker.mousedown(e => {
                    var t = $(e.target), tag = ((<any>e.target).tagName ||
                        (<any>e.target).nodeName || '').toLowerCase(), cmd = ticker.find('.button');

                    if (tag == 'a') {
                        location.href = t.attr('href');
                    } else if ((t.hasClass('button') || t.parents('.button').length) && cmd.is(':focus')) {
                        cmd.blur();
                        e.preventDefault();
                    } else if ((!t.hasClass('news-and-updates') || !t.parents('.news-and-updates').length)) {
                        cmd.focus();
                    }
                });

                this.dispatchEvent('loaded');
            });

            window.onbeforeunload = () => {
                this.trackEvent('leave');
            };

            window.onload = () => {
                if (!this._ready) {
                    body = $(document.body);

                    if (body.hasClass('landing')) {
                        this.onResize();
                        this.updateNavigation();
                    }

                    setTimeout(() => {
                        body.removeAttr('style').addClass('active');

                        if (body.hasClass('account')) {
                            $('nav.primary').addClass('section-next-immediate');
                        }

                        this.dispatchEvent('ready');

                        setTimeout(() => {
                            if (!this._popstateInitalFired) {
                                this.pathChanged(null, false);
                            }
                        }, 750);

                        setTimeout(() => {
                            this._ready = true;

                            if (this._readyInternal) {
                                this._readyInternal();
                            }
                        }, 500);
                        
                        setTimeout(() => {
                            $('.section-next').addClass('section-next-immediate');
                        }, 2000);
                    }, 10);
                }
            };

            window.onpopstate = () => { this._popstateInitalFired = true; this.pathChanged(null, false); };
            window.onresize = () => { if (body.hasClass('landing')) this.onResize(); };
            //window.onscroll = () => {
            //    if (!this._isUpdatingNavigation) {
            //        requestAnimationFrame(() => {
            //            this._isUpdatingNavigation = true;
            //            this.updateNavigation();
            //            this._isUpdatingNavigation = false;
            //        });
            //    }
            //};

            $(document.body).keyup((e) => {
                var code = e.keyCode || e.charCode || e.which;

                if (code == 27) {
                    if ($('.features-detailed').hasClass('active')) {
                        this.featuresDetailedInternal('hide');
                    } else if ($('.modal-show').length > 0) {
                        this.revert();
                    }

                    if ($('.pricing-faq').hasClass('active')) {
                        this.pricingFAQInternal('hide');
                    } else if ($('.modal-show').length > 0) {
                        this.revert();
                    }
                }
            });

            $('.features-detailed .close').click(() => {
                this.featuresDetailedInternal('hide');
            });

            $('.pricing-faq .close').click(() => {
                this.pricingFAQInternal('hide');
            });

            $('#newsletter-email').keydown(e => {
                if (e.keyCode == 13) {
                    e.preventDefault();

                    this.trySubscribeToNewsletter();
                }
            });

            $('#newsletter-subscribe').click(this.trySubscribeToNewsletter);
        }

        /** Begins logging in or resetting the password. */
        public loginOrResetPassword() {
            if ($('.login-oauth input[type="password"]:visible').length) {
                this.loginWithPassword();
            } else {
                this.resetPassword();
            }
        }

        /** Performs a login with password. */
        public loginWithPassword() {
            var btn = $('#login-wp-login'),
                email = $('#login-wp-email'),
                password = $('#login-wp-password'),
                fields = [email, password, btn],
                returnUrl = /(\?|&)ReturnUrl=([^&]+)/gi.exec(location.href || '');

            password.removeClass('invalid');

            if (email.val() && email.val().length && password.val() && password.val().length) {
                $.each(fields, (i, v) => v.attr('disabled', 'disabled'));

                this.trackEvent('login', 'attempt');

                $.ajax('/account/login', {
                    type: 'post',
                    data: {
                        'LoginWithPassword': true,
                        'LoginWithPassword.Email': email.val(),
                        'LoginWithPassword.Password': password.val()
                    },
                    complete: xhr => {
                        if (xhr.status == 401 || xhr.status == 500) {
                            this.trackEvent('login', 'failure');

                            password.val('').addClass('invalid');
                            $.each(fields, (i, v) => v.removeAttr('disabled'));
                        } else {
                            location.href = (returnUrl && returnUrl.length > 2 ? decodeURIComponent(returnUrl[2]) : '/edit');
                        }
                    }
                });
            }
        }

        /** Resets password. */
        public resetPassword() {
            var btn = $('#login-wp-login'),
                email = $('#login-wp-email'),
                emailSent = $('.login-oauth .row.mode-reset .mode-reset-sent'),
                fields = [email, btn];

            email.removeClass('invalid');
            emailSent.hide().removeClass('active');

            if (email.val() && email.val().length) {
                $.each(fields, (i, v) => v.attr('disabled', 'disabled'));

                $.ajax('/account/login', {
                    type: 'post',
                    data: {
                        'ResetPassword': true,
                        'LoginWithPassword.Email': email.val()
                    },
                    complete: xhr => {
                        $.each(fields, (i, v) => v.removeAttr('disabled'));
                        email.val('');

                        if (xhr.status == 401 || xhr.status == 500 || xhr.status == 404) {
                            email.addClass('invalid');
                        } else {
                            emailSent.show();

                            setTimeout(() => {
                                emailSent.addClass('active');
                            }, 50);
                        }
                    }
                });
            }
        }

        /** Toggles password reset. */
        public toggleResetPassword() {
            var link = $('.account-links .left'),
                cmd = $('#login-wp-login'),
                login = link.hasClass('mode-login');

            link.toggleClass('mode-login', !login);
            link.toggleClass('mode-reset', login);
            link.text(link.attr(login ? 'data-login-text' : 'data-reset-text'));
            cmd.val(cmd.attr(login ? 'data-reset-text' : 'data-login-text'));

            $('.login-oauth .invalid').removeClass('invalid');
            $('.login-oauth .row.mode-login').toggle(!login);
            $('.login-oauth .row.mode-reset').toggle(login);
            $('.login-oauth .row.mode-reset .mode-reset-sent').hide().removeClass('active');

            setTimeout(() => {
                try {
                    $('#login-wp-email').focus();
                } catch (ex) { }
            }, 50);
        }

        /** Tries to perform a sign-up. */
        public trySignUp() {
            var accountDetails = Ifly.Views.Account.AccountDetails.getInstance(),
                success = $('.signup-success');

            accountDetails.save({
                url: '/account/signup',
                onComplete: (xhr) => {
                    if (accountDetails.toggleValidationMessage(accountDetails.container.find('.account-details-email'),
                        xhr.status != 409, '.existing-email')) {

                        this.trackEvent('signup', 'failure');

                        $('.signup-inprogress').hide();
                        $('#account-details-save').hide();
                        success.show();

                        setTimeout(() => {
                            success.addClass('active');
                        }, 50);
                    } else {
                        $('#account-details-save').removeAttr('disabled');
                        accountDetails.rotate('#signup .rotator', 'upgrade', true);
                    }
                }
            });
        }

        /** Opens the video. */
        public openVideo() {
            this.pathChanged('intro', true);
        }

        /** Occurs when video modal is opened. */
        public onVideoModalOpening() {
            var modal = $('#video-player'), c = modal.find('.video-container');

            modal.addClass('modal-show');
            this.repositionModal(modal, true);

            $('.modal-overlay').addClass('modal-show');

            c.append($('<iframe />').attr({
                src: 'https://www.youtube.com/embed/7jbX8xK5l2Y?autoplay=1&showinfo=0&autohide=1',
                width: c.width(),
                height: c.height(),
                frameborder: 0,
                allowfullscreen: 'true'
            }).css({
                    border: 'none',
                    margin: 'none',
                    padding: 'none',
                    outline: 'none'
                }));
        }

        /** Stops playing the video. */
        public stopVideo() {
            $('#video-player').find('.video-container').empty();
        }

        /** Hides currently active modal window and reverts the application path. */
        public revert() {
            this.pathChanged('/', true, true);
            this.hideModal();
            this.stopVideo();
        }

        /** Scrolls the view to more content. */
        public features() {
            this.pathChanged('features', true);
            this.featuresInternal();
        }

        /** Scrolls the view to more content. */
        private featuresInternal() {
            this.scrollToSection('features');
        }

        /** Displays "features -> Detailed" pop-up. */
        public featuresDetailed() {
            this.pathChanged('features/detailed', true);
            this.featuresDetailedInternal();
        }

        /** 
         * Displays/hides "Features -> Detailed" pop-up.
         * @param {string} method Method. 
         */
        public featuresDetailedInternal(method?: string) {
            var c = $('.features-detailed');

            $(document.body).toggleClass('no-overflow', method !== 'hide');

            if (method === 'hide') {
                c.removeClass('active');

                setTimeout(() => {
                    c.hide();
                }, 310);

                this.pathChanged('features', true);
            } else {
                c.show();

                setTimeout(() => {
                    c.addClass('active');
                }, 15);
            }
        }

        /** Displays "Pricing -> FAQ" pop-up. */
        public pricingFAQ() {
            this.pathChanged('pricing/faq', true);
            this.pricingFAQInternal();
        }

        /** 
         * Displays/hides "Pricing -> FAQ" pop-up.
         * @param {string} method Method. 
         */
        public pricingFAQInternal(method?: string) {
            var c = $('.pricing-faq');

            $(document.body).toggleClass('no-overflow', method !== 'hide');

            if (method === 'hide') {
                c.removeClass('active');

                setTimeout(() => {
                    c.hide();
                }, 310);

                this.pathChanged('pricing', true);
            } else {
                c.show();

                setTimeout(() => {
                    c.addClass('active');
                }, 15);
            }
        }

        /** Scrolls the view to more content. */
        public video() {
            this.pathChanged('video', true);
            this.videoInternal();
        }

        /** Scrolls the view to more content. */
        private videoInternal() {
            this.scrollToSection('video');
        }

        /** Scrolls the view to more content. */
        public examples() {
            this.pathChanged('examples', true);
            this.examplesInternal();
        }

        /** Scrolls the view to more content. */
        private examplesInternal() {
            this.scrollToSection('examples');
        }

        /** Scrolls the view to the "Pricing" section. */
        public pricing() {
            this.pathChanged('pricing', true);
            this.pricingInternal();
        }

        /** Scrolls the view to the "Pricing" section. */
        private pricingInternal() {
            this.scrollToSection('pricing');
        }

        /** Scrolls the view to the "Testimonials" section. */
        public testimonials() {
            this.pathChanged('testimonials', true);
            this.testimonialsInternal();
        }

        /** Scrolls the view to the "Testimonials" section. */
        private testimonialsInternal() {
            this.scrollToSection('testimonials');
        }

        /** Scrolls the view to the "Contact" section. */
        public contact() {
            this.pathChanged('contact', true);
            this.contactInternal();
        }

        /** Scrolls the view to the "Contact" section. */
        private contactInternal() {
            this.scrollToSection('contact');
        }

        /** Scroll to the top of the view. */
        public scrollToTop() {
            this.scrollToSection(null);
        }

        /** 
         * Represents a "Get started" action.
         * @param {object} params Parameters.
         */
        public start(params: any) {
            if (!params.isLoggedIn) {
                this.scrollToTop();
                this.login();
            } else {
                location.href = '/edit';
            }
        }

        /** 
         * Scrolls to top and opens sign up modal.
         * @param {number} subscriptionType Optional subscription type.
         */
        public scrollAndSignUp(subscriptionType?: number) {
            //this.scrollToTop();

            //setTimeout(() => {
                this.signUp(subscriptionType);
            //}, 350);
        }

        /** 
         * Opens the sign-up screen.
         * @param {number} subscriptionType Optional subscription type.
         */
        public signUp(subscriptionType?: number) {
            this.pathChanged('signup', true);

            Ifly.Views.Account.AccountDetails.getInstance().load({
                signUpSubscriptionType: subscriptionType
            });

            $('.signup-inprogress').show();
            $('#account-details-save').show();
            $('.signup-success').hide().removeClass('active');

            setTimeout(() => {
                Ifly.Views.Account.AccountDetails.getInstance().rotate('#signup .rotator', 'signin');
            }, 25);
        }

        /** Opens the login screen. */
        public login() {
            this.pathChanged('login', true);
        }

        /** Acknowledges cookie warning. */
        public acknowledgeCookieWarning() {
            var w = $('#cookie-warning');

            w.removeClass('unseen');
            this.setCookieValue('Ifly.CookieWarningAcknowledged', 'true', 30 * 12);

            $('#global-info-bar').removeClass('global-info-bar-stacked-1');
        }

        /** Tries to subscribe to newsleter. */
        public trySubscribeToNewsletter() {
            var onSubscribed = null,
                email = $('#newsletter-email'),
                button = $('#newsletter-subscribe');

            onSubscribed = () => {
                email.val('');

                button.find('span').text(button.attr('data-text-success'));
                setTimeout(() => { button.find('span').text(button.attr('data-text-normal')); }, 5000);
            };

            if (email.val() && email.val().length) {
                $.ajax('/newsletter-subscribe', {
                    type: 'post',
                    data: {
                        'email': email.val()
                    }
                });
            }

            onSubscribed();
        }

        /** Shows info bar if there's a pending message. */
        public tryShowInfoBar() {
            var infobar = $('#global-info-bar'),
                messageType = '',
                message = this.getQueryStringValue('info');

            if (message && message.length) {
                if (message.indexOf(':') === 1) {
                    messageType = message.substr(0, 1);
                    message = message.substr(2).replace(/\+/gi, ' ');
                }

                infobar.addClass('unseen')
                    .removeClass('.global-info-bar-warning')
                    .find('.global-info-bar-text').text(message);

                if (messageType.toLowerCase() === 'w') {
                    infobar.addClass('global-info-bar-warning');
                }

                if ($('#cookie-warning').hasClass('unseen')) {
                    infobar.addClass('global-info-bar-stacked-1');
                }
            }
        }

        /** Hides info bar. */
        public hideInfoBar() {
            $('#global-info-bar').removeClass('unseen');
        }

        /** Submits the feedback. */
        public submitFeedback() {
            var submit = $('#feedback-submit'),
                name = $('#feedback-name'),
                email = $('#feedback-email'),
                text = $('#feedback-text'),
                sent = $('#feedback-sent'),
                fields = [submit, name, email, text],
                completed = () => {
                    $.each(fields, (i, v) => {
                        v.removeAttr('disabled');

                        if (i > 0) {
                            v.val('');
                        } else {
                            v.val(v.attr('data-text-normal'));
                        }
                    });

                    sent.addClass('visible');
                    setTimeout(() => sent.removeClass('visible'), 5000);
                };

            $.each(fields, (i, v) => v.attr('disabled', 'disabled'));
            submit.val(submit.attr('data-text-busy'));

            $.ajax('/contact', {
                type: 'post',
                data: {
                    name: this.htmlEncode(name.val()),
                    email: this.htmlEncode(email.val()),
                    text: this.htmlEncode(text.val())
                },
                success: completed,
                error: completed
            });
        }

        /**
         * HTML-encodes the given string.
         * @param {string} t Input string.
         */
        public htmlEncode(t: string): string {
            var ret = t || '';

            ret = ret.replace(new RegExp('&', 'g'), '&amp;');
            ret = ret.replace(new RegExp('<', 'g'), '&lt;');
            ret = ret.replace(new RegExp('>', 'g'), '&gt;');

            return ret;
        }

        /** 
         * Hides the modal window.
         * @param {JQuert} modal Modal to hide.
         * @param {boolean} keepBackground Value indicating whether to keep background overlay visible.
         */
        private hideModal(modal?: JQuery, keepBackground?: boolean) {
            if (!modal) {
                $('.modal-show').removeClass('modal-show');
            } else {
                modal.removeClass('modal-show');
            }

            if (!keepBackground) {
                $('.modal-overlay').removeClass('modal-show');
            }
        }

        /**
         * Scrolls the view to the given section.
         * @param {string} id Section Id.
         */
        private scrollToSection(id?: string) {
            $('html, body').animate({
                scrollTop: id && id.length ? ($('#' + id).offset().top + 1) : 0
            }, 300);
        }

        /** Occurs when window gets resized. */
        private onResize() {
            this.resizeSections();
            this.repositionModal();
        }

        /** Resizes the cover image. */
        private resizeSections() {
            var $win = $(window), h = $win.innerHeight(), w = $win.innerWidth(), footerHeight = $('#footer').outerHeight(),
                cover = $('#cover'), features = $('#features'), video = $('#video'), examples = $('#examples'), pricing = $('#pricing'), testimonials = $('#testimonials'), contact = $('#contact'), featuresPitch = $('#features .pitch'),
                videoInner = $('#video .video-inner'), pricingInner = $('#pricing .pricing-inner'), testimonialsInner = $('#testimonials .testimonials-inner'), examplesInner = $('#examples .examples-inner'), contactInner = $('#contact .contact-inner'),
                videoNextElement = $('.section-next-video'), pitchNextElement = $('.section-next-pitch'), contactNextElement = $('.section-next-contact'), examplesNextElement = $('.section-next-examples'),
                pricingNextElement = $('.section-next-pricing'), testimonialsNextElement = $('.section-next-testimonials'),
                videoPaddingTop = '0px', featuresPaddingTop = '0px', pricingPaddingTop = '0px', examplesPaddingTop = '0px', testimonialsPaddingTop = '0px', contactPaddingTop = '0px';

            if (w >= 1024) {
                $('#cover, #features, #video, #examples, #pricing, #testimonials').height(h + 2);
                contact.height(h - footerHeight);

                featuresPaddingTop = ((h / 2) - (featuresPitch.outerHeight() / 2) - 25) + 'px';
                videoPaddingTop = ((h / 2) - (videoInner.outerHeight() / 2) - 25) + 'px';
                pricingPaddingTop = ((h / 2) - (pricingInner.outerHeight() / 2) - 25) + 'px';
                examplesPaddingTop =  ((h / 2) - (examplesInner.outerHeight() / 2) - 25) + 'px';
                testimonialsPaddingTop = ((h / 2) - (testimonialsInner.outerHeight() / 2) - 25) + 'px';
                contactPaddingTop =  (((h - footerHeight) / 2) - (contactInner.outerHeight() / 2)) + 'px';
            } else {
                cover.height(h);
                $('#features, #video, #examples, #pricing, #testimonials, #contact').height('auto');
            }

            featuresPitch.css({ paddingTop: featuresPaddingTop });
            videoInner.css({ paddingTop: videoPaddingTop });
            pricingInner.css({ paddingTop: pricingPaddingTop });
            examplesInner.css({ paddingTop: examplesPaddingTop });
            testimonialsInner.css({ paddingTop: testimonialsPaddingTop });
            contactInner.css({ paddingTop: contactPaddingTop });

            this._moreButtonOffsets = {
                globals: {
                    windowHeight: h,
                    topElement: $('.section-top')
                },
                pitch: {
                    element: pitchNextElement,
                    height: features.outerHeight(),
                    offsetTop: features.offset().top
                },
                video: {
                    element: videoNextElement,
                    height: video.outerHeight(),
                    offsetTop: video.offset().top
                },
                examples: {
                    element: examplesNextElement,
                    height: examples.outerHeight(),
                    offsetTop: examples.offset().top
                },
                pricing: {
                    element: pricingNextElement,
                    height: pricing.outerHeight(),
                    offsetTop: pricing.offset().top
                },
                testimonials: {
                    element: testimonialsNextElement,
                    height: testimonials.outerHeight(),
                    offsetTop: testimonials.offset().top
                },
                contact: {
                    element: contactNextElement,
                    height: contact.outerHeight(),
                    offsetTop: contact.offset().top
                }
            };

            this.updateNavigation();
        }

        /** Updates navigation. */
        private updateNavigation() {
            var top = 0, h = 0, isNavigating = false, showTopElement = false;

            if (this._moreButtonOffsets) {
                top = $(window).scrollTop(), h = this._moreButtonOffsets.globals.windowHeight;

                for (var p in this._moreButtonOffsets) {
                    if (p != 'globals' && typeof (this._moreButtonOffsets[p]) != 'function') {
                        isNavigating = (top + h) > (this._moreButtonOffsets[p].offsetTop + 200);

                        if (!showTopElement && isNavigating) {
                            showTopElement = true;
                        }

                        this._moreButtonOffsets[p].element.toggleClass('section-next-invisible', isNavigating);
                    }
                }

                this._moreButtonOffsets.globals.topElement.toggleClass('section-next-invisible', !showTopElement);
            }
        }

        /** 
         * Updates the position of the given modal window.
         * @param {object} modal Modal.
         */
        public repositionModal(modal?: any, calc?: boolean) {
            var m = modal || $('.modal-window.modal-show'), modalWidth = !!calc ? modal.outerWidth() : 700 /* Sometimes the calc is off by ~10px so the modal is not centered :-| */;

            m.css({
                top: parseInt(<any>(($(window).height() / 2) - (m.height() / 2)), 10) + 'px',
                left: parseInt(<any>(($(window).width() / 2) - (modalWidth / 2)), 10) + 'px'
            });
        }

        /**
         * Notifies the application that the current path has changed.
         * @param {string} path Path.
         * @param {boolean} push Value indicating whether to push newly changed path to the history.
         */
        private pathChanged(path?: string, push?: boolean, noScroll?: boolean) {
            if (!this._ready) {
                this._readyInternal = () => {
                    this.pathChangedInternal(path, push, noScroll);
                };
            } else {
                this.pathChangedInternal(path, push, noScroll);
            }
        }

        /**
         * Notifies the application that the current path has changed.
         * @param {string} path Path.
         * @param {boolean} push Value indicating whether to push newly changed path to the history.
         */
        private pathChangedInternal(path?: string, push?: boolean, noScroll?: boolean) {
            var self = this, plan = null, doPush = true;
            
            var cur = (location.pathname || '').toLocaleLowerCase(),
                login = $('#login'), signup = $('#signup'), video = $('#video-player'), showModal = (p, m) => {
                    if (m.attr('id') == 'video-player') {
                        this.onVideoModalOpening();
                    } else {
                        if (m.attr('id') == 'signup') {
                            Ifly.Views.Account.AccountDetails.getInstance().load({
                                signUpSubscriptionType: this.resolveSubscriptionType(this.getQueryStringValue('plan'))
                            });
                        }

                        m.addClass('modal-show');
                        self.repositionModal(m);

                        $('.modal-overlay').addClass('modal-show');
                    }

                    if (push && cur.indexOf('/' + p) < 0) {
                        history.pushState({}, document.title, p);
                    }

                    $('#sign-in').css('zIndex', 999);
                };

            if (!path || !path.length) {
                path = cur;

                if (path == '/' || path == '') {
                    doPush = false;
                } else {
                    if (path.indexOf('/') == 0 && path.length > 1) {
                        path = path.substr(1);
                    }
                }
            }

            $('#sign-in').css('zIndex', 99999);

            if (doPush) {
                this.trackEvent('browse', path);

                if (typeof (history.pushState) != 'undefined') {
                    if (path == 'login') {
                        this.hideModal(signup, true);
                        showModal('login', login);
                    } else if (path == 'intro') {
                        showModal('intro', video);
                    } else if (path == 'signup') {
                        this.hideModal(login, true);
                        showModal('signup', signup);

                        $('.signup-inprogress').show();
                        $('#account-details-save').show();
                        $('.signup-success').hide().removeClass('active');
                    } else {
                        this.hideModal();

                        if (path == 'features' || path == 'video' || path == 'examples' || path == 'contact' || path == 'pricing' || path == 'testimonials' || path == 'features/detailed' || path == 'pricing/faq') {
                            if (path == 'features') {
                                this.featuresInternal();
                            } else if (path == 'video') {
                                this.videoInternal();
                            } else if (path == 'examples') {
                                this.examplesInternal();
                            } else if (path == 'contact') {
                                this.contactInternal();
                            } else if (path == 'pricing') {
                                this.pricingInternal();
                            } else if (path == 'testimonials') {
                                this.testimonialsInternal();
                            } else if (path == 'features/detailed') {
                                this.featuresInternal();
                                this.featuresDetailedInternal();
                            } else if (path == 'pricing/faq') {
                                this.pricingInternal();
                                this.pricingFAQInternal();
                            }

                            if (push) {
                                history.pushState({}, document.title, '/' + path);
                            }
                        } else if (path == '/') {
                            if (!noScroll) {
                                this.scrollToTop();
                            }
                            
                            history.pushState({}, document.title, '/');
                        }
                    }
                }
            }
        }

        /**
         * Returns the value of the given query-string parameter.
         * @param {string} name Paramter name.
         */
        private getQueryStringValue(name: string): string {
            var ret = null,
                query = '',
                parameters = [],
                param = [];

            if (name && name.length) {
                query = location.search;

                if (query && query.length) {
                    if (query.indexOf('?') === 0) {
                        query = query.substr(1);
                    }

                    parameters = query.split('&');

                    for (var i = 0; i < parameters.length; i++) {
                        param = parameters[i].split('=');

                        if (param.length > 0 && param[0].toLowerCase() === name.toLowerCase()) {
                            if (!ret) {
                                ret = '';
                            }

                            if (param.length > 1) {
                                if (ret.length) {
                                    ret += ',';
                                }

                                ret += decodeURIComponent(param[1]);
                            }
                        }
                    }
                }
            }

            return ret;
        }

        /** 
         * Returns cookie value.
         * @param {string} name Cookie name.
         */
        private getCookieValue(name: string): string {
            var start = -1, end = -1, ret = '';

            if (document.cookie.length > 0) {
                start = document.cookie.indexOf(name + '=');

                if (start != -1) {
                    start = start + name.length + 1;
                    end = document.cookie.indexOf(';', start);

                    if (end == -1) {
                        end = document.cookie.length;
                    }

                    ret = decodeURIComponent(document.cookie.substring(start, end));
                }
            }

            return ret;
        }

        /**
         * Sets cookie value.
         * @param {string} name Cookie name.
         * @param {string} value Cookie value.
         * @param {number} expiresAfterDays Indicates when cookie expires.
         */
        private setCookieValue(name: string, value: string, expiresAfterDays?: number) {
            var expires = '', date = new Date();

            if (expiresAfterDays) {
                date.setTime(date.getTime() + (expiresAfterDays * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toUTCString();
            }

            document.cookie = name + '=' + value + expires + '; path=/';
        }

        /**
         * Resolves the user-friendly subscription type into the system-based one.
         * @param {string} userFriendlyName User-friendly name.
         */
        private resolveSubscriptionType(userFriendlyName: string): number {
            var ret = null, found = false, types = [
                ['free', 'basic'],
                ['pro'],
                ['agency', 'ultimate']
            ];

            userFriendlyName = (userFriendlyName || '').toLowerCase();

            for (var i = 0; i < types.length; i++) {
                for (var j = 0; j < types[i].length; j++) {
                    if (types[i][j] == userFriendlyName) {
                        ret = i;
                        found = true;
                    }
                }

                if (found) {
                    break;
                }
            }

            return ret;
        }

        /**
         * Tracks the given event.
         * @param {string} category Event category.
         * @param {string} name Event name.
         * @param {number=} metric Event metric.
         */
        public trackEvent(category: string, name?: string, metric?: number) {
            var ga = window['ga'],
                payload = null;

            if (typeof (ga) !== 'undefined') {
                payload = {
                    'hitType': 'event',
                    'eventCategory': category,
                    'eventAction': name || '.',
                    'eventValue': metric
                };

                try {
                    ga('send', payload);
                } catch (ex) { }
            }
        }

        /** Returns an instance of the current application. */
        public static getInstance(): App {
            if (!this._instance) {
                this._instance = new App();
            }

            return this._instance;
        }
    }
}