/// <reference path="../../Typings/knockout.d.ts" />
/// <reference path="../../Typings/jquery.d.ts" />
/// <reference path="../IModel.ts" />
/// <reference path="../../Editor.ts" />
/// <reference path="../../App.ts" />
/// <reference path="ModalForm.ts" />

module Ifly.Models.UI {
    /** Represents Google Analytics AnyData suggestion service. */
    export interface IGoogleAnalyticsAnyDataSuggestionService {
        /**
         * Performs item suggestion.
         * @param {string} name Name.
         * @param {string} value Value.
         * @param {boolean} exactMatch Value indicating whether to perform exact match.
         */
        suggestItems: (name: string, value: string, exactMatch?: boolean) => Ifly.Utils.IListItem[];
    }

    /** Represents data import source type. */
    export enum DataImportSourceType {
        /** Excel/CSV. */
        excel = 0,

        /** Google Spreadsheets. */
        google = 1,

        /** Custom URL. */
        url = 2,

        /** Google Analytics. */
        googleAnalytics = 3
    }

    /** Represents base class for source import settings. */
    export class SourceDataImportSettingsBase implements IModel {
        /** Gets or sets value indicating whether there was an error uploading/downloading the data. */
        public wasError: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether validation error occured with the data. */
        public wasValidationError: KnockoutObservable<boolean>;

        /** Gets or sets validation result. */
        public validationResult: KnockoutObservable<Ifly.Utils.IDataImportIntegrityValidationResult>;

        /** Gets or sets the data import settings. */
        public settings: DataImportSettings;

        /** Gets or sets the file size, in bytes. */
        public fileSize: KnockoutObservable<number>;

