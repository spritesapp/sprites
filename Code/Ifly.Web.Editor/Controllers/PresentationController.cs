using Ifly.QueueService;
using Ifly.Storage.Repositories;
using Ifly.Storage.Services;
using System;
using System.Linq;
using System.Web.Mvc;

namespace Ifly.Web.Editor.Controllers
{
    /// <summary>
    /// Represents a presentation controller.
    /// </summary>
    [AllowAnonymous]
    public class PresentationController : Controller
    {
        /// <summary>
        /// Represents voice-over request.
        /// </summary>
        private sealed class VoiceOverRequest
        {
            /// <summary>
            /// Gets or sets value indicating voice-over request is enabled.
            /// </summary>
            public bool IsEnabled { get; set; }

            /// <summary>
            /// Reads CEF request from the given HTTP request.
            /// </summary>
            /// <param name="request">HTTP request.</param>
            /// <returns>CEF request.</returns>
            public static VoiceOverRequest ReadFrom(System.Web.HttpRequestBase request)
            {
                VoiceOverRequest ret = null;

                if (string.Compare(request.QueryString["_vo"] ?? string.Empty, "1") == 0)
                {
                    ret = new VoiceOverRequest();

                    if (request.UrlReferrer != null && request.UrlReferrer.Host.IndexOf("spritesapp.com",
                        StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        ret.IsEnabled = true;
                    }
                }

                return ret;
            }
        }

        /// <summary>
        /// Represents CEF request.
        /// </summary>
        private sealed class CefRequest
        {
            /// <summary>
            /// Gets or sets the slide to show.
            /// </summary>
            public int? Slide { get; set; }

            /// <summary>
            /// Gets or sets value indicating whether to show progress bar.
            /// </summary>
            public bool ProgressBar { get; set; }

            /// <summary>
            /// Reads CEF request from the given HTTP request.
            /// </summary>
            /// <param name="request">HTTP request.</param>
            /// <returns>CEF request.</returns>
            public static CefRequest ReadFrom(System.Web.HttpRequestBase request)
            {
                int slide = 0;
                CefRequest ret = null;
                
                if (string.Compare(request.QueryString["_cef"] ?? string.Empty, "1") == 0)
                {
                    ret = new CefRequest();

                    if (int.TryParse(request.QueryString["_cef:slide"] ?? string.Empty, out slide))
                        ret.Slide = slide;

                    ret.ProgressBar = string.Compare(request.QueryString["_cef:progress"], "0") != 0;
                }

                return ret;
            }
        }

        /// <summary>
        /// Gets the Id of the presentation which refers to a demo.
        /// </summary>
        private const int DemoPresentationId = 1;

        /// <summary>
        /// Displays the infographic.
        /// </summary>
        /// <param name="id">Infographic Id.</param>
        /// <returns>Infographic.</returns>
        public ActionResult Display(int? id)
        {
            CefRequest cef = null;
            ActionResult ret = null;
            VoiceOverRequest vo = null;
            Models.PresentationDisplayModel model = null;

            if (id == null || !id.HasValue)
                ret = HttpNotFound();
            else
            {
                cef = CefRequest.ReadFrom(HttpContext.Request);
                vo = VoiceOverRequest.ReadFrom(HttpContext.Request);

                model = GetModel(id.Value, cef, vo);

                if (model != null)
                {
                    if (Request.AcceptTypes == null || !Request.AcceptTypes.Any() || Request.AcceptTypes.Any(t => t.IndexOf("html", System.StringComparison.OrdinalIgnoreCase) >= 0) || IsScraper(Request))
                        ret = View(model);
                    else if ((model.Presentation == null && model.RequiresPassword) || (model.Presentation != null && model.Presentation.Id != DemoPresentationId))
                        ret = View("DisplayEmbedded", model);
                }

                if (ret == null)
                    ret = HttpNotFound();
                else if (cef == null && vo == null)
                    RecordImpression(model);
            }

            return ret;
        }

