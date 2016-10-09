using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Ifly.ExportProvider
{
    public class ExportApplicationRootModule : IHttpModule
    {
        public void Init(HttpApplication context)
        {
            context.PreRequestHandlerExecute += Application_PreRequestHandlerExecute;
        }

        private void Application_PreRequestHandlerExecute(object sender, EventArgs e)
        {
            var app = sender as HttpApplication;
            var status = System.Net.HttpStatusCode.NotFound;

            var request = app.Request;
            var response = app.Response;

            if (request.Url.AbsolutePath.StartsWith("/hello", StringComparison.OrdinalIgnoreCase))
            {
                status = System.Net.HttpStatusCode.OK;

                response.Clear();

                response.StatusCode = (int)status;
                response.StatusDescription = status == System.Net.HttpStatusCode.OK ? "OK" : "Not Found";
                response.Status = string.Format("{0} {1}", response.StatusCode, response.StatusDescription);

                if (status == System.Net.HttpStatusCode.OK)
                    response.Write("Yep, I'm here.");

                response.End();
            }
        }

        public void Dispose() { }
    }
}