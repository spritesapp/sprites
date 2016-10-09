using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Ifly.ExportProvider
{
    public class ExportAudioFileUploadModule : IHttpModule
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

            string fileName = string.Empty;

            if (request.Url.AbsolutePath.StartsWith("/upload", StringComparison.OrdinalIgnoreCase))
            {
                if (request.Files != null && request.Files.Count > 0)
                {
                    var file = request.Files[0];
                    var rootPath = app.Server.MapPath("~/App_Data/Uploads");

                    if (!System.IO.Directory.Exists(rootPath))
                        System.IO.Directory.CreateDirectory(rootPath);

                    fileName = System.IO.Path.Combine(rootPath, file.FileName);

                    file.SaveAs(fileName);
                }

                status = System.Net.HttpStatusCode.OK;

                response.Clear();

                response.StatusCode = (int)status;
                response.StatusDescription = status == System.Net.HttpStatusCode.OK ? "OK" : "Not Found";
                response.Status = string.Format("{0} {1}", response.StatusCode, response.StatusDescription);

                if (!string.IsNullOrEmpty(fileName))
                    response.Write(fileName);

                response.End();
            }
        }

        public void Dispose() { }
    }
}