        /// <summary>
        /// Returns value indicating whether this is the scraper who's making a request.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <returns>Value indicating whether this is the scraper who's making a request.</returns>
        private bool IsScraper(System.Web.HttpRequestBase request)
        {
            return !string.IsNullOrEmpty(request.UserAgent) && request.UserAgent.IndexOf("facebook", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        /// <summary>
        /// Displays the infographic canvas.
        /// </summary>
        /// <param name="id">Infographic Id.</param>
        /// <returns>Infographic canvas.</returns>
        public ActionResult DisplayCanvas(int id)
        {
            return View();
        }

        /// <summary>
        /// Returns the model.
        /// </summary>
        /// <param name="id">Infographic Id.</param>
        /// <param name="cef">CEF request.</param>
        /// <param name="vo">Voice-over request.</param>
        /// <returns>Model.</returns>
        private Models.PresentationDisplayModel GetModel(int id, CefRequest cef, VoiceOverRequest vo)
        {
            Presentation p = null;
            Models.PresentationDisplayModel ret = null;

            if (id == DemoPresentationId)
            {
                ret = new Models.PresentationDisplayModel()
                {
                    Presentation = new Presentation()
                    {
                         Id = DemoPresentationId,
                         Title = "Demo"
                    }
                };
            }
            else
            {
                if (id > 0)
                {
                    p = Resolver.Resolve<IPresentationService>().Read(id);

                    if (p != null)
                    {
                        p = Layout.ThemeMetadata.TryRemapThemeBackgroundImage(p);

                        ret = new Models.PresentationDisplayModel()
                        {
                            Presentation = p,
                            PresentationId = p.Id,
                            PresentationTitle = p.Title,
                            PresentationUserId = p.UserId,
                            PresentationIntegrationSettings = p.IntegrationSettings,
                            PresentationUrl = Ifly.PublishConfiguration.GetAbsoluteUri(Request.Url, id),
                            PresentationUrlQuery = Request.Url.Query.Trim('?', '&'),
                            RequiresPassword = p.PublishSettings != null && !string.IsNullOrEmpty(p.PublishSettings.PasswordHash),
                            LoopPlayback = new Models.PresentationDisplayLoopPlaybackSettings() { Enable = string.Compare(Request.QueryString["loop"], "1") == 0 || string.Compare(Request.QueryString["loop"], "true") == 0 }
                        };

                        if (cef == null)
                        {
                            if (vo != null && vo.IsEnabled)
                            {
                                ret.Presentation.PublishSettings = new PublishConfiguration()
                                {
                                    PresentationId = ret.Presentation.Id,
                                    ProgressBar = true,
                                    Controls = false,
                                    AutoPlay = false
                                };
                            }
                            else
                            {
                                if (ret.RequiresPassword)
                                    ret.Presentation = null;
                                else
                                {
                                    // Default to "on", not available via UI.
                                    if (ret.Presentation.PublishSettings != null)
                                        ret.Presentation.PublishSettings.ProgressBar = true;
                                }
                            }
                        }
                        else
                        {
                            ret.IsCefConnected = true;

                            ret.Presentation.PublishSettings = new PublishConfiguration()
                            {
                                PresentationId = ret.Presentation.Id,
                                ProgressBar = cef.ProgressBar,
                                Slide = cef.Slide,
                                Controls = false,
                                AutoPlay = true
                            };
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Records the given impression.
        /// </summary>
        /// <param name="model">Model.</param>
        private void RecordImpression(Models.PresentationDisplayModel model)
        {
            // Disabled - we don't have enough money to keep SQL Server and there's very little interest in the given feature.

            //if (model != null && model.PresentationId != DemoPresentationId && (Ifly.ApplicationContext.Current == null || Ifly.ApplicationContext.Current.User == null || Ifly.ApplicationContext.Current.User.Id != model.PresentationUserId))
            //{
            //    MessageQueueManager.Current.GetQueue(MessageQueueType.Impressions).AddMessages(new Message[] { new Message()
            //    {
            //        Id = System.Guid.NewGuid().ToString(),
            //        Body = new GenericMessageBody
            //            (
            //                new Tuple<string, string>("PresentationId", model.PresentationId.ToString()), 
            //                new Tuple<string, string>("PresentationUserId", model.PresentationUserId.ToString())
            //            ).ToString()
            //    }});
            //}
        }
    }
}