using Ifly.Web.Editor.Models;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Routing;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents a slide controller.
    /// </summary>
    public class SlidesController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 1; }
        }

        /// <summary>
        /// Updates the basic settings of a given slide.
        /// </summary>
        /// <param name="settings">Slide settings.</param>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="id">Slide Id.</param>
        /// <returns>Slide Id.</returns>
        [HttpPost]
        public Slide CloneSlide([FromBody]CloneSlideSettings settings, int presentationId, int? id = null)
        {
            Slide s = null;
            Element e = null;
            Slide ret = null;
            Presentation p = null;
            ElementProperty pr = null;

            if (settings != null && presentationId > 0)
            {
                p = base.Service.Read(presentationId);

                if (p != null)
                {
                    s = id.HasValue ? p.Slides.FirstOrDefault(candidate => candidate.Id == id.Value) : null;

                    if (s != null)
                    {
                        ret = new Slide();

                        ret.PresentationId = settings.TargetPresentationId.HasValue ? settings.TargetPresentationId.Value : presentationId;
                        ret.Order = p.Slides.Max(candidate => candidate.Order) + 1;
                        ret.Title = settings.Title;
                        ret.Description = s.Description;
                        ret.PlaybackTime = s.PlaybackTime;

                        if (s.Elements != null && s.Elements.Any())
                        {
                            foreach (Element elm in s.Elements)
                            {
                                e = new Element();

                                e.Name = elm.Name;
                                e.Position = elm.Position;
                                e.Type = elm.Type;
                                e.Order = s.Elements.Max(candidate => candidate.Order) + ret.Elements.Count() + 1;

                                if (!settings.TargetPresentationId.HasValue)
                                    e.NavigateSlideId = elm.NavigateSlideId;

                                if (elm.Offset != null)
                                {
                                    e.Offset = new ElementOffset();
                                    
                                    e.Offset.Left = elm.Offset.Left;
                                    e.Offset.Top = elm.Offset.Top;

                                    if (elm.Offset.Viewport != null)
                                    {
                                        e.Offset.Viewport = new ElementOffsetViewport();
                                        
                                        e.Offset.Viewport.Width = elm.Offset.Viewport.Width;
                                        e.Offset.Viewport.Height = elm.Offset.Viewport.Height;
                                    }
                                }

                                if (elm.Properties != null && elm.Properties.Any())
                                {
                                    foreach (ElementProperty prop in elm.Properties)
                                    {
                                        pr = new ElementProperty();
                                        
                                        pr.Name = prop.Name;
                                        pr.Value = prop.Value;

                                        e.Properties.Add(pr);
                                    }
                                }

                                ret.Elements.Add(e);
                            }
                        }

                        if (settings.TargetPresentationId.HasValue && settings.TargetPresentationId.Value != presentationId)
                            p = base.Service.Read(settings.TargetPresentationId.Value);

                        if (p != null)
                        {
                            p.Slides.Add(ret);
                            base.Service.CreateOrUpdate(p);
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Updates the basic settings of a given slide.
        /// </summary>
        /// <param name="settings">Slide settings.</param>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="id">Slide Id.</param>
        /// <returns>Slide Id.</returns>
        [HttpPut]
        [HttpPost]
        public int UpdateSettings([FromBody]SlideSettingsModel settings, int presentationId, int? id = null)
        {
            int ret = 0;
            Slide s = null;
            Presentation p = null;

            if (settings != null && presentationId > 0)
            {
                p = base.Service.Read(presentationId);
                
                if (p != null)
                {
                    s = id.HasValue ? p.Slides.FirstOrDefault(candidate => candidate.Id == id.Value) : new Slide();

                    if (s != null)
                    {
                        s.Title = settings.Title;
                        s.Description = settings.Description;
                        s.PlaybackTime = settings.PlaybackTime;

                        if (s.Id <= 0)
                        {
                            if (p.Slides.Any())
                                s.Order = p.Slides.Max(slide => slide.Order) + 1;

                            p.Slides.Add(s);
                        }

                        base.Service.CreateOrUpdate(p);
                        ret = p.Slides.First(candidate => candidate == s).Id;
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Updates slide data.
        /// </summary>
        /// <param name="data">Data.</param>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="id">Slide Id.</param>
        /// <returns>Slide data.</returns>
        [HttpPut]
        [HttpPost]
        public SlideDataModel UpdateSlideData([FromBody]SlideDataModel data, int presentationId, int id)
        {
            Slide s = null;
            Presentation p = null;
            SlideDataModel ret = null;

            if (data != null && presentationId > 0 && id > 0)
            {
                p = base.Service.Read(presentationId);

                if (p != null)
                {
                    s = p.Slides.FirstOrDefault(candidate => candidate.Id == id);

                    if (s != null)
                    {
                        if (string.IsNullOrEmpty(s.Title))
                            s.Title = data.Title ?? string.Empty;

                        if (string.IsNullOrEmpty(s.Description))
                            s.Description = data.Description ?? string.Empty;

                        s.Elements.Clear();

                        if (data.Elements != null && data.Elements.Length > 0)
                        {
                            foreach (Element e in data.Elements)
                            {
                                e.SlideId = s.Id;
                                s.Elements.Add(e);
                            }
                        }

                        base.Service.CreateOrUpdate(p);

                        ret = new SlideDataModel()
                        {
                            Title = s.Title,
                            Description = s.Description,
                            Elements = s.Elements.ToArray()
                        };
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Reorders the slides.
        /// </summary>
        /// <param name="reoder">Reoder settings.</param>
        /// <param name="presentationId">Presentation Id.</param>
        [HttpPost]
        public SlideReorderResultModel ReoderSlides([FromBody]SlideReoderModel reoder, int presentationId)
        {
            int max = 0;
            Presentation p = null;
            IDictionary<int, int> order = null;
            IList<int> missingSlides = new List<int>();
            SlideReorderResultModel ret = new SlideReorderResultModel();

            if (presentationId > 0 && reoder != null && reoder.SlideIds != null)
            {
                order = reoder.SlideIds.Distinct()
                    .Select((e, i) => new { Id = e, Index = i })
                    .ToDictionary(r => r.Id, r => r.Index);

                p = base.Service.Read(presentationId);

                if (p != null)
                {
                    for (int i = 0; i < p.Slides.Count; i++)
                    {
                        if (order.ContainsKey(p.Slides[i].Id))
                        {
                            p.Slides[i].Order = order[p.Slides[i].Id];
                            
                            ret.Slides.Add(new SlideOrderMapping()
                            {
                                SlideId = p.Slides[i].Id,
                                Order = p.Slides[i].Order
                            });
                        }
                            
                        else
                            missingSlides.Add(i);
                    }

                    if (missingSlides.Any())
                    {
                        max = order.Count;

                        foreach (var i in missingSlides)
                        {
                            p.Slides[i].Order = max++;

                            ret.Slides.Add(new SlideOrderMapping()
                            {
                                SlideId = p.Slides[i].Id,
                                Order = p.Slides[i].Order
                            });
                        }
                            
                    }

                    base.Service.CreateOrUpdate(p);
                }
            }

            return ret;
        }

        /// <summary>
        /// Deletes the given slide.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="id">Slide Id.</param>
        [HttpDelete]
        public void DeleteSlide(int presentationId, int id)
        {
            Slide s = null;
            Presentation p = null;

            if (presentationId > 0 && id > 0)
            {
                p = base.Service.Read(presentationId);

                if (p != null && p.Slides.Any())
                {
                    s = p.Slides.FirstOrDefault(candidate => candidate.Id == id);

                    if (s != null)
                    {
                        p.Slides.Remove(s);
                        base.Service.CreateOrUpdate(p);
                    }
                }
            }
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config) 
        {
            config.Routes.MapHttpRoute(
                name: "UpdateSlideData",
                routeTemplate: "api/presentations/{presentationId}/slides/{id}/data",
                defaults: new { controller = "Slides", action = "UpdateSlideData" }
            );

            config.Routes.MapHttpRoute(
                name: "CloneSlide",
                routeTemplate: "api/presentations/{presentationId}/slides/{id}/clone",
                defaults: new { controller = "Slides", action = "CloneSlide" }
            );

            config.Routes.MapHttpRoute(
                name: "SlideWithId",
                routeTemplate: "api/presentations/{presentationId}/slides/{id}/settings",
                defaults: new { controller = "Slides", action = "UpdateSettings" }
            );

            config.Routes.MapHttpRoute(
                name: "Slide",
                routeTemplate: "api/presentations/{presentationId}/slides/settings",
                defaults: new { controller = "Slides", action = "UpdateSettings" }
            );

            config.Routes.MapHttpRoute(
                name: "ReoderSlide",
                routeTemplate: "api/presentations/{presentationId}/slides/reorder",
                defaults: new { controller = "Slides", action = "ReoderSlides" }
            );

            config.Routes.MapHttpRoute(
                name: "DeleteSlideWithId",
                routeTemplate: "api/presentations/{presentationId}/slides/{id}",
                defaults: new { controller = "Slides", action = "DeleteSlide" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Delete) }
            );
        }
    }
}