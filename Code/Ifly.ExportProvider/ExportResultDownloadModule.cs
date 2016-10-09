using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Ifly.ExportProvider
{
    public class ExportResultDownloadModule : IHttpModule
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

            if (request.Url.AbsolutePath.StartsWith("/download", StringComparison.OrdinalIgnoreCase))
            {
                var id = request.QueryString["key"] ?? string.Empty;
                var physicalPath = app.Server.MapPath("~/App_Data/Exports");
                var fileName = string.Empty;

                if (System.IO.Directory.Exists(physicalPath))
                {
                    fileName = System.IO.Directory.EnumerateFiles(physicalPath).Where(f =>
                        string.Compare(System.IO.Path.GetFileNameWithoutExtension(f), id, true) == 0).FirstOrDefault();
                }

                var status = !string.IsNullOrEmpty(fileName) ? System.Net.HttpStatusCode.OK : System.Net.HttpStatusCode.NotFound;

                response.Clear();

                response.StatusCode = (int)status;
                response.StatusDescription = !string.IsNullOrEmpty(fileName) ? "OK" : "Not Found";
                response.Status = string.Format("{0} {1}", response.StatusCode, response.StatusDescription);

                if (!string.IsNullOrEmpty(fileName))
                {
                    byte[] fileData = ServiceAdapter.ImageToPdfComposer.TryCompose(fileName);

                    if (fileData == null)
                    {
                        fileData = System.IO.File.ReadAllBytes(fileName);
                        System.IO.File.Delete(fileName);
                    }

                    var contentDisposition = new System.Net.Mime.ContentDisposition()
                    {
                        FileName = string.Format("sprites-export.{0}", System.IO.Path.GetExtension(fileName).Trim(' ', '.')),
                        Inline = false
                    };

                    response.AppendHeader("Content-Disposition", contentDisposition.ToString());

                    response.Headers.Remove("Cache-Control");
                    response.Headers.Remove("Pragma");
                    response.Headers.Remove("Expires");

                    response.ContentType = "application/octet-stream";
                    response.BinaryWrite(fileData);

                    response.Flush();
                    response.End();
                }
            }
        }

        public void Dispose() { }
    }
}