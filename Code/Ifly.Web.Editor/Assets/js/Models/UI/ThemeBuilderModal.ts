module Ifly.Models.UI {
    /** Represents new theme settings. */
    export class ThemeSettings implements IModel {
        /** Gets or sets theme name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the Id of the theme to copy settings from. */
        public copyFrom: KnockoutObservable<string>;

        /** Gets or sets the selected font. */
        public fontFamily: KnockoutObservable<string>;

        /** Gets or sets selected font color. */
        public fontColor: KnockoutObservable<string>;

        /** Gets or sets the accent color #1. */
        public accentColor1: KnockoutObservable<string>;

        /** Gets or sets the accent color #2. */
        public accentColor2: KnockoutObservable<string>;

        /** Gets or sets the accent color #3. */
        public accentColor3: KnockoutObservable<string>;

        /** Gets or sets the accent color #4. */
        public accentColor4: KnockoutObservable<string>;

        /** Gets or sets the background color. */
        public backgroundColor: KnockoutObservable<string>;

        /** Gets or sets background image. */
        public backgroundImage: KnockoutObservable<string>;

        /** Gets or sets the logo. */
        public logo: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.name = ko.observable<string>();
            this.copyFrom = ko.observable<string>();
            this.fontFamily = ko.observable<string>();
            this.fontColor = ko.observable<string>();
            this.accentColor1 = ko.observable<string>();
            this.accentColor2 = ko.observable<string>();
            this.accentColor3 = ko.observable<string>();
            this.accentColor4 = ko.observable<string>();
            this.backgroundColor = ko.observable<string>();
            this.backgroundImage = ko.observable<string>();
            this.logo = ko.observable<string>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.name(data.name || data.Name || '');
            this.copyFrom(data.copyFrom || data.CopyFrom || '');
            this.fontFamily(data.fontFamily || data.FontFamily || '');
            this.fontColor(data.fontColor || data.FontColor || '');
            this.accentColor1(data.accentColor1 || data.AccentColor1 || '');
            this.accentColor2(data.accentColor2 || data.AccentColor2 || '');
            this.accentColor3(data.accentColor3 || data.AccentColor3 || '');
            this.accentColor4(data.accentColor4 || data.AccentColor4 || '');
            this.backgroundColor(data.backgroundColor || data.BackgroundColor || '');
            this.backgroundImage(data.backgroundImage || data.BackgroundImag || '');
            this.logo(data.logo || data.Logo || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                name: this.name(),
                copyFrom: this.copyFrom(),
                fontFamily: this.fontFamily(),
                fontColor: this.fontColor(),
                accentColor1: this.accentColor1(),
                accentColor2: this.accentColor2(),
                accentColor3: this.accentColor3(),
                accentColor4: this.accentColor4(),
                backgroundColor: this.backgroundColor(),
                backgroundImage: this.backgroundImage(),
                logo: this.logo()
            };
        }
    }

    /** Represents theme builder wizard step. */
    export enum ThemeBuilderWizardStep {
        /** Select template. */
        selectTemplate = 0,

        /** Customization. */
        customization = 1,

        /** Confirmation. */
        confirmation = 2
    }

    /** Represents theme parsed metadata. */
    export class ThemeParsedMetadata implements IModel {
        /** Gets or sets the font family. */
        public fontFamily: KnockoutObservable<string>;

        /** Gets or sets font color. */
        public fontColor: KnockoutObservable<string>;

        /** Gets or sets accent color 1. */
        public accentColor1: KnockoutObservable<string>;

        /** Gets or sets accent color 2. */
        public accentColor2: KnockoutObservable<string>;

        /** Gets or sets accent color 3. */
        public accentColor3: KnockoutObservable<string>;

        /** Gets or sets accent color 4. */
        public accentColor4: KnockoutObservable<string>;

        /** Gets or sets background color. */
        public backgroundColor: KnockoutObservable<string>;

        /** Gets or sets background image. */
        public backgroundImage: KnockoutObservable<string>;

        /** Gets or sets the logo. */
        public logo: KnockoutObservable<string>;

        /**
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.fontFamily = ko.observable<string>();
            this.fontColor = ko.observable<string>();
            this.accentColor1 = ko.observable<string>();
            this.accentColor2 = ko.observable<string>();
            this.accentColor3 = ko.observable<string>();
            this.accentColor4 = ko.observable<string>();
            this.backgroundColor = ko.observable<string>();
            this.backgroundImage = ko.observable<string>();
            this.logo = ko.observable<string>();

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.fontFamily(data.fontFamily || data.FontFamily || '');
            this.fontColor(data.fontColor || data.FontColor || '');
            this.accentColor1(data.accentColor1 || data.AccentColor1 || '');
            this.accentColor2(data.accentColor2 || data.AccentColor2 || '');
            this.accentColor3(data.accentColor3 || data.AccentColor3 || '');
            this.accentColor4(data.accentColor4 || data.AccentColor4 || '');
            this.backgroundColor(data.backgroundColor || data.BackgroundColor || '');
            this.backgroundImage(data.backgroundImage || data.BackgroundImage || '');
            this.logo(data.logo || data.Logo || '');
        }

        /** Serializes object state. */
        public serialize() {
            return {
                fontFamily: this.fontFamily(),
                fontColor: this.fontColor(),
                accentColor1: this.accentColor1(),
                accentColor2: this.accentColor2(),
                accentColor3: this.accentColor3(),
                accentColor4: this.accentColor4(),
                backgroundColor: this.backgroundColor(),
                backgroundImage: this.backgroundImage(),
                logo: this.logo()
            };
        }

        /**
         * Parses metadata form the given theme.
         * @param {string} theme Theme name.
         * @param {Function} onComplete A callback.
         */
        static parseMetadata(theme: string, onComplete: (metadata: ThemeParsedMetadata) => any) {
            var quotes = ['\'', '"'],
                fontFamily = '',
                toHex = null,
                probe = $('<div>'),
                logoElement = null,
                getBackgroundImage = null,
                explicitValueOrEmpty = null,
                color = new Embed.ColorHelper(),
                metadata = new ThemeParsedMetadata();

            probe.css({
                position: 'absolute',
                left: '-99999999px',
                top: '-99999999px',
                visibility: 'hidden',
                overflow: 'hidden',
                width: '1px',
                height: '1px',
                zIndex: 0
            });

            probe.append($('<span class="accent-1"></span>'));
            probe.append($('<span class="accent-2"></span>'));
            probe.append($('<span class="accent-3"></span>'));
            probe.append($('<span class="accent-4"></span>'));
            probe.append($('<span class="company-logo"></span>'));
            probe.append($('<span class="background-image"></span>'));

            $(document.body).append(probe);

            probe.addClass('slide');
            probe.addClass('theme-' + theme);

            setTimeout(() => {
                fontFamily = probe.css('fontFamily') || '';

                fontFamily = fontFamily.replace(/serif|sans-serif/gi, '');
                fontFamily = Utils.Input.trim(fontFamily);

                if (fontFamily.lastIndexOf(',') === (fontFamily.length - 1)) {
                    fontFamily = Utils.Input.trim(fontFamily.substr(0, fontFamily.length - 1));
                }

                for (var i = 0; i < quotes.length; i++) {
                    if (fontFamily.indexOf(quotes[i]) === 0 && fontFamily.lastIndexOf(quotes[i]) === (fontFamily.length - 1)) {
                        fontFamily = fontFamily.substr(1, fontFamily.length - 2);
                        fontFamily = Utils.Input.trim(fontFamily);
                    }
                }

                metadata.fontFamily(fontFamily);

                toHex = v => {
                    return v && v.length && v !== 'transparent' && v !== 'inherit' ?
                        color.hex(v) : '';
                };

                metadata.fontColor(toHex(probe.css('color')));

                metadata.accentColor1(toHex(probe.find('.accent-1').css('color')));
                metadata.accentColor2(toHex(probe.find('.accent-2').css('color')));
                metadata.accentColor3(toHex(probe.find('.accent-3').css('color')));
                metadata.accentColor4(toHex(probe.find('.accent-4').css('color')));

                explicitValueOrEmpty = v => {
                    var vLowered = Utils.Input.trim((v || '').toLowerCase());
                    return vLowered === 'none' || vLowered === 'inherit' || vLowered === 'transparent' ? '' : v;
                };

                getBackgroundImage = v => {
                    var result = /(?:\(['|"]?)(.*?)(?:['|"]?\))/.exec(v);
                    return v.toLowerCase().indexOf('url') >= 0 && result && result.length > 1 ? result[1] : '';
                };

                metadata.backgroundColor(toHex(explicitValueOrEmpty(probe.css('backgroundColor'))));
                metadata.backgroundImage(explicitValueOrEmpty(getBackgroundImage(probe.find('.background-image').css('backgroundImage') || '')));

                logoElement = probe.find('.company-logo');

                metadata.logo(explicitValueOrEmpty(getBackgroundImage(logoElement.css('backgroundImage') || '')));

                probe.remove();
                
                (onComplete || function () { })(metadata);
            }, 5);
        }
    }

    /** Represents theme builder wizard base step. */
    export class ThemeBuilderWizardStepBase {
        /** Gets or sets the wizard activator. */
        public wizard: () => ThemeBuilderWizard;

        /** Gets or sets value indicating whether controls on this step is enabled. */
        public enabled: KnockoutObservable<boolean>;

        /**
         * Initializes a new instance of an object.
         * @param {ThemeBuilderWizard} wizard Wizard activator.
         */
        constructor(wizard: ThemeBuilderWizard) {
            this.wizard = () => wizard;
            this.enabled = ko.observable<boolean>(true);

            this.wizard().modal().enabled.subscribe(v => {
                this.enabled(v);
            });
        }

        /** Resets step data. */
        public reset() { }

        /** Occurs when user enters the step. */
        public onEnter() { }

        /** Occurs when user leaves the step. */
        public onLeave() { }
    }

    /** Represents theme builder wizard "Select template" step. */
    export class ThemeBuilderWizardSelectTemplateStep extends ThemeBuilderWizardStepBase {
        /** Gets or sets the base themes. */
        public themes: ThemeSelector;

        /** Gets or sets the base theme. */
        public theme: KnockoutObservable<string>;
        
        /**
         * Initializes a new instance of an object.
         * @param {ThemeBuilderWizard} wizard Wizard activator.
         */
        constructor(wizard: ThemeBuilderWizard) {
            super(wizard);
            
            this.theme = ko.observable<string>('clean');
        }

        /** Resets step data. */
        public reset() {
            this.theme('clean');

            if (this.themes) {
                this.themes.theme('clean');
            }
        }

        /** Occurs when user enters the step. */
        public onEnter() {
            var themeList = null,
                oldThemeList = null,
                builder = this.wizard().modal(),
                themeField = builder.container.find('.base-theme');

            oldThemeList = themeField.find('label + *');

            if (oldThemeList.length) {
                ko.cleanNode(oldThemeList.get(0));
                oldThemeList.remove();
            }

            themeList = $('#theme-selector').clone().removeAttr('id').removeAttr('data-bind')
                .removeClass('with-action-buttons');

            this.themes = new ThemeSelector(themeList);
            this.themes.addEventListener('themeChanged', (sender, args) => {
                this.theme(args.theme);
            });

            themeField.append(themeList);
            ko.applyBindings(this.themes, themeList.get(0));

            this.themes.theme(this.theme());
        }
    }

    /** Represents theme builder wizard "Customization" step. */
    export class ThemeBuilderWizardCustomizationStep extends ThemeBuilderWizardStepBase {
        /** Gets or sets all the fonts. */
        public fonts: FontSelector;

        /** Gets or sets font color picker. */
        public fontColorPicker: ColorPicker;

        /** Gets or sets accent color #1 picker. */
        public accentColor1Picker: ColorPicker;

        /** Gets or sets accent color #2 picker. */
        public accentColor2Picker: ColorPicker;

        /** Gets or sets accent color #3 picker. */
        public accentColor3Picker: ColorPicker;

        /** Gets or sets accent color #4 picker. */
        public accentColor4Picker: ColorPicker;

        /** Gets or sets background color picker. */
        public backgroundColorPicker: ColorPicker;

        /** Gets or sets the selected font. */
        public fontFamily: KnockoutObservable<string>;

        /** Gets or sets the selected font color. */
        public fontColor: KnockoutObservable<string>;

        /** Gets or sets the accent color #1. */
        public accentColor1: KnockoutObservable<string>;

        /** Gets or sets the accent color #2. */
        public accentColor2: KnockoutObservable<string>;

        /** Gets or sets the accent color #3. */
        public accentColor3: KnockoutObservable<string>;

        /** Gets or sets the accent color #4. */
        public accentColor4: KnockoutObservable<string>;

        /** Gets or sets the background color. */
        public backgroundColor: KnockoutObservable<string>;

        /** Gets or sets background image. */
        public backgroundImage: KnockoutObservable<string>;

        /** Gets or sets background image selector. */
        public backgroundImageSelector: ImageSelector;

        /** Gets or sets the logo. */
        public logo: KnockoutObservable<string>;

        /** Gets or sets the logo selector. */
        public logoSelector: ImageSelector;

        /** Gets or sets the previously selected theme. */
        private _previousTheme: string;

        /**
         * Initializes a new instance of an object.
         * @param {ThemeBuilderWizard} wizard Wizard activator.
         */
        constructor(wizard: ThemeBuilderWizard) {
            super(wizard);

            this.fontFamily = ko.observable<string>();
            this.fontColor = ko.observable<string>();
            this.accentColor1 = ko.observable<string>();
            this.accentColor2 = ko.observable<string>();
            this.accentColor3 = ko.observable<string>();
            this.accentColor4 = ko.observable<string>();
            this.backgroundColor = ko.observable<string>();
            this.backgroundImage = ko.observable<string>();
            this.backgroundImageSelector = new ImageSelector();
            this.logo = ko.observable<string>();
            this.logoSelector = new ImageSelector();

            this.fonts = new FontSelector(wizard.modal().container.find('#theme-font'));
            this.fontColorPicker = new ColorPicker(wizard.modal().container.find('#theme-font-color')); 
            this.accentColor1Picker = new ColorPicker(wizard.modal().container.find('#theme-accent-color-1'));
            this.accentColor2Picker = new ColorPicker(wizard.modal().container.find('#theme-accent-color-2'));
            this.accentColor3Picker = new ColorPicker(wizard.modal().container.find('#theme-accent-color-3'));
            this.accentColor4Picker = new ColorPicker(wizard.modal().container.find('#theme-accent-color-4'));
            this.backgroundColorPicker = new ColorPicker(wizard.modal().container.find('#theme-background-color'));

            this.backgroundImageSelector.addEventListener('imageChanged', (sender, args) => {
                this.backgroundImage(args.image);
            });

            this.logoSelector.addEventListener('imageChanged', (sender, args) => {
                this.logo(args.image);
            });

            this.fontColorPicker.addEventListener('colorChanged', (sender, args) => {
                this.fontColor(args.color);
            });

            this.accentColor1Picker.addEventListener('colorChanged', (sender, args) => {
                this.accentColor1(args.color);
            });

            this.accentColor2Picker.addEventListener('colorChanged', (sender, args) => {
                this.accentColor2(args.color);
            });

            this.accentColor3Picker.addEventListener('colorChanged', (sender, args) => {
                this.accentColor3(args.color);
            });

            this.accentColor4Picker.addEventListener('colorChanged', (sender, args) => {
                this.accentColor4(args.color);
            });

            this.backgroundColorPicker.addEventListener('colorChanged', (sender, args) => {
                this.backgroundColor(args.color);
            });

            this.fonts.addEventListener('fontChanged', (sender, args) => {
                this.fontFamily(args.font);
            });
        }

        /** Resets step data. */
        public reset() {
            this.fontFamily('');
            this.fontColor('');
            this.accentColor1('');
            this.accentColor2('');
            this.accentColor3('');
            this.accentColor4('');
            this.backgroundColor('');
            this.backgroundImage('');
            this.logo('');

            this.fonts.font('');
            this.fontColorPicker.color('');
            this.accentColor1Picker.color('');
            this.accentColor2Picker.color('');
            this.accentColor3Picker.color('');
            this.accentColor4Picker.color('');
            this.backgroundColorPicker.color('');
            this.backgroundImageSelector.image('');
            this.logoSelector.image('');
        }

        /** Occurs when user enters the step. */
        public onEnter() {
            var isEmptyValue = observable => {
                return this._previousTheme !== this.wizard().steps.selectTemplate.theme() ||
                    !observable() || !observable().length;
            };

            ThemeParsedMetadata.parseMetadata(this.wizard().steps.selectTemplate.theme(), metadata => {
                if (isEmptyValue(this.fontFamily)) {
                    this.fonts.font(metadata.fontFamily());
                }

                if (isEmptyValue(this.fontColor)) {
                    this.fontColorPicker.color(metadata.fontColor());
                }

                if (isEmptyValue(this.accentColor1)) {
                    this.accentColor1Picker.color(metadata.accentColor1());
                }

                if (isEmptyValue(this.accentColor2)) {
                    this.accentColor2Picker.color(metadata.accentColor2());
                }

                if (isEmptyValue(this.accentColor3)) {
                    this.accentColor3Picker.color(metadata.accentColor3());
                }

                if (isEmptyValue(this.accentColor4)) {
                    this.accentColor4Picker.color(metadata.accentColor4());
                }

                if (isEmptyValue(this.backgroundColor)) {
                    this.backgroundColorPicker.color(metadata.backgroundColor());
                }

                if (isEmptyValue(this.backgroundImage)) {
                    this.backgroundImageSelector.image(metadata.backgroundImage());
                }

                if (isEmptyValue(this.logo)) {
                    this.logoSelector.image(metadata.logo());
                }

                this._previousTheme = this.wizard().steps.selectTemplate.theme();
            });
        }
    }

    /** Represents theme builder wizard "Confirmation" step. */
    export class ThemeBuilderWizardConfirmationStep extends ThemeBuilderWizardStepBase {
        /** Gets or sets the theme name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets value indicating whether name is unique. */
        public nameIsUnique: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether there was an error confirming the theme. */
        public wasError: KnockoutObservable<boolean>;

        /** Gets or sets theme name changing timer. */
        private _nameChangingTimer: any;

        /**
         * Initializes a new instance of an object.
         * @param {ThemeBuilderWizard} wizard Wizard activator.
         */
        constructor(wizard: ThemeBuilderWizard) {
            super(wizard);

            this.name = ko.observable<string>();
            this.nameIsUnique = ko.observable<boolean>(true);
            this.wasError = ko.observable<boolean>();

            this.name.subscribe(v => {
                this.onNameChanging();
            });
        }

        /** Occurs when user enters the step. */
        public onEnter() {
            var c = Ifly.App.getInstance().components['ThemeBuilderModal'].terminology;

            this.wasError(false);

            setTimeout(() => {
                if (!this.name() || !this.name().length) {
                    this.name(c.copyOf + ' ' + this.wizard().steps.selectTemplate.theme());
                }

                this.wizard().modal().container.find('.theme-name').focus().select();

                this.onNameChanging();
            }, 25);
        }

        /** Resets step data. */
        public reset() {
            this.name('');
            this.wasError(false);
            this.nameIsUnique(true);
        }

        /** Occurs when theme name is changing. */
        public onNameChanging() {
            clearTimeout(this._nameChangingTimer);

            this._nameChangingTimer = setTimeout(() => {
                if (this.name() && this.name().length) {
                    $.ajax('/themes/' + Ifly.Editor.getInstance().user.id() + '/' + this.name() + '.css', {
                        success: () => { this.nameIsUnique(false); },
                        error: () => { this.nameIsUnique(true); }
                    });
                } else {
                    this.nameIsUnique(true);
                }
            }, 500);
        }
    }

    /** Represents theme builder wizard step set. */
    export class ThemeBuilderWizardStepSet {
        /** Gets or sets the current step. */
        public current: ThemeBuilderWizardStepBase;

        /** Gets or sets "Select template" step. */
        public selectTemplate: ThemeBuilderWizardSelectTemplateStep;

        /** Gets or sets "Customization" step. */
        public customization: ThemeBuilderWizardCustomizationStep;

        /** Gets or sets "Confirmation" step. */
        public confirmation: ThemeBuilderWizardConfirmationStep;

        /**
         * Initializes a new instance of an object.
         * @param {ThemeBuilderWizard} wizard Wizard.
         */
        constructor(wizard: ThemeBuilderWizard) {
            this.selectTemplate = new ThemeBuilderWizardSelectTemplateStep(wizard);
            this.customization = new ThemeBuilderWizardCustomizationStep(wizard);
            this.confirmation = new ThemeBuilderWizardConfirmationStep(wizard);

            wizard.step.subscribe(v => {
                this.current = null;

                if (typeof (v) === 'undefined' || v === null || v === ThemeBuilderWizardStep.selectTemplate) {
                    this.current = this.selectTemplate;
                } else if (v === ThemeBuilderWizardStep.customization) {
                    this.current = this.customization;
                } else if (v === ThemeBuilderWizardStep.confirmation) {
                    this.current = this.confirmation;
                }
            });
        }
    }

    /** Represents theme builder wizard. */
    export class ThemeBuilderWizard extends Ifly.EventSource {
        /** Gets or sets the hosting modal. */
        public modal: () => ThemeBuilderModal;

        /** Gets or sets  */
        public step: KnockoutObservable<ThemeBuilderWizardStep>;

        /** Gets or sets all steps. */
        public steps: ThemeBuilderWizardStepSet;

        /**
         * Initializes a new instance of an object.
         * @param {ThemeBuilderModal} modal Theme builder modal.
         */
        constructor(modal: ThemeBuilderModal) {
            super();

            this.modal = () => modal;

            this.step = ko.observable<ThemeBuilderWizardStep>();
            this.steps = new ThemeBuilderWizardStepSet(this);

            this.step(ThemeBuilderWizardStep.selectTemplate);
        }

        /** Starts the wizard. */
        public start() {
            var builder = this.modal(),
                app = Ifly.App.getInstance(),
                c = app.components['ThemeBuilderModal'].terminology;

            this.steps.selectTemplate.reset();
            this.steps.customization.reset();
            this.steps.confirmation.reset();

            this.step(ThemeBuilderWizardStep.selectTemplate);

            if (!builder.modal) {
                builder.modal = app.openModal({
                    content: builder.container,
                    closeOnEscape: false,
                    cssClass: 'theme-builder-window',
                    replaceCurrent: true,
                    buttons: [
                        {
                            text: c.back,
                            click: () => { this.back(); }
                        },
                        {
                            text: c.next,
                            click: () => { this.next(); }
                        }
                    ]
                });
            } else {
                builder.modal.open();
            }

            builder.modal.updateButtons({
                primary: {
                    visible: false
                }
            });

            this.reset();

            this.steps.current.onEnter();
        }

        /** Moves forward. */
        public next() {
            var nextStep = this.step() + 1;

            if (nextStep <= ThemeBuilderWizardStep.confirmation) {
                this.gotoStep(nextStep);
            } else {
                this.submit();
            }
        }

        /** Goes back. */
        public back() {
            var previousStep = this.step() - 1;

            if (previousStep >= ThemeBuilderWizardStep.selectTemplate) {
                this.gotoStep(previousStep);
            }
        }

        /** Submits theme. */
        public submit() {
            var builder = this.modal();

            builder.data.name(this.steps.confirmation.name());
            builder.data.copyFrom(this.steps.selectTemplate.theme());
            builder.data.fontFamily(this.steps.customization.fontFamily());
            builder.data.fontColor(this.steps.customization.fontColor());
            builder.data.accentColor1(this.steps.customization.accentColor1());
            builder.data.accentColor2(this.steps.customization.accentColor2());
            builder.data.accentColor3(this.steps.customization.accentColor3());
            builder.data.accentColor4(this.steps.customization.accentColor4());
            builder.data.backgroundColor(this.steps.customization.backgroundColor());
            builder.data.backgroundImage(this.steps.customization.backgroundImage());
            builder.data.logo(this.steps.customization.logo());

            this.dispatchEvent('completed', {
                result: builder.data.serialize()
            });
        }

        /** Resets the wizard. */
        public reset() {
            this.step(ThemeBuilderWizardStep.selectTemplate);
            this.steps.current.reset();
        }
        
        /**
         * Goes to step.
         * @param {ThemeBuilderWizardStep} step Step.
         */
        public gotoStep(step: ThemeBuilderWizardStep) {
            var builder = this.modal(),
                app = Ifly.App.getInstance(),
                c = app.components['ThemeBuilderModal'].terminology;

            this.steps.current.onLeave();
            this.step(step);
            this.steps.current.onEnter();

            this.dispatchEvent('stepChanged', { step: step });

            builder.modal.updateButtons({
                primary: {
                    visible: step > ThemeBuilderWizardStep.selectTemplate
                },
                secondary: {
                    text: step == ThemeBuilderWizardStep.confirmation ? c.create : c.next,
                    click: step == ThemeBuilderWizardStep.confirmation ? () => { this.submit(); } : () => { this.back(); }
                }
            });
        }
    }

    /** Represents a theme builder modal dialog. */
    export class ThemeBuilderModal extends ModalForm<ThemeSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: ThemeBuilderModal;

        /** Gets or sets an optional callback that is called when theme is created. */
        private _saved: Function;

        /** Gets or sets the wizard. */
        public wizard: ThemeBuilderWizard;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#theme-builder', () => { return new ThemeSettings(); }, true);

            this.wizard = new ThemeBuilderWizard(this);

            this.wizard.addEventListener('completed', () => {
                this.save();
            });

            super.applyBindings();
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            super.load(data);

            this._saved = (options || {}).save;

            this.wizard.start();

            Ifly.App.getInstance().trackEvent('discover', 'theme builder');
        }

        /** Saves the data. */
        public save() {
            var c = Ifly.App.getInstance().components['ThemeBuilderModal'],
                editor = Ifly.Editor.getInstance(),
                serialized = this.data.serialize(),
                themeObj = null;

            Ifly.App.getInstance().trackEvent('act', 'theme builder');

            if (this.enabled()) {
                this.enabled(false);

                this.modal.updateButtons({
                    secondary: {
                        text: c.terminology.creating,
                        enabled: false
                    },
                    primary: {
                        enabled: false
                    }
                });

                Ifly.App.getInstance().api.post('themes/create', serialized, (success, data) => {
                    this.enabled(true);

                    this.modal.updateButtons();

                    if (data) {
                        try {
                            data = typeof (data) == 'string' ?
                            ko.utils.parseJson(<string>data) : data;
                        } catch (ex) { }

                        themeObj = {
                            id: data.id || data.Id,
                            name: data.name || data.Name,
                            url: data.url || data.Url
                        };

                        editor.composition.addThemeReference(<ThemeReference>themeObj, true);

                        if (this._saved) {
                            this._saved(ko.utils.extend(serialized, themeObj));

                            this._saved = null;
                        }

                        this.close();
                    } else {
                        this.wizard.steps.confirmation.wasError(true);
                    }
                });
            }
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): ThemeBuilderModal {
            if (!this._instance) {
                this._instance = new ThemeBuilderModal();
            }

            return this._instance;
        }
    }
}