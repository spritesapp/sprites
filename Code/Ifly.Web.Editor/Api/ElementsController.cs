using Ifly.Web.Editor.Models;
using System.Linq;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Routing;
using System.Web;
using System;
using Ifly.QueueService;
using System.Collections.Generic;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents elements controller.
    /// </summary>
    public class ElementsController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 2; }
        }

        /// <summary>
        /// Updates deletes or reordersthe given element(s).
        /// </summary>
        /// <param name="settings">Slide settings.</param>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="slideId">Slide Id.</param>
        /// <param name="id">Element Id.</param>
        /// <returns>Slide Id.</returns>
        [HttpPut]
        [HttpPost]
        [HttpDelete]
        public int UpdateDeleteOrReorderElement([FromBody]ElementSettingsModel settings, int presentationId, int slideId, int? id = null)
        {
            int ret = 0, firstId = -1, secondId = -1, firstOrder = -1, secondOrder = -1;

            if (id.HasValue && base.ControllerContext.Request.Method == HttpMethod.Delete)
                DeleteElement(presentationId, slideId, id.Value, HttpContext.Current.Request.QueryString["also"]);
            else if (base.ControllerContext.Request.Method == HttpMethod.Put && 
                base.ControllerContext.Request.RequestUri.AbsolutePath.TrimEnd('/').EndsWith("/reoder", System.StringComparison.OrdinalIgnoreCase) &&
                int.TryParse(HttpContext.Current.Request.QueryString["firstId"], out firstId) && int.TryParse(HttpContext.Current.Request.QueryString["secondId"], out secondId))
            {
                int.TryParse(HttpContext.Current.Request.QueryString["firstOrder"], out firstOrder);
                int.TryParse(HttpContext.Current.Request.QueryString["secondOrder"], out secondOrder);

                ReoderElements(presentationId, slideId, firstId, secondId, firstOrder, secondOrder);
            }
            else
                ret = UpdateSettings(settings, presentationId, slideId, id);

            return ret;
        }

        /// <summary>
        /// Updates the basic settings of a given element.
        /// </summary>
        /// <param name="settings">Slide settings.</param>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="slideId">Slide Id.</param>
        /// <param name="id">Element Id.</param>
        /// <returns>Slide Id.</returns>
        [HttpPut]
        [HttpPost]
        public int UpdateSettings([FromBody]ElementSettingsModel settings, int presentationId, int slideId, int? id = null)
        {
            int ret = 0;
            Slide s = null;
            Element e = null;
            Presentation p = null;

            if (settings != null && presentationId > 0)
            {
                p = base.Service.Read(presentationId);

                if (p != null)
                {
                    s = p.Slides.FirstOrDefault(candidate => candidate.Id == slideId);

                    if (s != null)
                    {
                        e = id.HasValue ? s.Elements.FirstOrDefault(candidate => candidate.Id == id.Value) : new Element();

                        if (e != null)
                        {
                            e.Name = settings.Name;
                            e.Position = settings.Position;
                            e.Type = settings.Type;
                            e.Order = settings.Order;
                            e.NavigateSlideId = settings.NavigateSlideId;
                            e.RealtimeData = settings.RealtimeData;
                            e.Offset = settings.Offset;

                            if (e.Offset == null)
                                e.Offset = new ElementOffset();

                            e.Properties.Clear();

                            if (settings.Properties != null)
                            {
                                foreach (var prop in settings.Properties)
                                {
                                    e.Properties.Add(new ElementProperty()
                                    {
                                        Name = prop.Name,
                                        Value = prop.Value
                                    });
                                }
                            }

                            if (e.Id <= 0)
                                s.Elements.Add(e);

                            base.Service.CreateOrUpdate(p);

                            ret = s.Elements.First(candidate => candidate == e).Id;

                            if (e.Type == ElementType.Widget)
                                NotifyAboutWidgetUsage(presentationId, slideId, e);
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Reorders elements.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="slideId">Slide Id.</param>
        /// <param name="firstId">First element Id.</param>
        /// <param name="secondId">Second element Id.</param>
        /// <param name="firstOrder">First element order.</param>
        /// <param name="secondOrder">Second element order.</param>
        [HttpPut]
        public void ReoderElements(int presentationId, int slideId, int firstId, int secondId, int firstOrder, int secondOrder)
        {
            Slide s = null;
            Presentation p = null;
            Element e1 = null, e2 = null;

            if (firstId > 0 && secondId > 0)
            {
                p = base.Service.Read(presentationId);

                if (p != null)
                {
                    s = p.Slides.FirstOrDefault(candidate => candidate.Id == slideId);

                    if (s != null && s.Elements != null)
                    {
                        e1 = s.Elements.FirstOrDefault(candidate => candidate.Id == firstId);
                        e2 = s.Elements.FirstOrDefault(candidate => candidate.Id == secondId);

                        if (e1 != null && e2 != null)
                        {
                            e1.Order = firstOrder;
                            e2.Order = secondOrder;

                            base.Service.CreateOrUpdate(p);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Changes element's elevation.
        /// </summary>
        /// <param name="elevation">Element elevation.</param>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="slideId">Slide Id.</param>
        /// <param name="id">Element Id.</param>
        [HttpPut]
        public void ChangeElementElevation([FromBody]ElementBulkElevationChangeModel elevation, int presentationId, int slideId, int id)
        {
            Slide s = null;
            Presentation p = null;
            IEnumerable<Element> elements = null;
            IDictionary<int, int> elevationMap = new Dictionary<int, int>();

            if (elevation != null && elevation.Elevation != null && elevation.Elevation.Length > 0)
            {
                foreach (var elv in elevation.Elevation)
                {
                    if (elv.ElementId > 0 && !elevationMap.ContainsKey(elv.ElementId))
                        elevationMap.Add(elv.ElementId, elv.Elevation);
                }

                p = base.Service.Read(presentationId);

                if (p != null)
                {
                    s = p.Slides.FirstOrDefault(candidate => candidate.Id == slideId);

                    if (s != null && s.Elements != null)
                    {
                        elements = s.Elements.Where(e => elevationMap.ContainsKey(e.Id));

                        if (elements.Any())
                        {
                            foreach (var elm in elements)
                                elm.Elevation = elevationMap[elm.Id];

                            base.Service.CreateOrUpdate(p);
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Updates element position.
        /// </summary>
        /// <param name="settings">Settings.</param>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="slideId">Slide Id.</param>
        /// <param name="id">Element Id.</param>
        /// <param name="also">A serialized list of other elements' positions.</param>
        [HttpPut]
        public void BulkUpdateElementPosition([FromBody]ElementSettingsModel settings, int presentationId, int slideId, int id, string also)
        {
            Slide s = null;
            Presentation p = null;
            IEnumerable<Element> elements = null;
            IDictionary<int, Tuple<double, double>> positionMap = new Dictionary<int, Tuple<double, double>>();
            string[] components = (also ?? string.Empty).Split(new char[] { '#' }, StringSplitOptions.RemoveEmptyEntries);
            List<Tuple<int, double, double>> positions = components.Select(c =>
            {
                string[] parts = c.Split(new char[] { ':' }, StringSplitOptions.RemoveEmptyEntries);
                return new Tuple<int, double, double>(int.Parse(parts[0]), double.Parse(parts[1]), double.Parse(parts[2]));
            }).ToList();

            positions.Add(new Tuple<int, double, double>(id, settings.Offset.Left, settings.Offset.Top));

            foreach (var pos in positions)
            {
                if (!positionMap.ContainsKey(pos.Item1))
                    positionMap.Add(pos.Item1, new Tuple<double, double>(pos.Item2, pos.Item3));
            }

            p = base.Service.Read(presentationId);

            if (p != null)
            {
                s = p.Slides.FirstOrDefault(candidate => candidate.Id == slideId);

                if (s != null && s.Elements != null)
                {
                    elements = s.Elements.Where(e => positionMap.ContainsKey(e.Id));

                    if (elements.Any())
                    {
                        foreach (var elm in elements)
                        {
                            elm.Position = ElementPosition.Free;

                            if (elm.Offset == null)
                                elm.Offset = new ElementOffset();

                            elm.Offset.Left = positionMap[elm.Id].Item1;
                            elm.Offset.Top = positionMap[elm.Id].Item2;

                            if (elm.Offset.Viewport == null)
                                elm.Offset.Viewport = new ElementOffsetViewport();

                            elm.Offset.Viewport.Width = settings.Offset.Viewport.Width;
                            elm.Offset.Viewport.Height = settings.Offset.Viewport.Height;
                        }

                        base.Service.CreateOrUpdate(p);
                    }
                }
            }
        }

        /// <summary>
        /// Deletes the given element.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="slideId">Slide Id.</param>
        /// <param name="id">Element Id.</param>
        /// <param name="also">A comma-separated list of other elements to delete.</param>
        [HttpDelete]
        public void DeleteElement(int presentationId, int slideId, int id, string also)
        {
            Slide s = null;
            Element e = null;
            Presentation p = null;
            List<int> ids = new List<int>();

            if (presentationId > 0 && id > 0)
            {
                p = base.Service.Read(presentationId);

                if (p != null && p.Slides.Any())
                {
                    s = p.Slides.FirstOrDefault(candidate => candidate.Id == slideId);

                    if (s != null && s.Elements.Any())
                    {
                        ids.Add(id);

                        if (!string.IsNullOrEmpty(also))
                        {
                            ids.AddRange(also.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                                .Select(ao => ao.Trim()).Where(ao => { int d = -1; return int.TryParse(ao, out d); }).Select(ao => int.Parse(ao)));
                        }

                        foreach (int eId in ids.Distinct())
                        {
                            e = s.Elements.FirstOrDefault(candidate => candidate.Id == eId);

                            if (e != null)
                                s.Elements.Remove(e);
                        }

                        base.Service.CreateOrUpdate(p);
                    }
                }
            }
        }

        /// <summary>
        /// Notifies about widget usage.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="slideId">Slide Id.</param>
        /// <param name="element">Element.</param>
        private void NotifyAboutWidgetUsage(int presentationId, int slideId, Element element)
        {
            ElementProperty widgetCode = element.Properties != null ? 
                    element.Properties.FirstOrDefault(p => string.Compare(p.Name, "code", true) == 0) : null,
                widgetCodeSigned = element.Properties != null ?
                    element.Properties.FirstOrDefault(p => string.Compare(p.Name, "codeSigned", true) == 0) : null;

            if (widgetCode != null && !string.IsNullOrWhiteSpace(widgetCode.Value) && (widgetCodeSigned == null || string.Compare(widgetCodeSigned.Value, "true", true) != 0))
            {
                MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                {
                    Id = string.Format("{0}_{1}_{2}", presentationId, slideId, element.Id),
                    Subject = string.Format("Widget usage ({0})", Guid.NewGuid()),
                    Body = string.Format("*** {0} <{1}> ***\n\n{2}", 
                        PublishConfiguration.GetAbsoluteUri(Request.RequestUri, presentationId), presentationId, JavascriptDecode(widgetCode.Value))
                }});
            }
        }

        /// <summary>
        /// Decodes the given JavaScript snippet so it can be executed.
        /// </summary>
        /// <param name="content">Snippet to decode.</param>
        /// <returns>Decoded snippet.</returns>
        private string JavascriptDecode(string content)
        {
            string ret = content ?? string.Empty, token = "#!#!";

            if (ret.IndexOf(token) == 0)
            {
                ret = ret.Replace("&lt_e;", "<");
                ret = ret.Replace("&c_s_e;", "/*");
                ret = ret.Replace("&c_e_e;", "*/");
                ret = ret.Replace("&c_s_e;", "//");
                ret = ret.Replace("&n_e;", "\n");
                ret = ret.Replace("&t_e;", "\t");

                if (ret.IndexOf(token) == 0)
                    ret = ret.Substring(token.Length);
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
                name: "ChangeElementElevation",
                routeTemplate: "api/presentations/{presentationId}/slides/{slideId}/elements/{id}/elevate",
                defaults: new { controller = "Elements", action = "ChangeElementElevation" }
            );

            config.Routes.MapHttpRoute(
                name: "BulkUpdateElementPosition",
                routeTemplate: "api/presentations/{presentationId}/slides/{slideId}/elements/{id}/position",
                defaults: new { controller = "Elements", action = "BulkUpdateElementPosition" }
            );

            config.Routes.MapHttpRoute(
                name: "ReorderElements",
                routeTemplate: "api/presentations/{presentationId}/slides/{slideId}/elements/reorder",
                defaults: new { controller = "Elements", action = "ReoderElements" }
            );

            config.Routes.MapHttpRoute(
                name: "ElementWithId",
                routeTemplate: "api/presentations/{presentationId}/slides/{slideId}/elements/{id}",
                defaults: new { controller = "Elements", action = "UpdateDeleteOrReorderElement" }
            );

            config.Routes.MapHttpRoute(
                name: "Element",
                routeTemplate: "api/presentations/{presentationId}/slides/{slideId}/elements",
                defaults: new { controller = "Elements", action = "UpdateSettings" }
            );

            // This one doesn't work for some reason.
            config.Routes.MapHttpRoute(
                name: "DeleteElementWithId",
                routeTemplate: "api/presentations/{presentationId}/slides/{slideId}/elements/{id}",
                defaults: new { controller = "Elements", action = "DeleteElement" },
                constraints: new { httpMethod = new HttpMethodConstraint(HttpMethod.Delete) }
            );
        }
    }
}