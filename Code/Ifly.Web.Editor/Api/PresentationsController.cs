using Ifly.Storage.Repositories;
using Ifly.Web.Editor.Models;
using System.Web;
using System.Web.Http;
using System.Web.Routing;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents a presentation controller.
    /// </summary>
    public class PresentationsController : RootApiController
    {
        /// <summary>
        /// Returns the given record by its Id.
        /// </summary>
        /// <param name="id">Record Id.</param>
        /// <returns>Record.</returns>
        private Presentation Get(int id)
        {
            return base.Service.Read(id);
        }

        /// <summary>
        /// Validates presentation password.
        /// </summary>
        /// <param name="password">Password.</param>
        /// <param name="id">Presentation Id.</param>
        /// <returns>Presentation if the password is valid, otherwise null.</returns>
        [HttpPost]
        public string ValidatePassword([FromBody]PresentationPasswordValidationModel password, int id)
        {
            Presentation ret = null;

            if (password != null && !string.IsNullOrEmpty(password.Password))
            {
                ret = id > 0 ? Get(id) : null;

                if (ret != null && ret.PublishSettings != null && !string.IsNullOrEmpty(ret.PublishSettings.PasswordHash) &&
                    string.Compare(ret.PublishSettings.PasswordHash, Utils.Crypto.GetHash(password.Password)) != 0)
                {
                    ret = null;
                }
            }

            return ret != null ? Newtonsoft.Json.JsonConvert.SerializeObject(Layout.ThemeMetadata.TryRemapThemeBackgroundImage(ret), 
                Newtonsoft.Json.Formatting.None, new Newtonsoft.Json.JsonSerializerSettings() 
                { 
                    ContractResolver = new Newtonsoft.Json.Serialization.CamelCasePropertyNamesContractResolver() 
                }) : null;
        }

        /// <summary>
        /// Updates the basic settings of a given presentation.
        /// </summary>
        /// <param name="settings">Presentation settings.</param>
        /// <param name="id">Presentation Id.</param>
        /// <returns>Presentation Id.</returns>
        [HttpPut]
        [HttpPost]
        public PresentationUpdateResultModel UpdateSettings([FromBody]PresentationSettingsModel settings, int? id = null)
        {
            Slide s = null;
            bool isNew = true;
            Presentation p = null;
            User currentUser = null;

            if (settings != null)
            {
                isNew = !id.HasValue;
                p = isNew ? new Presentation() : Get(id.Value);

                if (p != null)
                {
                    p.Title = settings.Title;
                    p.Theme = settings.Theme;
                    p.BackgroundImage = settings.BackgroundImage;

                    currentUser = ApplicationContext.Current.User;

                    if (p.UserId <= 0)
                        p.UserId = currentUser.Id;

                    if (currentUser.Subscription != null)
                    {
                        // If the presentation is new OR if the user's subscription is "better" than is currently saved under the presentation - updating.
                        if (isNew || (int)p.UserSubscriptionType < (int)currentUser.Subscription.Type)
                            p.UserSubscriptionType = currentUser.Subscription.Type;
                    }
                    else if (isNew)
                        p.UserSubscriptionType = SubscriptionType.Basic;

                    if (isNew)
                    {
                        // New presentations automatically get Google Charts as chart provider.
                        p.UseCharts = PresentationChartProviderType.GoogleCharts;

                        // New presentations will not have "Slide description" functionality.
                        p.UseSlideDescription = PresentationSlideDescriptionType.Never;

                        // For new presentations, adding new slide automatically.
                        p.Slides.Add(s = new Slide() { Title = Ifly.Resources.Editor.Slide1 });
                    }

                    p = base.Service.CreateOrUpdate(p);
                }
            }

            return new PresentationUpdateResultModel { Id = p.Id, Slide = s };
        }

        /// <summary>
        /// Updates the publish settings of a given presentation.
        /// </summary>
        /// <param name="settings">Presentation publish settings.</param>
        /// <param name="id">Presentation Id.</param>
        /// <returns>Presentation Id.</returns>
        [HttpPut]
        public int UpdatePublishSettings([FromBody]PresentationPublishSettingsModel settings, int id)
        {
            int ret = 0;
            Presentation p = null;

            if (settings != null)
            {
                p = Get(id);

                if (p != null)
                {
                    if (p.PublishSettings == null)
                        p.PublishSettings = new PublishConfiguration();

                    p.PublishSettings.Slide = settings.Slide;
                    p.PublishSettings.Controls = settings.Controls;
                    p.PublishSettings.AutoPlay = settings.AutoPlay;

                    if (settings.PasswordChanged)
                    {
                        p.PublishSettings.PasswordHash = !string.IsNullOrEmpty(settings.Password) ?
                            Utils.Crypto.GetHash(settings.Password) : string.Empty;
                    }

                    ret = base.Service.CreateOrUpdate(p).Id;
                }
            }

            return ret;
        }

        /// <summary>
        /// Updates the presenter settings of a given presentation.
        /// </summary>
        /// <param name="settings">Presentation presenter settings.</param>
        /// <param name="id">Presentation Id.</param>
        /// <returns>Presentation Id.</returns>
        [HttpPut]
        public int UpdatePresenterSettings([FromBody]PresentationPresenterSettingsModel settings, int id)
        {
            int ret = 0;
            Presentation p = null;

            if (settings != null)
            {
                p = Get(id);

                if (p != null)
                {
                    if (p.PresenterSettings == null)
                        p.PresenterSettings = new PresenterModeConfiguration();

                    p.PresenterSettings.Animations = settings.Animations;
                    p.PresenterSettings.AllowFullscreen = settings.AllowFullscreen;

                    ret = base.Service.CreateOrUpdate(p).Id;
                }
            }

            return ret;
        }

        /// <summary>
        /// Updates the integration settings of a given presentation.
        /// </summary>
        /// <param name="settings">Presentation integration settings.</param>
        /// <param name="id">Presentation Id.</param>
        /// <returns>Presentation Id.</returns>
        [HttpPut]
        public int UpdateIntegrationSettings([FromBody]PresentationIntegrationSettingsModel settings, int id)
        {
            int ret = 0;
            Presentation p = null;

            if (settings != null)
            {
                p = Get(id);

                if (p != null)
                {
                    if (p.IntegrationSettings == null)
                        p.IntegrationSettings = new IntegrationSettings();

                    p.IntegrationSettings.GoogleAnalyticsTrackingId = settings.GoogleAnalyticsTrackingId;

                    ret = base.Service.CreateOrUpdate(p).Id;
                }
            }

            return ret;
        }

        /// <summary>
        /// Clones the given presentation.
        /// </summary>
        /// <param name="settings">Clone settings.</param>
        /// <param name="id">Presentation Id.</param>
        /// <returns>Clone result.</returns>
        [HttpPost]
        public ClonePresentationResult ClonePresentation([FromBody]ClonePresentationSettings settings, int id)
        {
            ClonePresentationResult ret = null;
            Presentation origPresentation = null, newPresentation = null;

            if (settings != null && id > 0)
            {
                origPresentation = Get(id);

                if (origPresentation != null)
                {
                    newPresentation = Newtonsoft.Json.JsonConvert.DeserializeObject<Presentation>(
                        Newtonsoft.Json.JsonConvert.SerializeObject(origPresentation)
                    );

                    newPresentation.Id = 0;
                    newPresentation.Title = settings.Title;
                    newPresentation.Created = System.DateTime.UtcNow;

                    if (newPresentation.Slides != null && newPresentation.Slides.Count > 0)
                    {
                        foreach (Slide s in newPresentation.Slides)
                        {
                            if (s != null)
                            {
                                s.Id = 0;
                                if (s.Elements != null && s.Elements.Count > 0)
                                {
                                    foreach (Element e in s.Elements)
                                    {
                                        if (e != null)
                                        {
                                            e.Id = 0;

                                            if (e.Properties != null && e.Properties.Count > 0)
                                            {
                                                foreach (ElementProperty p in e.Properties)
                                                {
                                                    if (p != null)
                                                        p.Id = 0;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    newPresentation = base.Service.CreateOrUpdate(newPresentation);

                    ret = new ClonePresentationResult() { Id = newPresentation.Id };
                }
            }

            return ret;
        }

        /// <summary>
        /// Archives/un-archives the given presentation.
        /// </summary>
        /// <param name="id">Presentation Id.</param>
        /// <param name="isArchived">Value indicating whether presentation is archived.</param>
        /// <returns>Presentation Id.</returns>
        [HttpPost]
        public int ArchivePresentation(int id, bool? isArchived)
        {
            int ret = id;
            Presentation presentation = null;

            if (id > 0)
            {
                presentation = Get(id);

                if (presentation != null)
                {
                    presentation.IsArchived = isArchived != null && isArchived.HasValue ? isArchived.Value : false;
                    base.Service.CreateOrUpdate(presentation);
                }
            }

            return ret;
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config) 
        {
            config.Routes.MapHttpRoute(
                name: "ArchivePresentation",
                routeTemplate: "api/presentations/{id}/archive",
                defaults: new { controller = "Presentations", action = "ArchivePresentation" }
            );

            config.Routes.MapHttpRoute(
                name: "ClonePresentation",
                routeTemplate: "api/presentations/{id}/clone",
                defaults: new { controller = "Presentations", action = "ClonePresentation" }
            );

            config.Routes.MapHttpRoute(
                name: "PresentationIntegrationSettings",
                routeTemplate: "api/presentations/{id}/integration",
                defaults: new { controller = "Presentations", action = "UpdateIntegrationSettings" }
            );

            config.Routes.MapHttpRoute(
                name: "PresentationPublishSettings",
                routeTemplate: "api/presentations/{id}/publish",
                defaults: new { controller = "Presentations", action = "UpdatePublishSettings" }
            );

            config.Routes.MapHttpRoute(
                name: "PresentationPresenterSettings",
                routeTemplate: "api/presentations/{id}/present",
                defaults: new { controller = "Presentations", action = "UpdatePresenterSettings" }
            );

            config.Routes.MapHttpRoute(
                name: "PresentationNameWithId",
                routeTemplate: "api/presentations/{id}/settings",
                defaults: new { controller = "Presentations", action = "UpdateSettings" }
            );

            config.Routes.MapHttpRoute(
                name: "PresentationName",
                routeTemplate: "api/presentations/settings",
                defaults: new { controller = "Presentations", action = "UpdateSettings" }
            );

            config.Routes.MapHttpRoute(
                name: "ValidatePassword",
                routeTemplate: "public/api/presentations/{id}/validatepassword",
                defaults: new { controller = "Presentations", action = "ValidatePassword" }
            );
        }
    }
}