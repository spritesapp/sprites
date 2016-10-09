using System;
using System.Web;

namespace Ifly.ExportProvider
{
    public class ExportResultContinuationModule : IHttpModule
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

            if (request.Url.AbsolutePath.StartsWith("/continue", StringComparison.OrdinalIgnoreCase))
            {
                var id = request.QueryString["key"] ?? string.Empty;
                var physicalPath = app.Server.MapPath("~/App_Data/Exports");
                var continuation = request.QueryString["continuation"] ?? string.Empty;
                var isValid = !string.IsNullOrEmpty(id) && !string.IsNullOrEmpty(continuation);
                var fullPhysicalPath = System.IO.Path.Combine(physicalPath, System.IO.Path.ChangeExtension(id, ".mp4"));

                if (isValid)
                    Ifly.ServiceAdapter.VideoPublishBroker.CreateVideoPublishTask(fullPhysicalPath, continuation);

                var status = isValid ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound;

                response.Clear();

                response.StatusCode = (int)status;
                response.StatusDescription = isValid ? "OK" : "Not Found";
                response.Status = string.Format("{0} {1}", response.StatusCode, response.StatusDescription);

                response.End();
            }
        }

        public void Dispose() { }
    }
}