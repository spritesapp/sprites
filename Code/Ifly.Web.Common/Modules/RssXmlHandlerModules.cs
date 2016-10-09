using System;
using System.Web;

namespace Ifly.Web.Common.Modules
{
    public class RssXmlHandlerModule : IHttpModule
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

            if (request.Url.AbsolutePath.StartsWith("/rss.xml", StringComparison.OrdinalIgnoreCase) ||
                request.Url.AbsolutePath.StartsWith("/feed.xml", StringComparison.OrdinalIgnoreCase))
            {
                status = System.Net.HttpStatusCode.MovedPermanently;

                response.Clear();

                response.StatusCode = (int)status;
                response.StatusDescription = "Moved Permanently";
                response.Status = string.Format("{0} {1}", response.StatusCode, response.StatusDescription);

                response.Headers.Add("Location", "http://blog.spritesapp.com/feed.xml");

                response.End();
            }
        }

        public void Dispose() { }
    }
}