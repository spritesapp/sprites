/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../Element.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents presentation stats data. */
    export class PresentationStatsData implements IModel {
        /** Gets or sets value indicating whether stats data is ready. */
        public isReady: KnockoutObservable<boolean>;

        /** Gets or sets total impressions for Facebook. */
        public facebook: KnockoutObservable<number>;

        /** Gets or sets total impressions for Twitter. */
        public twitter: KnockoutObservable<number>;

        /** Gets or sets total impressions for LinkedIn. */
        public linkedIn: KnockoutObservable<number>;

        /** Gets or sets total impressions for Google+. */
        public googlePlus: KnockoutObservable<number>;

        /** Gets or sets impressions over time. */
        public impressionsOverTime: KnockoutObservableArray<ImpressionSummary>;

        /** Gets or sets the Google Analytics tracking Id. */
        public googleAnalyticsTrackingId: KnockoutObservable<string>;

        /** Gets or sets value indicating whether integration settings are being saved. */
        public isSavingIntegrationSettings: KnockoutObservable<boolean>;

        /** Gets or sets the 'Save' button text. */
        public saveButtonText: KnockoutObservable<string>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            var getFormatted = (p: string) => {
                var v = 0, f = this[p], vl = '', result = '0';

                if (typeof (f) === 'function') {
                    v = f();
                }

                if (!isNaN(v) && v > 0) {
                    vl = v.toString();

                    if (v >= 1000000) { // 15,000,000
                        result = vl.substr(0, vl.length - 6) + ',' + vl.substr(vl.length - 6, 3) + ',' + vl.substr(vl.length - 3, 3);
                    } else if (v >= 100000) { // 100,000
                        result = vl.substr(0, 3) + ',' + vl.substr(3, 3);
                    } else if (v >= 10000) { // 10,000
                        result = vl.substr(0, 2) + ',' + vl.substr(2, 3);
                    } else if (v >= 1000) { // 1,000
                        result = vl.substr(0, 1) + ',' + vl.substr(1, 3);
                    } else {
                        result = vl;
                    }
                }

                return result;
            };

            this.isReady = ko.observable<boolean>();
            this.facebook = ko.observable<number>();
            this.twitter = ko.observable<number>();
            this.linkedIn = ko.observable<number>();
            this.googlePlus = ko.observable<number>();
            this.impressionsOverTime = ko.observableArray<ImpressionSummary>();
            this.googleAnalyticsTrackingId = ko.observable<string>();
            this.isSavingIntegrationSettings = ko.observable<boolean>();
            this.saveButtonText = ko.observable<string>();

            (<any>this.facebook).formatted = ko.computed(() => getFormatted('facebook'));
            (<any>this.twitter).formatted = ko.computed(() => getFormatted('twitter'));
            (<any>this.linkedIn).formatted = ko.computed(() => getFormatted('linkedIn'));
            (<any>this.googlePlus).formatted = ko.computed(() => getFormatted('googlePlus'));

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var impressions = [];

            data = data || {};

            this.facebook(0);
            this.twitter(0);
            this.linkedIn(0);
            this.googlePlus(0);
            this.impressionsOverTime.removeAll();
            this.googleAnalyticsTrackingId('');

            if (typeof (data.impressionsOverTime) != 'undefined' || typeof (data.ImpressionsOverTime) != 'undefined') {
                this.facebook(data.facebook || data.Facebook || 0);
                this.twitter(data.twitter || data.Twitter || 0);
                this.linkedIn(data.linkedIn || data.LinkedIn || 0);
                this.googlePlus(data.googlePlus || data.GooglePlus || 0);
                this.googleAnalyticsTrackingId(data.googleAnalyticsTrackingId || data.GoogleAnalyticsTrackingId || '');

                ko.utils.arrayForEach(data.impressionsOverTime || data.ImpressionsOverTime || [], i => {
                    this.impressionsOverTime.push(new ImpressionSummary(i));
                });
            } else {
                impressions = $.isArray(data) ? data : (data.impressions || data.Impressions || []);

                if (impressions && impressions.length) {
                    ko.utils.arrayForEach(impressions, i => {
                        var imp = new ImpressionSummary(i), c = imp.channel();

                        if (c == ImpressionSummaryChannel.facebook) {
                            this.facebook(imp.totalImpressions() || 0);
                        } else if (c == ImpressionSummaryChannel.twitter) {
                            this.twitter(imp.totalImpressions() || 0);
                        } else if (c == ImpressionSummaryChannel.linkedIn) {
                            this.linkedIn(imp.totalImpressions() || 0);
                        } else if (c == ImpressionSummaryChannel.googlePlus) {
                                this.googlePlus(imp.totalImpressions() || 0);
                        } else {
                            this.impressionsOverTime.push(imp);
                        }
                    });
                    
                    this.impressionsOverTime.sort((x, y) => x.order() - y.order());
                }
            }
        }

        /**  Serializes object state. */
        public serialize() {
            return {
                facebook: this.facebook(),
                twitter: this.twitter(),
                linkedIn: this.linkedIn(),
                googlePlus: this.googlePlus(),
                googleAnalyticsTrackingId: this.googleAnalyticsTrackingId(),
                impressionsOverTime: ko.utils.arrayMap(this.impressionsOverTime(), i => {
                    return i.serialize();
                })
            };
        }
    }

    /** Represents a presentation stats modal. */
    export class PresentationStatsModal extends ModalForm<PresentationStatsData> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: PresentationStatsModal;

        /** Gets or sets an optional callback that is called when presentation stats data is saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#presentation-stats', () => {
                return new PresentationStatsData();
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['PresentationStatsModal'],
                d = (data || {}), presentationId = d.presentationId,
                googleAnalyticsTrackingId = d.googleAnalyticsTrackingId || '';

            this.data.isReady(false);

            setTimeout(() => {
                app.api.get('impressions/{id}', parseInt(presentationId, 10) || 0, (success, result) => {
                    this.data.isReady(true);
                    
                    super.load(result);
                    this.data.googleAnalyticsTrackingId(googleAnalyticsTrackingId);
                    this.data.saveButtonText(c.terminology.save);

                    this.populateImpressionsOverTime();
                });
            }, 350);

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    buttons: [
                        {
                            text: c.terminology.close,
                            click: () => { this.close(); }
                        }
                    ]
                });
            } else {
                this.modal.updateButtons();
                this.modal.open();
            }
        }

        /** Saves integration settings. */
        public saveIntegrationSettings() {
            var serialized = null, editor = Ifly.Editor.getInstance(),
                presentationId = -1, c = Ifly.App.getInstance().components['PresentationStatsModal'];

            editor.presentation.integrationSettings().googleAnalyticsTrackingId(this.data.googleAnalyticsTrackingId() || '');
            serialized = editor.presentation.integrationSettings().serialize();
            presentationId = editor.presentation.id();
            serialized.presentationId = presentationId;

            this.data.isSavingIntegrationSettings(true);
            this.data.saveButtonText(c.terminology.saving);

            Ifly.App.getInstance().api.put('presentations/' + presentationId + '/integration', serialized, (success, data) => {
                this.data.saveButtonText(c.terminology.saved);

                setTimeout(() => {
                    this.data.isSavingIntegrationSettings(false);
                    this.data.saveButtonText(c.terminology.save);
                }, 3000);
            });
        }

        /** Populates "Impressions over time" graph. */
        private populateImpressionsOverTime() {
            var canvas = $('<canvas />'), c = this.container.find('.chart').empty(), labels = [], day = 0, month = 0,
                impressions = this.data.impressionsOverTime(), chart = null, data = null, dt = new Date(), accentColor = '#EB6841',
                daysInMonth = (m, y) => new Date(y, m, 0).getDate(), color = new Ifly.Models.Embed.ColorHelper(), contents = this.container.find('.stats-contents'),
                scaleMin = 0, scaleWidth = 0, min = 0, max = 0, sortedByTotalImpressions = [], originalImpressions = [], scaleSteps = 10;

            if (impressions && impressions.length) {
                originalImpressions = ko.utils.arrayMap(impressions, imp => imp.totalImpressions() || 0);
                sortedByTotalImpressions = impressions.sort((x, y) => x.totalImpressions() - y.totalImpressions());
                min = sortedByTotalImpressions[0].totalImpressions(), max = sortedByTotalImpressions[sortedByTotalImpressions.length - 1].totalImpressions();

                scaleMin = min;
                scaleWidth = parseInt(<any>(max / scaleSteps), 10);

                if (scaleWidth == 0) {
                    scaleWidth = 1;
                }

                canvas.attr({
                    width: parseInt(<any>(contents.width() / 100 * 99), 10),
                    height: parseInt(<any>(contents.height() / 100 * 65), 10)
                });

                c.append(canvas);

                for (var i = 6; i >= 0; i--) {
                    month = dt.getMonth() + 1;
                    day = dt.getDate() - i;

                    if (day < 1) {
                        month -= 1;
                        day = daysInMonth(month, dt.getFullYear()) - (dt.getDate() - i);
                    } 

                    labels.push(month + '/' + day);
                }
                
                chart = new window['Chart']((<any>canvas[0]).getContext('2d'));

                data = {
                    labels: labels,
                    datasets: [
                        {
                            fillColor: color.rgba(accentColor, 0.5),
                            strokeColor: accentColor,
                            pointColor: accentColor,
                            pointStrokeColor: '#fff',
                            data: originalImpressions
                        }
                    ]
                };

                chart.Line(data, {
                    bezierCurve: false,
                    scaleOverride: true,
                    scaleSteps: scaleSteps,
                    scaleStepWidth: scaleWidth,
                    scaleStartValue: scaleMin,
                    scaleGridLineColor: '#f4f4f4',
                    scaleLineColor: '#acacac',
                    scaleFontColor: '#666'
                });
            }
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): PresentationStatsModal {
            if (!this._instance) {
                this._instance = new PresentationStatsModal();
            }

            return this._instance;
        }
    }
}