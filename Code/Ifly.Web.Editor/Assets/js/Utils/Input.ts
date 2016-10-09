module Ifly.Utils {
    /** Represents list item. */
    export interface IListItem {
        /** Gets or sets the label. */
        label: string;

        /** Gets or sets the value. */
        value: string;
    }

    /** Represents query parameter. */
    export interface IQueryParameter {
        /** Gets or sets parameter name. */
        name: string;

        /** Gets or sets parameter value. */
        value: string;
    }

    /** Represents data import handler options. */
    export interface IDataImportHandlerOptions {
        /** Gets or sets the data validation criterion. */
        validate?: any;

        /** Gets or sets custom parameters. */
        parameters?: string;
    }

    /** Represents imported data integrity validation result. */
    export interface IDataImportIntegrityValidationResult {
        /** Gets or sets the value indicating whether validation succeeded. */
        success: boolean;

        /** Gets or sets the list of missing fields. */
        missing: string[];

        /** Gets or sets the list of fields with invalid values. */
        invalidValue: string[];
    }

    /** Represents element schema field. */
    export interface IElementSchemaField {
        /** Gets or sets the field name. */
        name: string;

        /** Gets or sets value indicating whether this field is requred. */
        required: boolean;

        /** Gets or sets the value validator for the given field. */
        validator?: (v: any) => boolean;
    }

    /** Represents element schema. */
    export interface IElementSchema {
        /** Gets or sets the list of all fields. */
        fields: IElementSchemaField[];

        /** Gets or sets value indicating whether the given schema represents array element. */
        isArrayElement: boolean;

        /** Returns a field by its name. */
        getField: (name: string) => IElementSchemaField;
    }

    /** Represents data import callbacks. */
    export interface IDataImportHandlerCallbacks {
        /** Gets or sets the function which is executed when import completes (succeeds or fails). */
        complete?: (error: boolean, xhr: any, data?: any, size?: number) => any;

        /** Gets or sets the function which is executed when import succeeds. */
        success?: (data: any, size: number) => any;

        /** Gets or sets the function which is executed when import fails. */
        error?: (xhr: any, validationResult?: IDataImportIntegrityValidationResult) => any;
        
        /** Gets or sets the function which, when called, proposes new data settings. */
        proposeNewDataSettings?: (sheetDataContainsRowLabels: boolean, sheetDataStartsWithColumnNames: boolean) => any
    }

    /** Represents a data column of the imported data. */
    export interface IDataImportColumn {
        /** Gets or sets the column name. */
        name: string;
    }

    /** Represents a data cell of the imported data. */
    export interface IDataImportCell {
        /** Gets or sets the cell value. */
        value: string;
    }

    /** Represents a data row of the imported data. */
    export interface IDataImportRow {
        /** Gets or sets the cells. */
        cells: IDataImportCell[];
    }

    /** Represents a data sheet of the imported data. */
    export interface IDataImportSheet {
        /** Gets or sets the rows. */
        rows: IDataImportRow[];

        /** Gets or sets the columns. */
        columns: IDataImportColumn[];
    }

    /** Represents data import handler. */
    export class DataImportHandler {
        /** Gets or sets the sheet data. */
        public sheetData: IDataImportSheet;

        /** Initializes a new instance of an object. */
        constructor() {
            this.sheetData = {
                rows: [],
                columns: [],

                clear: () => {
                    this.sheetData.rows = [];
                    this.sheetData.columns = [];
                }
            };
        }

        /** 
         * Imports data.
         * @param {string} url Data URL.
         * @param {IDataImportHandlerCallbacks} callbacks Callbacks.
         * @param {IDataImportHandlerOptions} options Options.
         */
        public importData(url: string, callbacks: IDataImportHandlerCallbacks, options?: IDataImportHandlerOptions): boolean {
            if (callbacks) {
                (callbacks.success || function () { })({ rows: [], colums: [] }, 0);
            }

            return true;
        }

        /** 
         * Returns the actual URL to query.
         * @param {string} url URL typed by the user.
         */
        public getActualUrl(url: string): string {
            return url;
        }

        /** Returns request parameters. */
        public getRequestParameters(): any {
            return {};
        }

        /**
         * Validates the integrity of the data.
         * @param {IDataImportSheet} data Data import sheet.
         * @param {object} parameters Validation parameters.
         */
        public validateIntegrity(data: IDataImportSheet, parameters: any): IDataImportIntegrityValidationResult {
            var m = null, v = null, ret = { success: true, missing: [], invalidValue: [] }, schema = null,
                validateRow = (schema: IElementSchema, row: IDataImportRow) => {
                    var f = null, fMap = null, columnOffset = 0, cellPosition = 0;

                    fMap = {};

                    if (data.columns.length && data.columns[0].name === null) {
                        columnOffset = 1;
                    }

                    for (var i = columnOffset; i < data.columns.length; i++) {
                        f = schema.getField(data.columns[i].name);

                        if (f) {
                            cellPosition = i - columnOffset;
                            fMap[f.name] = {
                                field: f, value: cellPosition >= 0 && cellPosition < row.cells.length ?
                                    row.cells[cellPosition].value : null
                            };
                        }
                    }

                    for (var i = 0; i < schema.fields.length; i++) {
                        if (schema.fields[i].required && !fMap[schema.fields[i].name]) {
                            ret.success = false;

                            if (!m[schema.fields[i].name]) {
                                ret.missing[ret.missing.length] = schema.fields[i].name;
                                m[schema.fields[i].name] = true;
                            }
                        }
                    }

                    for (var p in fMap) {
                        if (typeof (fMap[p]) !== 'undefined' && fMap[p].field && fMap[p].field.validator) {
                            if (!fMap[p].field.validator(fMap[p].value)) {
                                if (!v[p]) {
                                    ret.invalidValue[ret.invalidValue.length] = p;
                                    ret.success = false;

                                    v[p] = true;
                                }
                            }
                        }
                    }
                };

            m = {};
            v = {};

            if (parameters && typeof (parameters.elementType) !== 'undefined') {
                schema = Input.getImportableElementSchema(parameters.elementType);
                
                if (schema && schema.fields) {
                    if (schema.isArrayElement) {
                        for (var i = 0; i < data.rows.length; i++) {
                            validateRow(schema, data.rows[i]);
                        }
                    } else if (data.rows.length) {
                        validateRow(schema, data.rows[0]);
                    }
                }
            }

            return ret;
        }

        /**
         * Normalizes the given data table according to the current settings.
         * @param {Object} data Data table.
         * @param {boolean} sheetDataContainsRowLabels Value indicating whether sheet data columns row labels.
         * @param {boolean} sheetDataStartsWithColumnNames Value indicating whether every row within sheet data starts with column names.
         */
        public static normalizeData(data: any, sheetDataContainsRowLabels: boolean, sheetDataStartsWithColumnNames: boolean): any {
            var ret = <any>{ rows: [], columns: [] }, rowOffset = 0, colOffset = 0, row = null, column = null, cell = null,
                getMaxRowSize = (d: any): number => {
                    var result = 0;

                    if (d.rows.length) {
                        for (var i = 0; i < d.rows.length; i++) {
                            if (result < d.rows[i].cells.length) {
                                result = d.rows[i].cells.length;
                            }
                        }
                    }

                    return result;
                };

            if (data) {
                if (!data.rows) data.rows = [];
                if (!data.columns) data.columns = [];

                if (data.rows.length > 0) {
                    if (data.columns.length) {
                        if (sheetDataContainsRowLabels) {
                            colOffset = 1;
                        }

                        for (var i = colOffset; i < data.columns.length; i++) {
                            ret.columns.push({ name: sheetDataStartsWithColumnNames ? data.columns[i].name : '' });
                        }

                        if (!sheetDataStartsWithColumnNames) {
                            row = { cells: [] };

                            for (var i = colOffset; i < data.columns.length; i++) {
                                row.cells.push({ value: data.columns[i].name });
                            }

                            ret.rows.push(row);
                        }
                    } else {
                        if (!sheetDataContainsRowLabels) {
                            ret.columns.push({ name: null });
                        }

                        if (sheetDataStartsWithColumnNames) {
                            rowOffset = 1;

                            for (var i = 0; i < data.rows[0].cells.length; i++) {
                                ret.columns.push({ name: data.rows[0].cells[i].value + '' });
                            }
                        } else {
                            for (var i = 0; i < getMaxRowSize(data); i++) {
                                ret.columns.push({ name: '' });
                            }
                        }
                    }

                    for (var i = rowOffset; i < data.rows.length; i++) {
                        row = { cells: [] };

                        if (!sheetDataContainsRowLabels) {
                            row.cells.push({ value: null });
                        }

                        for (var j = 0; j < data.rows[i].cells.length; j++) {
                            row.cells.push({
                                value: data.rows[i].cells[j].value,
                                realValue: data.rows[i].cells[j].realValue
                            });
                        }

                        ret.rows.push(row);
                    }

                    for (var i = 0; i < ret.columns.length; i++) {
                        column = ret.columns[i];

                        if (column.name != null) {
                            column.name = column.name + '';
                        }
                    }

                    for (var i = 0; i < ret.rows.length; i++) {
                        row = ret.rows[i];

                        for (var j = 0; j < row.cells.length; j++) {
                            cell = row.cells[j];

                            if (cell.value != null) {
                                cell.value = cell.value + '';
                            }
                        }
                    }
                }
            }

            return ret;
        }
    }

    /** Represents URL data import handler. */
    export class UrlDataImportHandler extends DataImportHandler {
        /** 
         * Imports data.
         * @param {string} url Data URL.
         * @param {IDataImportHandlerCallbacks} callbacks Callbacks.
         * @param {IDataImportHandlerOptions} options Options.
         */
        public importData(url: string, callbacks: IDataImportHandlerCallbacks, options?: IDataImportHandlerOptions): boolean {
            var actualUrl = this.getActualUrl(url), ret = actualUrl != null && actualUrl.length > 0, validationResult = null,
                onSuccess = (xhr) => {
                    if (callbacks.success) {
                        callbacks.success(this.sheetData, (xhr.responseText || '').length);
                    }
                };

            if (ret) {
                $.ajax(actualUrl, $.extend(this.getRequestParameters(), {
                    complete: (xhr: JQueryXHR) => {
                        var o = null, wasLoaded = false, t = xhr.responseText;

                        if (t.indexOf('"') == 0 && t.lastIndexOf('"') == (t.length - 1)) {
                            t = t.substr(1, t.length - 2);

                            t = t.replace(/\\"/g, '"');
                        }

                        try {
                            o = JSON.parse(t);
                        } catch (ex) { }

                        wasLoaded = this.loadSheetDataFromJson(o, callbacks ? callbacks.proposeNewDataSettings : null);

                        if (o != null && !wasLoaded) {
                            if (callbacks && callbacks.error) {
                                callbacks.error(xhr);
                            }
                        } else {
                            if (options && typeof (options.validate) !== 'undefined') {
                                validationResult = this.validateIntegrity(this.sheetData, {
                                    elementType: options.validate
                                });

                                if (validationResult != null && !validationResult.success) {
                                    if (callbacks && callbacks.error) {
                                        callbacks.error(xhr, validationResult);
                                    }
                                } else {
                                    onSuccess(xhr);
                                }
                            } else {
                                onSuccess(xhr);
                            }
                        }

                        if (callbacks && callbacks.complete) {
                            callbacks.complete(o == null || !wasLoaded, xhr,
                                this.sheetData, (xhr.responseText || '').length);
                        }
                    }
                }));
            } else if (callbacks) {
                if (callbacks.error) {
                    callbacks.error(null);
                }

                if (callbacks.complete) {
                    callbacks.complete(true, null);
                }
            }

            return ret;
        }

        /** 
         * Returns the actual URL to query.
         * @param {string} url URL typed by the user.
         */
        public getActualUrl(url: string): string {
            var apiRoot = Ifly.App.getInstance().api.root || '/view/embed',
                root = apiRoot + (apiRoot.lastIndexOf('/') == apiRoot.length - 1 ? '' : '/');

            return url && url.length ? (root + 'api/import/url/download?url=' + encodeURIComponent(url)) : '';
        }

        /** Returns request parameters. */
        public getRequestParameters(): any {
            return {
                type: 'post'
            };
        }

        /**
         * Loads sheet data from the given JSON.
         * @param {object} json JSON object.
         * @param {Function} proposeNewDataSettings A function which, when called, proposes new data settings.
         */
        public loadSheetDataFromJson(json: any, proposeNewDataSettings: (sheetDataContainsRowLabels: boolean, sheetDataStartsWithColumnNames: boolean) => any): boolean {
            var ret = false, row = null, tab = [],
                figureRegex = /[0-9,\.:\-\+\s]/g, textRegex = /[a-zA-Z]/g;

            this.sheetData = {
                rows: [],
                columns: []
            };

            if ($.isArray(json) && json.length) {
                if ($.isArray(json[0]) && json[0].length && $.grep(json[0], j => {
                    var result = $.isArray(j) && typeof (j[0]) == 'string' && textRegex.test(j[0]);

                    if (result) {
                        for (var k = 1; k < (<any>j).length; k++) {
                            result = typeof (j[k]) != 'string' || figureRegex.test(j[k]);
                            if (!result) {
                                break;
                            }
                        }
                    }

                    return result;
                }).length == json[0].length) {
                    /* Infogr.am data format (https://infogr.am/api/examples/live.json). */

                    tab = json[0];

                    if (proposeNewDataSettings) {
                        proposeNewDataSettings(true, false);
                    }

                    ret = true;
                } else {
                    /* Normal two-dimentional array. */

                    tab = json;

                    if (proposeNewDataSettings) {
                        proposeNewDataSettings(false, false);
                    }

                    ret = true;
                }

                if (tab && tab.length) {
                    for (var i = 0; i < tab.length; i++) {
                        row = { cells: [] };

                        for (var j = 0; j < tab[i].length; j++) {
                            row.cells.push({ value: tab[i][j] });
                        }

                        this.sheetData.rows.push(row);
                    }
                }
            } else {
                /* JSON literal - interpreting as single row. */

                row = { cells: [] };

                for (var p in json) {
                    this.sheetData.columns.push({ name: p });

                    if (typeof (json[p]) != 'function') {
                        row.cells.push({ value: json[p] });
                    }
                }

                this.sheetData.rows.push(row);

                if (proposeNewDataSettings) {
                    proposeNewDataSettings(false, true);
                }
            }

            return ret;
        }
    }

    /** Represents Google Spreadsheets data import handler. */
    export class GoogleSpreadsheetsDataImportHandler extends UrlDataImportHandler {
        /** 
         * Returns the actual URL to query.
         * @param {string} url URL typed by the user.
         */
        public getActualUrl(url: string): string {
            var prefix = '/d/', index = (url || '').toLowerCase().indexOf(prefix),
                key = '', endIndex = -1, ret = '';

            if (index > 0 && (url || '').indexOf('/a/') < 0) {
                endIndex = url.indexOf('/', index + prefix.length);

                key = url.substr(index + prefix.length, endIndex > 0 ?
                    (endIndex - (index + prefix.length)) : null);

                ret = 'https://spreadsheets.google.com/feeds/cells/' +
                    key + '/od6/public/values?alt=json';
            }

            return ret;
        }

        /** Returns request parameters. */
        public getRequestParameters(): any {
            return {
                type: 'get',
                dataType: 'json',
                contentType: 'application/json'
            };
        }

        /**
         * Loads sheet data from the given JSON.
         * @param {object} json JSON object.
         * @param {Function} proposeNewDataSettings A function which, when called, proposes new data settings.
         */
        public loadSheetDataFromJson(json: any, proposeNewDataSettings: (sheetDataContainsRowLabels: boolean, sheetDataStartsWithColumnNames: boolean) => any): boolean {
            var maxRow = 0, maxColumn = 0, entries = [],
                row = null, valueMap = {}, ret = false;

            this.sheetData = {
                rows: [],
                columns: []
            };

            if (json && json.feed && json.feed.entry) {
                entries = json.feed.entry;

                if (entries.length) {
                    entries = $.map(entries, e => {
                        var c = e['gs$cell'], result = null;

                        result = {
                            row: parseInt(c.row, 10),
                            column: parseInt(c.col, 10),
                            value: c['$t']
                        };

                        valueMap[(result.row - 1) + 'x' + (result.column - 1)] = result.value;

                        return result;
                    });

                    for (var i = 0; i < entries.length; i++) {
                        if (maxRow < entries[i].row) {
                            maxRow = entries[i].row;
                        }

                        if (maxColumn < entries[i].column) {
                            maxColumn = entries[i].column;
                        }
                    }

                    if (maxRow > 0 && maxColumn > 0) {
                        ret = true;

                        for (var i = 0; i < maxRow; i++) {
                            if (!this.sheetData.columns.length) {
                                this.sheetData.columns.push({
                                    name: null
                                });

                                for (var j = 0; j < maxColumn; j++) {
                                    this.sheetData.columns.push({
                                        name: valueMap[i + 'x' + j] || ''
                                    });
                                }
                            } else {
                                row = { cells: [] };

                                for (var j = 0; j < maxColumn; j++) {
                                    row.cells.push({ value: valueMap[i + 'x' + j] || '' });
                                }

                                this.sheetData.rows.push(row);
                            }
                        }

                        if (proposeNewDataSettings) {
                            proposeNewDataSettings(false, true);
                        }
                    }
                }
            }

            return ret;
        }
    }

    /** Represents Google Analytics data import handler. */
    export class GoogleAnalyticsDataImportHandler extends DataImportHandler {
        /** 
         * Imports data.
         * @param {string} url Data URL.
         * @param {IDataImportHandlerCallbacks} callbacks Callbacks.
         * @param {IDataImportHandlerOptions} options Options.
         */
        public importData(url: string, callbacks: IDataImportHandlerCallbacks, options?: IDataImportHandlerOptions): boolean {
            var ret = false, mappings = [], query = Utils.Input.deserializeQuery(options ? options.parameters : ''), getValue = (c, n) => {
                var result = '';

                for (var i = 0; i < c.length; i++) {
                    if (c[i].name == n) {
                        result = c[i].value;
                        break;
                    }
                }

                return result;
            }, fromDate = new Date(), toDate = new Date(), metricsConcatenated = '', dimensionsConcatenated = '',
                metricsToFieldsMap = {}, fieldsToMetricsMap = {}, isAnyData = false, payload = null, formatDate = d => {
                var padLeft = v => {
                    var r = v.toString();
                    return r.length == 1 ? '0' + r : r;
                };
                return d.getFullYear() + '-' + padLeft(d.getMonth() + 1) + '-' + padLeft(d.getDate());
            }, selectPeriod = 0, day = 1000 * 60 * 60 * 24, onError = (d?) => {
                (callbacks.error || function () { })(null);
                (callbacks.complete || function () { })(true, null, d, null);
            }, onSuccess = d => {
                (callbacks.success || function () { })(d, null);
                (callbacks.complete || function () { })(true, null, d, null);
            };

            callbacks = callbacks || {};

            this.sheetData = {
                rows: [],
                columns: []
            };

            if (query && query.length) {
                ret = true;

                dimensionsConcatenated = getValue(query, 'anydata-dimension');
                metricsConcatenated = getValue(query, 'anydata-metric');

                if (metricsConcatenated || dimensionsConcatenated) {
                    isAnyData = true;
                } else {
                    mappings = Utils.Input.deserializeQuery(getValue(query, 'mappings'), ',', '-');
                    for (var i = 0; i < mappings.length; i++) {
                        fieldsToMetricsMap[mappings[i].name] = mappings[i].value;
                        metricsToFieldsMap[mappings[i].value] = mappings[i].name;

                        metricsConcatenated += mappings[i].value;
                        if (i < (mappings.length - 1)) {
                            metricsConcatenated += ',';
                        }
                    }
                }

                selectPeriod = parseInt(getValue(query, 'selectPeriod'), 10);
                if (selectPeriod === null || isNaN(selectPeriod) || selectPeriod < 0) {
                    selectPeriod = 0;
                }

                switch (selectPeriod) {
                    case 0: /* Last day. */
                        fromDate = new Date(fromDate.getTime() - day);
                        break;
                    case 1: /* Last week. */
                        fromDate = new Date(fromDate.getTime() - (day * 7));
                        break;
                    case 2: /* Last month. */
                        fromDate = new Date(fromDate.getTime() - (day * 31));
                        break;
                    case 3: /* Last quarter. */
                        fromDate = new Date(fromDate.getTime() - (day * 31 * 3));
                        break;
                    case 4: /* Last year. */
                        fromDate = new Date(fromDate.getTime() - (day * 31 * 12));
                        break;
                }

                if (metricsConcatenated.length && getValue(query, 'profileId')) {
                    Ifly.App.getInstance().api.google.modules.analytics.load(() => {
                        Ifly.App.getInstance().api.google.modules.analytics.ensureAuthorized(r => {
                            window['gapi'].auth.setToken({ access_token: r.accessToken });

                            payload = {
                                'ids': 'ga:' + getValue(query, 'profileId'),
                                'start-date': formatDate(fromDate),
                                'end-date': formatDate(toDate),
                                'metrics': metricsConcatenated
                            };

                            if (isAnyData) {
                                payload['dimensions'] = dimensionsConcatenated;
                            }

                            window['gapi'].client.analytics.data.ga.get(payload).execute(result => {
                                var data = result, row = { cells: [] }, columnsAdded = false;

                                if (data && data.rows && data.columnHeaders) {
                                    for (var i = 0; i < data.rows.length; i++) {
                                        row = { cells: [] };

                                        for (var j = 0; j < data.columnHeaders.length; j++) {
                                            row.cells[row.cells.length] = {
                                                value: data.rows[i][j]
                                            };

                                            if ((data.columnHeaders[j].dataType || '').toLowerCase() == 'integer') {
                                                row.cells[row.cells.length - 1].value =
                                                    Input.formatNumber(row.cells[row.cells.length - 1].value);
                                            } else if ((data.columnHeaders[j].dataType || '').toLowerCase() == 'percent') {
                                                row.cells[row.cells.length - 1].value =
                                                    Input.formatPercentage(row.cells[row.cells.length - 1].value);
                                            }

                                            if (!columnsAdded) {
                                                this.sheetData.columns[this.sheetData.columns.length] = {
                                                    name: metricsToFieldsMap[data.columnHeaders[j].name]
                                                };
                                            }
                                        }

                                        columnsAdded = true;

                                        this.sheetData.rows[this.sheetData.rows.length] = row;
                                    }
                                }

                                onSuccess(this.sheetData);
                            });
                        });
                    });
                } else {
                    onError();
                }
            }

            if (!ret) {
                onError();
            }

            return ret;
        }
    }

    /** Represents shortcut configuration. */
    export interface IShortcutHandlers {
        /** Gets or sets the "Copy" handler. */
        copy?: Function;

        /** Gets or sets the "Paste" handler. */
        paste?: Function;

        /** Gets or sets the "Left" handler. */
        left?: Function;

        /** Gets or sets the "Right" handler. */
        right?: Function;

        /** Gets or sets the "Up" handler. */
        up?: Function;

        /** Gets or sets the "Down" handler. */
        down?: Function;

        /** Gets or sets the "Space" handler. */
        space?: Function;

        /** Gets or sets the "Delete" handler. */
        del?: Function;
    }

    /** Represents asynchronous queue item. */
    export class AsyncQueueItem {
        /** Gets or sets the "resolve" callback. */
        private _resolve: Function[];

        /** Gets or sets the "resolve" result. */
        private _result: any;

        /** Gets or sets value indicating whether result has been obtained from the body of the task. */
        private _hasResult: boolean;

        /**
         * Initializes a new instance of an object.
         * @param {Function} task Task to execute.
         * @param {Function} signal A signal used to delay task execution.
         */
        constructor(task: (resolve: (result?: any) => any) => any, signal?: () => boolean) {
            var interval = -1, invokeTask = null;

            this._resolve = [];

            invokeTask = () => {
                setTimeout(() => {
                    task((result?) => {
                        this._result = result;
                        this._hasResult = true;

                        if (this._resolve) {
                            while (this._resolve.length) {
                                this.pop();
                            }
                        }
                    });
                }, 1);
            };

            if (signal) {
                interval = setInterval(() => {
                    if (signal()) {
                        clearInterval(interval);
                        invokeTask();
                    }
                }, 50);
            } else {
                invokeTask();
            }
        }

        /** 
         * Registers a callback to be execute when the task completes.
         * @param {Function} resolve A callback to register.
         */
        public then(resolve: (result?: any) => any) {
            this._resolve.push(resolve || function () { });

            if (this._hasResult) {
                this.pop();    
            }

            return this;
        }

        /** Executes the next callback and removes it from the list. */
        private pop() {
            if (this._resolve.length) {
                this._resolve.splice(0, 1)[0](this._result);
            }
        }
    }

    /** Represents asynchronous queue. */
    export class AsyncQueue {
        /** Gets or sets the queue items. */
        private _items: AsyncQueueItem[];

        /** Gets or sets task results. */
        private _results: any;

        /** Initializes a new instance of an object. */
        constructor() {
            this.clear();
        }

        /** 
         * Places the new task into the queue.
         * @param {Function} task Task to execute.
         * @param {string} id Task Id.
         * @return {string} Task Id.
         */
        public enqueue(task: (resolve: (result?: any) => any) => any, id?: string): string {
            var canExecute = false, sig = () => { return canExecute; },
                ret = id || (new Date().getTime().toString() + this._items.length),
                newItem = (withSignal?: boolean) => {
                    return new AsyncQueueItem(task, withSignal ? sig : null).then((result?) => {
                        this._results[ret] = result;
                    });
                };

            if (this._items.length) {
                this._items[this._items.length - 1].then((result?) => {
                    canExecute = true;
                });

                this._items[this._items.length] = newItem(true);
            } else {
                this._items[0] = newItem();
            }

            return ret;
        }

        /**
         * Registers a callback which is executed when all tasks in a queue are completed.
         * @param {Function} complete A callback.
         */
        public whenAll(complete: (results: any) => any) {
            setTimeout(() => {
                if (this._items.length) {
                    this._items[this._items.length - 1].then(() => {
                        complete(this._results);
                    });
                } else {
                    complete([]);
                }
            }, 100);
        }

        /** Removes all tasks from the queue. */
        public clear() {
            this._items = [];
            this._results = {};
        }
    }

    /** Represents time handling utils. */
    export class TimeHandling {
        /**
         * Returns presentation playback time.
         * @param {Presentation} presentation (or null to use the current presentation).
         */
        static getPresentationPlaybackTime(presentation?: Ifly.Models.Presentation) {
            var p = presentation || Ifly.Editor.getInstance().presentation,
                playbackTime = null,
                slides = [],
                ret = 0;

            if (p && p.slides().length) {
                slides = p.slides();

                for (var i = 0; i < slides.length; i++) {
                    playbackTime = slides[i].playbackTime();

                    if (playbackTime || playbackTime > 0) {
                        ret += playbackTime;
                    } else {
                        ret += 10;
                    }
                }
            }

            return ret;
        }

        /** 
         * Formats the time.
         * @param {number} v Value.
         */
        static formatTime(v: number): string {
            var ret = '', min = 0, sec = 0;

            if (v > 0) {
                min = parseInt(Math.floor(v / 60).toString(), 10);

                ret = min.toString();

                if (min == 0 || (min * 60) < v) {
                    sec = v - (min * 60);
                    ret += (':' + (sec < 10 ? '0' : '') + sec.toString());
                }

                if (ret.indexOf(':') < 0) {
                    ret += ':00';
                }
            } else {
                ret = '0:00';
            }

            return ret;
        }
    }

    /** Represents input helper. */
    export class Input {
        /**
         * Returns importable element schema.
         * @param {ElementType} type Element type.
         */
        public static getImportableElementSchema(type: Models.ElementType): IElementSchema {
            var ret = {
                fields: [],
                isArrayElement: false,
                getField: (name: string): IElementSchemaField => {
                    var result = null;

                    for (var i = 0; i < ret.fields.length; i++) {
                        if (ret.fields[i].name === name) {
                            result = ret.fields[i];
                            break;
                        }
                    }

                    return result;
                }
            }, af = (n: string, required: boolean, et?: any, minMax?: any[]) => {
                var f = {
                    name: n,
                    required: !!required,
                    validator: null
                };

                if (et) {
                    f.validator = v => typeof (et[v]) !== 'undefined';
                } else if (minMax) {
                    f.validator = v => {
                        var parsed = Input.getInt(v);
                        
                        return parsed != null && parsed.value >= minMax[0] && parsed.value <= minMax[1];
                    };
                }

                ret.fields[ret.fields.length] = f;
            };

            switch (type) {
                case Models.ElementType.text: 
                    af('text', true);

                    break;
                case Models.ElementType.fact:
                    af('quantity', false);
                    af('measure', false);
                    af('description', false);

                    break;
                case Models.ElementType.image:
                    af('url', true);
                    af('width', false, Models.ImageWidthScale);

                    break;
                case Models.ElementType.map:
                    ret.isArrayElement = true;

                    af('areaName', false);
                    af('areaCode', true);
                    af('density', false, Models.MapAnnotationDensity);
                    af('baseColor', false, Models.ColorType);
                    af('tooltip', false);

                    break;
                case Models.ElementType.chart:
                    ret = null;

                    break;
                case Models.ElementType.table:
                    ret = null;

                    break;
                case Models.ElementType.figure:
                    af('icon', false);
                    af('size', false, Models.FigureSetSize);
                    af('highlight', false);
                    af('highlightColor', false, Models.ColorType);

                    break;
                case Models.ElementType.progress:
                    ret.isArrayElement = true;

                    af('description', false);
                    af('percentage', true, null, [0, 100]);
                    af('color', false, Models.ColorType);

                    break;
                case Models.ElementType.callout:
                    af('text', true);

                    break;
                case Models.ElementType.timeline:
                    ret.isArrayElement = true;

                    af('label', true);
                    af('size', true, null, [0, 100]);
                    af('description', false);
                    af('style', false, Models.TimelineItemStyle);

                    break;
            }

            return ret;
        }

        /**
         * Creates new data import handler according to the given source type.
         * @param {number} sourceType Source type.
         */
        public static createDataImportHandler(sourceType: number): DataImportHandler {
            var ret = null;

            if (sourceType == 1) { /* Google Spreadsheets. */
                ret = new GoogleSpreadsheetsDataImportHandler();
            } else if (sourceType == 2) { /** Custom URL. */
                ret = new UrlDataImportHandler();
            } else if (sourceType == 3) { /** Google Analytics. */
                ret = new GoogleAnalyticsDataImportHandler();
            }

            return ret;
        }

        /**
         * Returns the object containing a number represented by the given input.
         * @param {object} input Input value.
         */
        public static getInt(input: any): any {
            var ret = null, str = '', isNumber = false;

            if (typeof (input) == 'number') {
                ret = { value: parseInt(input, 10) };
            } else {
                str = typeof (input) == 'string' ?
                    input : (input != null ? input.toString() : '');

                str = str.replace(/,|\.|\s/g, '');

                if (/^[0-9\-]+$/g.test(str)) {
                    ret = { value: parseInt(str, 10) };
                }
            }

            return ret;
        }

        /** 
         * Formats the number according to US locale.
         * @param {object} input Input value.
         */
        public static formatNumber(input: any): string {
            var ret = '', gs = 0, n = (typeof(input) !== 'undefined' && input != null ? input : '').toString();

            for (var i = n.length - 1; i >= 0; i--) {
                if (gs > 2) {
                    gs = 0;

                    if (i >= 0) {
                        ret += ',';
                    }
                }

                ret += n.charAt(i);

                gs++;
            }

            return ret.split('').reverse().join('');
        }

        /** 
         * Formats the percentage according to US locale.
         * @param {object} input Input value.
         */
        public static formatPercentage(input: any): string {
            var ret = '', gs = 0, n = parseFloat(input);

            if (n === null || isNaN(n) || n < 0) {
                ret = '0%';
            } else if (n > 100) {
                ret = '100%';
            } else {
                n = Math.round(Math.floor(n));

                if (n > 100) {
                    n = 100;
                }

                ret = n.toString() + '%';
            }

            return ret;
        }

        /**
         * Explains the given file size.
         * @param {number} input File size, in bytes.
         */
        public static explainFileSize(input: number): string {
            var n = 0, suffix = ' bytes';

            if (input > 1024) {
                n = input / 1024;
                suffix = 'KB';
            } else {
                n = input;
            }

            if (!isNaN(n) && n > 0) {
                n = Math.round(n * 10) / 10;
            }

            return n + suffix;
        }

        public static htmlEncode(input: string): string {
            var ret = input || '';

            ret = ret.replace(/&/g, '&amp;');
            ret = ret.replace(/</g, '&lt;');
            ret = ret.replace(/>/g, '&gt;');

            return ret;
        }

        public static htmlDecode(input: string): string {
            var ret = input || '';

            ret = ret.replace(/&lt;/g, '<');
            ret = ret.replace(/&gt;/g, '>');
            ret = ret.replace(/&amp;/g, '&');

            return ret;
        }

        public static htmlRemove(input: string): string {
            return $('<div />').html(input).text();
        }

        public static trim(input: string, trimInfo?: any): string {
            var firstMatch = (m: Function) => {
                var results = m();
                return results && results.length ? results[0] : null;
            };

            if (trimInfo) {
                trimInfo.before = firstMatch(() => input.match(/^\s+/g)) || '';
                trimInfo.after = firstMatch(() => input.match(/\s+$/g)) || '';
            }

            return input.replace(/^\s+|\s+$/g, '');
        }

        /**
         * Encodes the given JavaScript snippet so it can't be executed.
         * @param {string} contents Snippet to encode.
         */
        public static javascriptEncode(contents: string): string {
            var ret = this.javascriptDecode(contents || '');

            ret = ret.replace(/:\/\//g, '&c_wp;');
            ret = ret.replace(/</gi, '&lt_e;');
            ret = ret.replace(/\/\*/gi, '&c_s_e;');
            ret = ret.replace(new RegExp('\\*/', 'gi'), '&c_e_e;');
            ret = ret.replace(/\/\//gi, '&c_s_e;');
            ret = ret.replace(/\n/gi, '&n_e;');
            ret = ret.replace(/\t/gi, '&t_e;');

            return '#!#!' + ret;
        }

        /**
         * Decodes the given JavaScript snippet so it can be executed.
         * @param {string} contents Snippet to decode.
         */
        public static javascriptDecode(contents: string): string {
            var ret = contents || '', token = '#!#!';

            if (ret.indexOf(token) == 0) {
                ret = ret.replace(/&c_wp;/gi, '://');
                ret = ret.replace(/&lt_e;/gi, '<');
                ret = ret.replace(/&c_s_e;/gi, '/*');
                ret = ret.replace(/&c_e_e;/gi, '*/');
                ret = ret.replace(/&c_s_e;/gi, '//');
                ret = ret.replace(/&n_e;/gi, '\n');
                ret = ret.replace(/&t_e;/gi, '\t');

                if (ret.indexOf(token) == 0) {
                    ret = ret.substr(token.length);
                }
            }

            return ret;
        }

        /**
         * Converts size scale to actual percentage.
         * @param {object} scale Size scale.
         * @param {object} enumType Enumeration type.
         */
        public static sizeScaleToPercentage(scale: any, enumType?: any): number {
            var ret = 50, s = parseInt(scale, 10), grammar = {
                'five': 5, 'ten': 10, 'fifteen': 15, 'twenty': 20,
                'thirty': 30, 'fourty': 40, 'fifty': 50, 'sixty': 60,
                'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100
            }, accumulated = 0, literal = '', maxIterations = 10, tryReduce = null;

            if (typeof (enumType) === 'undefined' || enumType == null) {
                if (s === 0) { // ElementSizeScale.tenPercent
                    ret = 10;
                } else if (s === 1) { // ElementSizeScale.twentyFivePercent
                    ret = 25;
                } else if (s === 2) { // ElementSizeScale.thirtyFivePercent
                    ret = 35;
                } else if (s === 3) { // ElementSizeScale.fiftyPercent
                    ret = 50;
                } else if (s === 4) { // ElementSizeScale.seventyFivePersent
                    ret = 75;
                } else if (!isNaN(s)) {
                    ret = s;
                }
            } else if (s < 5) {
                tryReduce = (iter: number) => {
                    var ix = -1;

                    if (iter <= maxIterations) {
                        for (var p in grammar) {
                            ix = literal.indexOf(p);

                            if (ix >= 0) {
                                literal = (ix > 0 ? literal.substr(0, ix) : '') +
                                    ((ix + p.length) < literal.length ? literal.substr(ix + p.length) : '');

                                accumulated += grammar[p];

                                break;
                            }
                        }

                        if (ix >= 0) {
                            tryReduce(iter + 1);
                        }
                    }
                };

                literal = (enumType[s] || '').toLowerCase();
                literal = literal.replace(/percent/gi, '');

                if (literal == 'auto') {
                    ret = 0;
                } else {
                    if (literal && literal.length) {

                        tryReduce(1);
                        if (accumulated > 0) {
                            ret = accumulated;
                        }
                    }
                }
            } else {
                ret = s;
            }

            return ret;
        }

        /** 
         * Configures shortcut handlers.
         * @param {object} node DOM node.
         * @param {IShortcutHandlers} handlers Handlers.
         */
        public static configureShortcuts(node: any, handlers: IShortcutHandlers) {
            if (handlers) {
                if (handlers.copy) this.handleCtrlCombo(node, 67, 'combo_copy', handlers.copy);
                if (handlers.paste) this.handleCtrlCombo(node, 86, 'combo_paste', handlers.paste);

                if (handlers.left) this.handleCtrlCombo(node, 37, 'combo_left', handlers.left);
                if (handlers.right) this.handleCtrlCombo(node, 39, 'combo_right', handlers.right);

                if (handlers.up) this.handleCtrlCombo(node, 38, 'combo_up', handlers.up);
                if (handlers.down) this.handleCtrlCombo(node, 40, 'combo_down', handlers.down);

                if (handlers.space) this.handleCtrlCombo(node, 32, 'combo_space', handlers.space);

                if (handlers.del) this.handleCtrlCombo(node, [8, 46], 'combo_del', handlers.del);
            }
        }

        /**
         * Handles "CTRL+[key]" combo.
         * @param {object} node DOM node.
         * @param {number} keyCode Key code.
         * @param {string} name Command name.
         * @param {Function} onHandle An event handler.
         */
        public static handleCtrlCombo(node: any, keyCode: any, name: string, onHandle: Function) {
            var isCtrl = false, mac = Ifly.App.getInstance().browser.mac,
                keys = { ctrl: 17, cmd: 91 }, t = '', isKeyCode = k => {
                    var result = false;

                    if (typeof (keyCode) === 'number') {
                        result = k == keyCode;
                    } else if (keyCode.length) {
                        for (var i = 0; i < keyCode.length; i++) {
                            if (keyCode[i] == k) {
                                result = true;
                                break;
                            }
                        }
                    }

                    return result;
                };

            $(node)
                .unbind('.' + name)
                .bind({
                    keydown: e => {
                        t = (e.target.tagName || e.target.nodeName || '').toLowerCase();

                        if (t != 'input' && t != 'textarea') {
                            if (!isCtrl) {
                                isCtrl = e.ctrlKey || (mac && e.metaKey);
                            } else if (isKeyCode(e.keyCode)) {
                                onHandle(e);
                                e.preventDefault();
                            }
                        }
                    },
                    keyup: e => {
                        if (e.keyCode == keys.ctrl || e.keyCode == keys.cmd) {
                            isCtrl = false;
                        };
                    }
                });
        }

        /**
         * Deserializes the given query.
         * @param {string} input Input string.
         * @param {string} itemSeparator Custom item separator (default is "&").
         * @param {string} valueSeparator Custom value separator (default is "=").
         */
        public static deserializeQuery(input: string, itemSeparator?: string, valueSeparator?: string): IQueryParameter[] {
            var ret = [], pairs = [], pair = [], sanitized = this.trim(input || '');

            if (sanitized.indexOf('?') == 0) {
                sanitized = sanitized.substr(1);
            }

            if (sanitized.length) {
                pairs = sanitized.split(itemSeparator || '&');

                for (var i = 0; i < pairs.length; i++) {
                    pair = pairs[i].split(valueSeparator || '=');

                    ret[ret.length] = {
                        name: this.trim(pair[0]),
                        value: pair.length > 1 ? decodeURIComponent(this.trim(pair[1])) : ''
                    };
                }
            }

            return ret;
        }

        /**
         * Serializes the given query.
         * @param {IQueryParameter[]} query Query.
         * @param {string} itemSeparator Custom item separator (default is "&").
         * @param {string} valueSeparator Custom value separator (default is "=").
         */
        public static serializeQuery(query: IQueryParameter[], itemSeparator?: string, valueSeparator?: string): string {
            var ret = '', pairs = [], pair = '';

            if (query && query.length) {
                for (var i = 0; i < query.length; i++) {
                    pair = '';

                    if (query[i].name && query[i].name.length) {
                        pair += (this.trim(query[i].name) + (valueSeparator || '='));

                        if (query[i].value && query[i].value.length) {
                            pair += encodeURIComponent(query[i].value);
                        }

                        pairs[pairs.length] = pair;
                    }
                }

                if (pairs.length) {
                    ret = pairs.join(itemSeparator || '&');
                }
            }

            return ret;
        }

        /** 
         * Makes the given property checkable.
         * @param {object} objectInstance Object instance.
         * @param {string} propertyName Property name.
         * @param {boolean} isNumber Value indicating whether the underlying property is number.
         */
        public static makeCheckable(objectInstance: any, propertyName: string, isNumber?: boolean) {
            objectInstance[propertyName].checkable = ko.computed({
                read: () => {
                    return (isNumber ? (objectInstance[propertyName]() || 0) : ((objectInstance[propertyName]() || 0) ? 1 : 0)).toString();
                },
                write: (v) => {
                    if (isNumber) {
                        objectInstance[propertyName](parseInt((v || '').toString(), 10));
                    } else {
                        objectInstance[propertyName](parseInt((v || '').toString(), 10) > 0);
                    }
                }
            });
        }
    }
}