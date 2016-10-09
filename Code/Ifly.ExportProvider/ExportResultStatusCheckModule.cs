using System;
using System.Linq;
using System.Web;

namespace Ifly.ExportProvider
{
    public class ExportResultStatusCheckModule : IHttpModule
    {
        public void Init(HttpApplication context)
        {
            context.PreRequestHandlerExecute += Application_PreRequestHandlerExecute;
        }

        private void Application_PreRequestHandlerExecute(object sender, EventArgs e)
        {
            var app = sender as HttpApplication;

            var request = app.Request;
            var response = app.Response;

            if (request.Url.AbsolutePath.StartsWith("/status", StringComparison.OrdinalIgnoreCase))
            {
                var id = request.QueryString["key"] ?? string.Empty;
                var physicalPath = app.Server.MapPath("~/App_Data/Exports");
                var publishResult = Ifly.ServiceAdapter.VideoPublishBroker.GetVideoPublishStatus(
                    System.IO.Path.Combine(physicalPath, System.IO.Path.ChangeExtension(id, ".mp4")));

                var contains = false;

                if (!string.IsNullOrEmpty(publishResult))
                    contains = true;
                else
                {
                    if (System.IO.Directory.Exists(physicalPath))
                    {
                        contains = System.IO.Directory.EnumerateFiles(physicalPath).Where(f =>
                            string.Compare(System.IO.Path.GetFileNameWithoutExtension(f), id, true) == 0).Any();
                    }
                }

                var status = contains ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound;

                response.Clear();

                response.StatusCode = (int)status;
                response.StatusDescription = contains ? "OK" : "Not Found";
                response.Status = string.Format("{0} {1}", response.StatusCode, response.StatusDescription);

                response.Write(publishResult);

                response.End();
            }
        }

        public void Dispose() { }
    }
}