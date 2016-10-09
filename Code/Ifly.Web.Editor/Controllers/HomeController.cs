using System.Net.Mime;
using System.Web.Mvc;
using System.Linq;
using Ifly.Web.Common.Filters;
using Ifly.Storage.Repositories;

namespace Ifly.Web.Editor.Controllers
{
    /// <summary>
    /// Represents a home controller.
    /// </summary>
    [Authorize]
    [CheckUserSubscriptionExpiration]
    public class HomeController : Controller
    {
        /// <summary>
        /// Returns the result of a default action.
        /// </summary>
        /// <returns>Result.</returns>
        public ActionResult Index()
        {
            return View(GetModel());
        }

        ///// <summary>
        ///// Serves the log files.
        ///// </summary>
        ///// <returns>Action result.</returns>
        //[AllowAnonymous]
        //public ActionResult Logs()
        //{
        //    byte[] fileData = null;
        //    ActionResult ret = null;
        //    ContentDisposition contentDisposition = null;
        //    string physicalPath = Server.MapPath("~/App_Data/Logs");

        //    if (System.IO.Directory.Exists(physicalPath) && System.IO.Directory.EnumerateFiles(physicalPath).Any())
        //    {
        //        using (var stream = new System.IO.MemoryStream())
        //        {
        //            using (var zip = new Ionic.Zip.ZipFile())
        //            {
        //                zip.AddDirectory(physicalPath);
        //                zip.Save(stream);
        //            }

        //            stream.Seek(0, System.IO.SeekOrigin.Begin);
        //            fileData = stream.ToArray();
        //        }

        //        contentDisposition = new ContentDisposition()
        //        {
        //            FileName = string.Format("Ifly_logs_{0}.zip", System.DateTime.UtcNow.ToString("ddMMyyyy")),
        //            Inline = false
        //        };

        //        Response.AppendHeader("Content-Disposition", contentDisposition.ToString());
        //        ret = File(fileData, "application/zip, application/octet-stream");
        //    }
        //    else
        //        ret = HttpNotFound();

        //    return ret;
        //}

        /// <summary>
        /// Throws a test exception.
        /// </summary>
        /// <returns>Action result.</returns>
        [AllowAnonymous]
        public ActionResult Throw()
        {
            throw new System.Exception("You've asked for it...");
        }

        /// <summary>
        /// Returns the result of details action.
        /// </summary>
        /// <param name="id">Presentation Id.</param>
        /// <returns>Result.</returns>
        public ActionResult Details(int? id)
        {
            Presentation p = null;
            ActionResult ret = null;
            var service = Resolver.Resolve<Storage.Services.IPresentationService>();

            // Demo user here trying to access infographic by Id.
            if (string.IsNullOrEmpty(ApplicationContext.Current.User.ExternalId))
                ret = Redirect("/edit");
            else
            {
                if (id.HasValue)
                {
                    p = service.Read(id.Value);

                    if (p == null)
                        ret = HttpNotFound();
                    else if (p.UserId != ApplicationContext.Current.User.Id && 
                        !Resolver.Resolve<IPresentationSharingRepository>().IsSharedWithUser(p.Id, ApplicationContext.Current.User.Id))
                    {
                        ret = new HttpStatusCodeResult(System.Net.HttpStatusCode.Forbidden);
                    }
                    else
                        ret = View("Index", GetModel(p));
                }
                else
                    ret = HttpNotFound();
            }

            return ret;
        }

        /// <summary>
        /// Returns the model.
        /// </summary>
        /// <param name="p">Presentation.</param>
        /// <param name="service">Service.</param>
        /// <returns>Model.</returns>
        private Models.PresentationEditModel GetModel(Presentation p = null, Storage.Services.IPresentationService service = null)
        {
            var ret = new Models.PresentationEditModel() { Presentation = p };

            if(service == null)
                service = Resolver.Resolve<Storage.Services.IPresentationService>();

            if (ApplicationContext.Current != null && ApplicationContext.Current.User != null && ApplicationContext.Current.User.Id > 0)
            {
                ret.AllPresentations = service.GetPresentationsByUser(ApplicationContext.Current.User.Id);

                if (ApplicationContext.Current.User.Subscription != null && ApplicationContext.Current.User.Subscription.Type == SubscriptionType.Agency)
                    ret.SharedPresentations = Resolver.Resolve<IPresentationSharingRepository>().GetPresentationsSharedWithUser(ApplicationContext.Current.User.Id).ToList();
            }

            return ret;
        }
    }
}
