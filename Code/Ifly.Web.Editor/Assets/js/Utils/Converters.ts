module Ifly.Utils {
    export interface IElementPropertyConverter<T> {
        convertFromString(data: string): T;
        convertToString(data: T): string;
    }

    export class JsonPlainObjectConverter implements IElementPropertyConverter<any> {
        public convertFromString<any>(data: string): any {
            return data != null && data.length > 0 ? JSON.parse(data) : null;
        }

        public convertToString<any>(data: any): string {
            return data != null ? JSON.stringify(data) : '';
        }
    }

    export class JsonConverter<T> implements IElementPropertyConverter<T> {
        private _activator;

        constructor(activator) {
            this._activator = activator;
        }

        public convertFromString(data: string): T {
            return data != null && data.length > 0 ? new this._activator(JSON.parse(data)) : null;
        }

        public convertToString(data: T): string {
            return data != null ? JSON.stringify((<any>data).serialize()) : '';
        }
    }

    export class TimelineItemConverter extends JsonConverter<Ifly.Models.TimelineItem> {
        constructor() { super(Ifly.Models.TimelineItem); }
    }

    export class TimelineItemArrayConverter implements IElementPropertyConverter<Array<Ifly.Models.TimelineItem>> {
        public convertFromString(data: string): Array<Ifly.Models.TimelineItem> {
            return data != null && data.length > 0 ? JSON.parse(data).items.map((t) => { return new Ifly.Models.TimelineItem(t); }) : null;
        }

        public convertToString(data: Array<Ifly.Models.TimelineItem>): string {
            var c = new TimelineItemConverter();

            return data != null ? '{ "items": [' + data.map((t) => { return c.convertToString(t); }).join(',') + '] }' : '';
        }
    }

    export class ProgressBarConverter extends JsonConverter<Ifly.Models.ProgressBar> {
        constructor() { super(Ifly.Models.ProgressBar); }
    }

    export class ProgressBarArrayConverter implements IElementPropertyConverter<Array<Ifly.Models.ProgressBar>> {
        public convertFromString(data: string): Array<Ifly.Models.ProgressBar> {
            return data != null && data.length > 0 ? JSON.parse(data).bars.map((b) => { return new Ifly.Models.ProgressBar(b); }) : null;
        }

        public convertToString(data: Array<Ifly.Models.ProgressBar>): string {
            var c = new ProgressBarConverter();

            return data != null ? '{ "bars": [' + data.map((b) => { return c.convertToString(b); }).join(',') + '] }' : '';
        }
    }

    export class MapAnnotationConverter extends JsonConverter<Ifly.Models.MapAnnotation> {
        constructor() { super(Ifly.Models.MapAnnotation); }
    }

    export class MapAnnotationArrayConverter implements IElementPropertyConverter<Array<Ifly.Models.MapAnnotation>> {
        public convertFromString(data: string): Array<Ifly.Models.MapAnnotation> {
            return data != null && data.length > 0 ? JSON.parse(data).annotations.map((annon) => { return new Ifly.Models.MapAnnotation(annon); }) : null;
        }

        public convertToString(data: Array<Ifly.Models.MapAnnotation>): string {
            var c = new MapAnnotationConverter();

            return data != null ? '{ "annotations": [' + data.map((annon) => { return c.convertToString(annon); }).join(',') + '] }' : '';
        }
    }

    export class DataTableConverter extends JsonConverter<Ifly.Models.DataTable> {
        constructor() { super(Ifly.Models.DataTable); }
    }
}