        /** Gets or sets value indicating whether sheet data starts with column names. */
        public sheetDataStartsWithColumnNames: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether sheet data contains row labels. */
        public sheetDataContainsRowLabels: KnockoutObservable<boolean>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {DataImportSettings} settings Settings.
         */
        constructor(data?: any, settings?: DataImportSettings) {
            this.fileSize = ko.observable<number>();
            this.settings = settings;
            this.wasError = ko.observable<boolean>();
            this.wasValidationError = ko.observable<boolean>();
            this.validationResult = ko.observable<Ifly.Utils.IDataImportIntegrityValidationResult>();
            this.sheetDataStartsWithColumnNames = ko.observable<boolean>();
            this.sheetDataContainsRowLabels = ko.observable<boolean>();

            DataImportSettings.makeCheckable(this, 'sheetDataStartsWithColumnNames', true);
            DataImportSettings.makeCheckable(this, 'sheetDataContainsRowLabels', true);

            (<any>this.fileSize).formatted = ko.computed(() => {
                return Utils.Input.explainFileSize(this.fileSize());
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            this.settings.isBusy(false);
            this.wasError(false);
            this.wasValidationError(false);
            this.validationResult(null);

            this.fileSize(data.fileSize || data.FileSize || 0);
            this.sheetDataStartsWithColumnNames(data.sheetDataStartsWithColumnNames || data.SheetDataStartsWithColumnNames || false);
            this.sheetDataContainsRowLabels(data.sheetDataContainsRowLabels || data.SheetDataContainsRowLabels || false);
        }

        /**  Serializes object state. */
        public serialize(): any {
            return {
                fileSize: this.fileSize(),
                sheetDataStartsWithColumnNames: this.sheetDataStartsWithColumnNames(),
                sheetDataContainsRowLabels: this.sheetDataContainsRowLabels()
            };
        }

        /** Resets the settings. */
        public reset() {
            this.wasError(false);
            this.wasValidationError(false);
            this.validationResult(null);
            this.settings.isBusy(false);
            this.fileSize(0);
            this.sheetDataStartsWithColumnNames(false);
            this.sheetDataContainsRowLabels(false);
        }

        /** Returns the imported data. */
        public getData(): DataTable {
            return null;
        }

        /**
         * Normalizes the given data table according to the current settings.
         * @param {DataTable} data Data table.
         */
        public normalizeData(data: DataTable): DataTable {
            return new DataTable(Utils.DataImportHandler.normalizeData(data.serialize(),
                this.sheetDataContainsRowLabels(), this.sheetDataStartsWithColumnNames()));
        }
    }

    /** Represents URL data import settings. */
    export class UrlDataImportSettings extends SourceDataImportSettingsBase {
        /** Gets or sets the Google Spreadsheet URL. */
        public url: KnockoutObservable<string>;

        /** Gets or sets the sheet data. */
        public sheetData: DataTable;

        /** Gets or sets URL change timer. */
        private _urlChangeTimer: number;

        /** Gets or sets the previous URL. */
        private _previousUrl: string;

        /** Gets or sets the import handler. */
        private _handler: Utils.DataImportHandler;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {DataImportSettings} settings Settings.
         */
        constructor(data?: any, settings?: DataImportSettings) {
            this.sheetData = new DataTable();
            this.url = ko.observable<string>();
            this._handler = this.createHandler();

            super(data, settings);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            super.load(data);

            this.url(data.url || data.Url || '');
            this.sheetData.load(data.sheetData || data.SheetData);
        }

        /**  Serializes object state. */
        public serialize(): any {
            return $.extend(super.serialize(), {
                sheetData: this.sheetData.serialize(),
                url: this.url()
            });
        }

        /** Resets the settings. */
        public reset() {
            super.reset();

            clearTimeout(this._urlChangeTimer);
            this._urlChangeTimer = null;

            this.url('');
            this.sheetData.clear();
            this._previousUrl = '';
        }

        /**
         * Occurs when URL changes (the actual logic is executed by timer).
         * @param {string} url URL.
         * @param {number} delay Delay.
         * @param {Event} e Event object.
         */
        public onUrlChangedWithDelay(url: string, delay?: number, e?: Event) {
            var keyCode = -1, evaluateImmediately = false;

            this.wasError(false);
            this.wasValidationError(false);
            this.validationResult(null);

            if (e) {
                keyCode = (<any>e).keyCode || (<any>e).charCode || (<any>e).which;

                if (keyCode === 13) {
                    this._previousUrl = null;
                    evaluateImmediately = true;
                }
            }

            if (this._urlChangeTimer) {
                clearTimeout(this._urlChangeTimer);
                this._urlChangeTimer = null;
            }

            if (evaluateImmediately) {
                this.onUrlChanged(url);
            } else {
                this._urlChangeTimer = setTimeout(() => {
                    this.onUrlChanged(url);
                }, delay || 350);
            }
        }

        /**
         * Occurs when URL changes.
         * @param {string} url Spreadsheet URL.
         */
        public onUrlChanged(url: string) {
            var actualUrl = '', app = Ifly.App.getInstance(), evalParameter = p => {
                var result = this.settings.options[p];

                if ($.isFunction(result)) {
                    result = result();
                }

                return result;
            };

            if (url && url.length && this._previousUrl != url) {
                this._previousUrl = url;

                actualUrl = this._handler.getActualUrl(url);

                this.settings.isBusy(false);
                this.wasError(!actualUrl || !actualUrl.length);
                this.wasValidationError(false);
                this.validationResult(null);

                if (actualUrl && actualUrl.length) {
                    this.settings.isBusy(true);
                    this.wasError(false);
                    app.api.beginShowProgress();

                    this._handler.importData(url, {
                        complete: (error: boolean, xhr: any) => {
                            this.settings.isBusy(false);
                            this.wasError(!!error);
                            app.api.hideProgress();

                            this.fileSize((xhr.responseText || '').length);
                        }, success: (data: any, size: number) => {
                            this.sheetData.clear();
                            this.sheetData.load(data);

                            this.fileSize(size);
                        }, error: (xhr, validationResult?) => {
                            this.wasError(true);
                            this.wasValidationError(validationResult != null && !validationResult.success);
                            this.validationResult(validationResult);
                        },
                        proposeNewDataSettings: (sheetDataContainsRowLabels: boolean, sheetDataStartsWithColumnNames: boolean) => {
                            this.sheetDataContainsRowLabels(sheetDataContainsRowLabels);
                            this.sheetDataStartsWithColumnNames(sheetDataStartsWithColumnNames);
                        }
                    }, {
                        validate: evalParameter('validateAgainstElementType')
                    });
                }
            }
        }

        /** Creates data import handler. */
        public createHandler(): Utils.DataImportHandler {
            return new Utils.UrlDataImportHandler();
        }

        /** Returns the imported data. */
        public getData(): DataTable {
            return new DataTable(Utils.DataImportHandler.normalizeData(this.sheetData.serialize(),
                this.sheetDataContainsRowLabels(), this.sheetDataStartsWithColumnNames()));
        }
    }

    /** Represents Google data import settings. */
    export class GoogleDataImportSettings extends UrlDataImportSettings {
        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {DataImportSettings} settings Settings.
         */
        constructor(data?: any, settings?: DataImportSettings) {
            super(data, settings);
        }

        /** Creates data import handler. */
        public createHandler(): Utils.DataImportHandler {
            return new Utils.GoogleSpreadsheetsDataImportHandler();
        }
    }

    /** Represents Google Analytics data select period. */
    export enum GoogleAnalyticsDataSelectPeriod {
        /** Day. */
        day = 0,

        /** Week. */
        week = 1,

        /** Month. */
        month = 2,

        /** Quarter. */
        quarter = 3,

        /** Year. */
        year = 4
    }

    /** Represents Google Analytics AnyData settings. */
    export class GoogleAnalyticsAnyDataSettings extends Ifly.EventSource {
        /** Gets or sets the dimensions. */
        public dimension: GoogleAnalyticsAnyDataValue;

        /** Gets or sets the metrics. */
        public metric: GoogleAnalyticsAnyDataValue;

        /** Gets or sets the suggestion service. */
        public suggestionService: IGoogleAnalyticsAnyDataSuggestionService;

        /** Initializes a new instance of an object. */
        constructor() {
            super();

            this.dimension = new GoogleAnalyticsAnyDataValue('dimension', this);
            this.metric = new GoogleAnalyticsAnyDataValue('metric', this);
        }

        /**
         * Occurs when AnyValue changes.
         * @param {string} name Name.
         * @param {string} value Value.
         */
        public onValueChanged(name: string, value: string) {
            this.dispatchEvent('valueChanged', { name: name, value: value });
        }

        /**
         * Performs item suggestion.
         * @param {string} name Name.
         * @param {string} value Value.
         */
        public suggestItems(name: string, value: string): Ifly.Utils.IListItem[]{
            return this.suggestionService != null ? this.suggestionService.suggestItems(name, value) : [];
        }
    }

    /** Represents Google Analytics AnyData value. */
    export class GoogleAnalyticsAnyDataValue {
        /** Gets or sets the name. */
        public name: KnockoutObservable<string>;

        /** Gets or sets the value. */
        public value: KnockoutObservable<string>;

        /** Gets or sets the real value. */
        public realValue: KnockoutObservable<string>;

        /** Gets or sets the settings. */
        public settings: GoogleAnalyticsAnyDataSettings;

        /**
         * Initializes a new instance of an object.
         * @param {string} name Name.
         * @param {GoogleAnalyticsAnyDataSettings} settings Settings.
         */
        constructor(name: string, settings: GoogleAnalyticsAnyDataSettings) {
            this.settings = settings;
            this.name = ko.observable<string>(name);
            this.value = ko.observable<string>();
            this.realValue = ko.observable<string>();

            this.value.subscribe(v => {
                if (!v || !v.length) {
                    settings.onValueChanged(this.name(), '');
                }
            });

            this.realValue.subscribe(v => {
                settings.onValueChanged(this.name(), v);
            });
        }

        /**
         * Performs item suggestion.
         * @param {string} value Value.
         */
        public suggest(value: string): Ifly.Utils.IListItem[] {
            return this.settings.suggestItems(this.name(), value);
        }
    }

    /** Represents Google Analytics data import settings. */
    export class GoogleAnalyticsDataImportSettings extends SourceDataImportSettingsBase {
        /** Gets or sets value indicating whether the authorization check is being made. */
        public isCheckingAuthorization: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether authorization is required. */
        public authorizationRequired: KnockoutObservable<boolean>;

        /** Gets or sets the Googne Analytics profile Id. */
        public profileId: KnockoutObservable<string>;

        /** Gets or sets the AnyData settings. */
        public anyData: GoogleAnalyticsAnyDataSettings;

        /** Gets or sets data select period. */
        public selectPeriod: KnockoutObservable<GoogleAnalyticsDataSelectPeriod>;

        /** Gets or sets all available dimensions. */
        public dimensions: IGoogleAnalyticsDimension[];

        /** Gets or sets all available metrics. */
        public metrics: IGoogleAnalyticsMetric[];

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {DataImportSettings} settings Settings.
         */
        constructor(data?: any, settings?: DataImportSettings) {
            var authAppearingTimer = null, authCheckTimer = null, authSwitchStateTimer = null;

            this.profileId = ko.observable<string>();
            this.selectPeriod = ko.observable<GoogleAnalyticsDataSelectPeriod>();
            this.dimensions = [];
            this.metrics = [];
            this.anyData = new GoogleAnalyticsAnyDataSettings();

            super(data, settings);

            this.authorizationRequired = ko.observable<boolean>(false);
            this.isCheckingAuthorization = ko.observable<boolean>(false);
            (<any>this.authorizationRequired).appearing = ko.observable<boolean>(false);
            (<any>this.isCheckingAuthorization).finished = ko.observable<boolean>(true);

            this.authorizationRequired.subscribe(v => {
                if (authAppearingTimer) {
                    clearTimeout(authAppearingTimer);
                }

                if (v) {
                    authAppearingTimer = setTimeout(() => {
                        (<any>this.authorizationRequired).appearing(true);
                    }, 25);
                } else {
                    (<any>this.authorizationRequired).appearing(false);
                }
            });

            settings.sourceType.subscribe(v => {
                this.isCheckingAuthorization(false);
                (<any>this.isCheckingAuthorization).finished(true);

                if (authCheckTimer) {
                    clearTimeout(authCheckTimer);
                }

                if (authSwitchStateTimer) {
                    clearTimeout(authSwitchStateTimer);
                }

                if (v == DataImportSourceType.googleAnalytics) {
                    authCheckTimer = setTimeout(() => {
                        this.isCheckingAuthorization(true);
                    }, 1000);
                    
                    this.authorizationRequired(false);

                    authSwitchStateTimer = setTimeout(() => {
                        Ifly.App.getInstance().api.google.modules.analytics.checkAuthorizationStatus(result => {
                            if (authCheckTimer) {
                                clearTimeout(authCheckTimer);
                            }

                            if (authSwitchStateTimer) {
                                clearTimeout(authSwitchStateTimer);
                            }

                            this.isCheckingAuthorization(false);
                            (<any>this.isCheckingAuthorization).finished(true);

                            if (!result.authorized) {
                                this.authorizationRequired(true);
                            } else {
                                this.onAuthorized(result);
                            }
                        });
                    }, 500);
                }
            });

            this.profileId.subscribe(v => {
                this.settings.parameter('profileId', v);
            });

            this.selectPeriod.subscribe(v => {
                this.settings.parameter('selectPeriod', v.toString());
            });
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var anyData = null;

            data = data || {};

            super.load(data);

            this.profileId(data.profileId || data.ProfileId || '');
            this.selectPeriod(data.selectPeriod || data.SelectPeriod || 0);

            anyData = data.anyData || {};

            this.anyData.dimension.value(anyData.dimensionValue || anyData.DimensionValue || '');
            this.anyData.dimension.realValue(anyData.dimensionRealValue || anyData.DimensionRealValue || '');
            this.anyData.metric.value(anyData.metricValue || anyData.MetricValue || '');
            this.anyData.metric.realValue(anyData.metricRealValue || anyData.MetricRealValue || '');
        }

        /**  Serializes object state. */
        public serialize(): any {
            return $.extend(super.serialize(), {
                profileId: this.profileId(),
                selectPeriod: this.selectPeriod()
            });
        }

        /**
         * Performs dimension suggestion.
         * @param {string} value Value.
         * @param {boolean} exactMatch Value indicating whether to perform exact match.
         */
        public suggestDimensions(value: string, exactMatch?: boolean): IGoogleAnalyticsDimension[] {
            var v = (value || '');

            if (!exactMatch) {
                v = v.toLowerCase();
            }

            return v.length ? ko.utils.arrayFilter(this.dimensions, m => {
                return exactMatch ? (m.id == v || m.name == v) : (m.id.indexOf(v) >= 0 || m.name.toLowerCase().indexOf(v) >= 0);
            }) : [];
        }

        /**
         * Performs metric suggestion.
         * @param {string} value Value.
         * @param {boolean} exactMatch Value indicating whether to perform exact match.
         */
        public suggestMetrics(value: string, exactMatch?: boolean): IGoogleAnalyticsMetric[]{
            var v = (value || '');

            if (!exactMatch) {
                v = v.toLowerCase();
            }

            return v.length ? ko.utils.arrayFilter(this.metrics, m => {
                return exactMatch ? (m.id == v || m.name == v) : (m.id.indexOf(v) >= 0 || m.name.toLowerCase().indexOf(v) >= 0);
            }) : [];
        }

        /** Resets the settings. */
        public reset() {
            super.reset();

            this.profileId('');
            this.selectPeriod(GoogleAnalyticsDataSelectPeriod.day);

            this.anyData.dimension.value('');
            this.anyData.dimension.realValue('');

            this.anyData.metric.value('');
            this.anyData.metric.realValue('');
        }

        /** Authorizes Sprites to access Google Analytics API. */
        public authorize() {
            Ifly.App.getInstance().api.google.modules.analytics.authorize((result) => {
                this.onAuthorized(result);
            });
        }

        /** 
         * Occurs when user has authorized Google Analytics.
         * @param {object} result Authorization result.
         */
        public onAuthorized(result) {
            if (result.accessToken) {
                this.authorizationRequired(false);
            }

            this.loadDimensionsAndMetrics();
        }

        /**
         * Loads Analytics dimensions and metrics.
         * @param {Function} onComplete A callback.
         */
        public loadDimensionsAndMetrics(onComplete?: Function) {
            if (!this.dimensions.length || !this.metrics.length) {
                Ifly.App.getInstance().api.google.modules.analytics.ensureMetadata(() => {
                    Ifly.App.getInstance().api.google.modules.analytics.getDimensions(dimensions => {
                        this.dimensions = dimensions.sort((x, y) => x.name.localeCompare(y.name));

                        Ifly.App.getInstance().api.google.modules.analytics.getMetrics(metrics => {
                            this.metrics = metrics.sort((x, y) => x.name.localeCompare(y.name));

                            if (onComplete) {
                                onComplete();
                            }
                        });
                    });
                });
            } else {
                if (onComplete) {
                    onComplete();
                }
            }
        }

        /** Creates data import handler. */
        public createHandler(): Utils.DataImportHandler {
            return new Utils.UrlDataImportHandler();
        }

        /** Returns the imported data. */
        public getData(): DataTable {
            return super.normalizeData(new DataTable());
        }

        /** 
         * Occurs when select period is changing.
         * @param {GoogleAnalyticsDataSelectPeriod} period Select period.
         * @param {Event} e Event object.
         */
        private onSelectPeriodChanging(period: GoogleAnalyticsDataSelectPeriod, e: Event) {
            this.selectPeriod(period);
            $(e.target).parents('.dropdown').blur();
        }
    }

    /** Represents Excel data import settings. */
    export class ExcelDataImportSettings extends SourceDataImportSettingsBase {
        /** Gets or sets value indicating whether Excel import is uploading a file. */
        public isUploading: KnockoutObservable<boolean>;

        /** Gets or sets the zero-based index of a target Excel sheet. */
        public targetSheetIndex: KnockoutObservable<number>;

        /** Gets or sets the list of available Excel sheets. */
        public availableSheets: KnockoutObservableArray<string>;

        /** Gets or sets the Excel sheet data. */
        public sheetData: KnockoutObservableArray<DataTable>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {DataImportSettings} settings Settings.
         */
        constructor(data?: any, settings?: DataImportSettings) {
            this.sheetData = ko.observableArray<DataTable>();
            this.isUploading = ko.observable<boolean>();
            this.availableSheets = ko.observableArray<string>();
            this.targetSheetIndex = ko.observable<number>();

            (<any>this.targetSheetIndex).text = ko.computed(() => {
                var v = parseInt(<any>this.targetSheetIndex(), 10), ret = '';

                if (v >= 0 && this.availableSheets().length > 0 && v < this.availableSheets().length) {
                    ret = this.availableSheets()[v];
                }

                return ret;
            });

            super(data, settings);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            data = data || {};

            super.load(data);

            this.isUploading(false);
            this.targetSheetIndex(data.targetSheetIndex || data.TargetSheetIndex || 0);
            this.availableSheets.removeAll();

            ko.utils.arrayForEach(data.availableSheets || data.AvailableSheets || [], (e: string) => {
                if (e && e.length) {
                    this.availableSheets.push(e);
                }
            });

            this.sheetData.removeAll();

            ko.utils.arrayForEach(data.sheetData || data.SheetData || [], (e: any) => {
                if (e) {
                    this.sheetData.push(new DataTable(e));
                }
            });

            this.onSheetSelected(this.targetSheetIndex());
        }

        /**  Serializes object state. */
        public serialize() {
            return $.extend(super.serialize(), {
                targetSheetIndex: this.targetSheetIndex() || 0,
                availableSheets: this.availableSheets(),
                sheetData: ko.utils.arrayMap(this.sheetData(), d => d.serialize())
            });
        }

        /** Resets the settings. */
        public reset() {
            super.reset();

            this.isUploading(false);
            this.availableSheets.removeAll();
            this.sheetData.removeAll();
        }

        /** 
         * Uploads the given Excel/CSV data when the file is selected.
         * @param {object} e Event object.
         */
        public onFileSelected(e: any) {
            var app = Ifly.App.getInstance(), modal = null;

            this.settings.isBusy(true);
            this.isUploading(true);
            this.wasError(false);
            this.wasValidationError(false);
            this.validationResult(null);

            app.api.upload('import/excel/upload', e.target, result => {
                var o = null;

                try {
                    o = JSON.parse(result);
                } catch (ex) { }

                Utils.UploadButtonHandler.resetInput($(e.target).parent());
                
                this.settings.isBusy(false);
                this.isUploading(false);
                this.wasError(o == null);

                if (o != null) {
                    this.load(o);
                } 
            });
        }

        /** 
         * Occurs when Excel sheet is selected.
         * @param {number} targetSheetIndex Target sheet index.
         */
        public onSheetSelected(targetSheetIndex: number) {
            this.targetSheetIndex(targetSheetIndex);
            this.settings.container.find('.sheet-selector').blur();
        }

        /** Returns the imported data. */
        public getData(): DataTable {
            return this.sheetData().length > 0 && this.targetSheetIndex() >= 0 &&
                this.targetSheetIndex() < this.sheetData().length ?
                this.normalizeData(this.sheetData()[this.targetSheetIndex()]) : new DataTable();
        }
    }

    /** Represents a data import settings. */
    export class DataImportSettings implements IModel {
        /** Gets or sets the container. */
        public container: JQuery;

        /** Gets or sets value indicating whether settings are being processed. */
        public isBusy: KnockoutObservable<boolean>;

        /** Gets or sets the source type. */
        public sourceType: KnockoutObservable<DataImportSourceType>;

        /** Gets or sets the Excel data import settings. */
        public excel: ExcelDataImportSettings;

        /** Gets or sets the Google data import settings. */
        public google: GoogleDataImportSettings;

        /** Gets or sets the Google Analytics data import settings. */
        public googleAnalytics: GoogleAnalyticsDataImportSettings;

        /** Gets or sets the URL data import settings. */
        public url: UrlDataImportSettings;

        /** Gets or sets custom options. */
        public options: any;

        /** Gets or sets endpoint parameters. */
        public parameters: Ifly.Utils.IQueryParameter[];

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         * @param {object} container DOM element which corresponds to a view container.
         */
        constructor(data?: any, container?: any, options?: any) {
            this.container = $(container);
            this.isBusy = ko.observable<boolean>();
            this.sourceType = ko.observable<DataImportSourceType>();
            this.excel = new ExcelDataImportSettings(null, this);
            this.google = new GoogleDataImportSettings(null, this);
            this.googleAnalytics = new GoogleAnalyticsDataImportSettings(null, this);
            this.url = new UrlDataImportSettings(null, this);
            this.options = options || {};
            this.parameters = [];

            DataImportSettings.makeCheckable(this, 'sourceType');

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var parameters = null, parametersDeserialized = [];

            data = data || {};

            this.isBusy(false);
            this.parameters = [];

            this.sourceType(data.sourceType || data.SourceType || 0);
            this.excel.load(data.excel || data.Excel);
            this.google.load(data.google || data.Google);
            this.googleAnalytics.load(data.googleAnalytics || data.GoogleAnalytics);

            this.url.load(data.url || data.Url);

            this.parameters = [];
            parameters = data.parameters || data.Parameters;

            if (parameters) {
                if ($.isArray(parameters)) {
                    parametersDeserialized = parameters;
                } else {
                    parametersDeserialized = Utils.Input.deserializeQuery(parameters);
                }

                ko.utils.arrayForEach(parametersDeserialized, p => {
                    this.parameters[this.parameters.length] = p;
                });
            }
        }

        /**  Serializes object state. */
        public serialize(): any {
            var data = null, t = this.sourceType();

            if (t == DataImportSourceType.excel) {
                data = this.excel.getData();
            } else if (t == DataImportSourceType.google) {
                data = this.google.getData();
            } else if (t == DataImportSourceType.googleAnalytics) {
                data = this.googleAnalytics.getData();
            } else if (t == DataImportSourceType.url) {
                data = this.url.getData();
            } 

            return {
                sourceType: t,
                data: data.serialize(),
                parameters: Utils.Input.serializeQuery(this.parameters)
            };
        }

        /**
         * Adds, updates or deletes the given parameter.
         * @param {string} name Parameter name.
         * @param {string} value Parameter value.
         */
        public parameter(name: string, value?: string): string {
            var ret = null, index = -1;

            for (var i = 0; i < this.parameters.length; i++) {
                if (this.parameters[i].name == name) {
                    index = i;
                    break;
                }
            }

            if (typeof (value) === 'undefined' || value === null) {
                if (index >= 0) {
                    ret = this.parameters[index].value;
                }
            } else if (value === '') {
                if (index >= 0) {
                    this.parameters.splice(index, 1);
                }
            } else {
                if (index >= 0) {
                    this.parameters[index].value = value;
                } else {
                    this.parameters[this.parameters.length] = {
                        name: name,
                        value: value
                    };
                }
            }

            return ret;
        }

        /** Resets the data. */
        public reset() {
            this.excel.reset();
            this.google.reset();
            this.googleAnalytics.reset();
            this.url.reset();

            this.isBusy(false);
            this.sourceType(0);
        }

        /** 
         * Makes the given property checkable.
         * @param {object} instance Object instance.
         * @param {string} propertyName Property name.
         * @param {boolean} isBoolean Value indicating whether property is boolean.
         */
        public static makeCheckable(instance: any, propertyName: string, isBoolean?: boolean) {
            instance[propertyName].checkable = ko.computed({
                read: () => {
                    var v = instance[propertyName]();

                    return (isBoolean ? !!v : (v || 0)).toString();
                },
                write: (v) => {
                    if (isBoolean) {
                        instance[propertyName](v == 'true');
                    } else {
                        instance[propertyName](parseInt((v || '').toString(), 10));
                    }
                }
            });
        }
    }

    /** Represents a data import modal. */
    export class DataImportModal extends ModalForm<DataImportSettings> {
        /** Gets or sets the current instance of the modal. */
        private static _instance: DataImportModal;

        /** Gets or sets an optional callback that is called when data is saved. */
        private _saved: Function;

        /** Initializes a new instance of an object. */
        constructor() {
            super('#data-import', () => {
                return new DataImportSettings(null, this.container);
            });
        }

        /** 
         * Opens the dialog.
         * @param {object} data Data.
         * @param {object} options Custom options.
         */
        public open(data?: any, options?: any) {
            var app = Ifly.App.getInstance(), o = options || {},
                c = app.components['DataImportModal'];

            super.load(data);

            this._saved = o.save;

            if (!this.modal) {
                this.modal = app.openModal({
                    content: this.container,
                    replaceCurrent: true,
                    buttons: [
                        {
                            text: c.terminology.save,
                            click: () => { this.save(); }
                        },
                        {
                            text: c.terminology.cancel,
                            click: () => { this.cancel(); }
                        }
                    ]
                });
            } else {
                this.modal.open();
            }

            this.enabled(true);

            Ifly.App.getInstance().trackEvent('discover', 'data import');
        }

        /** Saves the data. */
        public save() {
            var serialized = this.data.serialize();

            Ifly.App.getInstance().trackEvent('act', 'data import');

            if (this._saved) {
                this._saved(serialized);
                this._saved = null;
            }

            this.close();
        }

        /** Closes the window. */
        public close() {
            this.data.reset();
            super.close();
        }

        /** Returns the current instance of the modal. */
        public static getInstance(): DataImportModal {
            if (!this._instance) {
                this._instance = new DataImportModal();
            }

            return this._instance;
        }
    }
}