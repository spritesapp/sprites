/// <reference path="../Typings/knockout.d.ts" />
/// <reference path="Slide.ts" />
/// <reference path="IModel.ts" />

module Ifly.Models {
    /** Represents a presentation (infographic). */
    export class Presentation implements IModel {
        /** Gets or sets the presentation Id. */
        public id: KnockoutObservable<number>;

        /** Gets or sets user Id. */
        public userId: KnockoutObservable<number>;

        /** Gets or sets the presentation title. */
        public title: KnockoutObservable<string>;

        /** Gets or sets the date and time when presentation was created. */
        public created: KnockoutObservable<Date>;

        /** Gets or sets the presentation theme. */
        public theme: KnockoutObservable<string>;

        /** Gets or sets the background image. */
        public backgroundImage: KnockoutObservable<string>;

        /** Gets or sets value indicating whether presentation is active. */
        public isActive: KnockoutObservable<boolean>;

        /** Gets or sets value indicating whether presentation is archived. */
        public isArchived: KnockoutObservable<boolean>;

        /** Gets or sets the total number of impressions for this presentation. */
        public totalImpressions: KnockoutObservable<number>;

        /** Gets or sets the chart type. */
        public useCharts: KnockoutObservable<PresentationChartProviderType>;

        /** Gets or sets the slide description type. */
        public useSlideDescription: KnockoutObservable<PresentationSlideDescriptionType>;

        /** Gets or sets the list of slides that are part of a given presentation. */
        public slides: KnockoutObservableArray<Slide>;

        /** Gets or sets the publish settings. */
        public publishSettings: KnockoutObservable<PublishConfiguration>;

        /** Gets or sets integration settings. */
        public integrationSettings: KnockoutObservable<IntegrationSettings>;

        /** Gets or sets presenter settings. */
        public presenterSettings: KnockoutObservable<PresenterModeConfiguration>;

        /** Gets or sets the selected slide index. */
        public selectedSlideIndex: KnockoutObservable<number>;

        /** Gets or sets value indicating whether slide is being selected. */
        public isSelectingSlide: KnockoutObservable<boolean>;

        /** Gets or sets the selected slide. */
        public selectedSlide: KnockoutComputed<Slide>;

        /** 
         * Initializes a new instance of an object.
         * @param {object} data Data to load from.
         */
        constructor(data?: any) {
            this.id = ko.observable<number>();
            this.userId = ko.observable<number>();
            this.title = ko.observable<string>();
            this.theme = ko.observable<string>();
            this.created = ko.observable<Date>();
            this.backgroundImage = ko.observable<string>();
            this.isActive = ko.observable<boolean>();
            this.isArchived = ko.observable<boolean>();
            this.totalImpressions = ko.observable<number>();
            this.useCharts = ko.observable<PresentationChartProviderType>(PresentationChartProviderType.googleCharts);
            this.useSlideDescription = ko.observable<PresentationSlideDescriptionType>(PresentationSlideDescriptionType.never);
            this.slides = ko.observableArray<Slide>();
            this.publishSettings = ko.observable<PublishConfiguration>(new PublishConfiguration());
            this.integrationSettings = ko.observable<IntegrationSettings>(new IntegrationSettings());
            this.presenterSettings = ko.observable<PresenterModeConfiguration>(new PresenterModeConfiguration());

            this.isSelectingSlide = ko.observable<boolean>();

            this.selectedSlideIndex = ko.observable(-1);
            this.selectedSlide = ko.computed<Slide>(() => {
                var i = this.selectedSlideIndex();
                return i >= 0 && i < this.slides().length ? this.slides()[i] : null;
            });

            this.load(data);
        }

        /** 
         * Populates object state from the given data.
         * @param {object} data Data to load from.
         */
        public load(data: any) {
            var slides = [], publishSettings = null;

            data = data || {};

            this.id(data.id || data.Id || 0);
            this.userId(data.userId || data.UserId || 0);
            this.title(data.title || data.Title || '');

            if (!data.created && !data.Created) {
                this.created(new Date());
            } else {
                this.created(moment(data.created || data.Created).toDate());
            }
            
            this.theme(data.theme || data.Theme || 'clean');
            this.backgroundImage(data.backgroundImage || data.BackgroundImage || '');
            this.isActive(data.isActive || data.IsActive);
            this.isArchived(data.isArchived || data.IsArchived);
            this.totalImpressions(data.totalImpressions || data.TotalImpressions || 0);
            this.useCharts(data.useCharts || data.UseCharts || 0);
            this.useSlideDescription(data.useSlideDescription || data.UseSlideDescription || 0);

            this.slides.removeAll();

            slides = data.slides || data.Slides;

            if (slides && slides.length) {
                slides.sort((x, y) => (x.order || x.Order || 0) - (y.order || y.Order || 0));

                ko.utils.arrayForEach(slides, (s) => {
                    this.slides.push(new Slide(s));
                });
            }

            this.publishSettings().load(data.publishSettings || data.PublishSettings);
            this.integrationSettings().load(data.integrationSettings || data.IntegrationSettings);
            this.presenterSettings().load(data.presenterSettings || data.PresenterSettings);
        }

        /** Serializes object state. */
        public serialize() {
            return {
                id: this.id(),
                userId: this.userId(),
                title: this.title(),
                created: this.created(),
                theme: this.theme(),
                backgroundImage: this.backgroundImage(),
                isActive: this.isActive(),
                isArchived: this.isArchived(),
                totalImpressions: this.totalImpressions(),
                useCharts: this.useCharts(),
                useSlideDescription: this.useSlideDescription(),
                slides: ko.utils.arrayMap(this.slides(), (s) => {
                    return (<Slide>s).serialize();
                }),
                publishSettings: this.publishSettings().serialize(),
                integrationSettings: this.integrationSettings().serialize(),
                presenterSettings: this.presenterSettings().serialize()
            };
        }
    }
}