using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace Ifly.Web.Editor.Api.Sessions
{
    /// <summary>
    /// Represents a filter which ensures that the current session information passed from the client matches the one which the server holds.
    /// </summary>
    public class BoundedSessionAttribute : DelegatingHandler
    {
        /// <summary>
        /// Sends an HTTP request to the inner handler to send to the server as an asynchronous operation.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Task.</returns>
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var o = IsValidSession(request) ? 
                base.SendAsync(request, cancellationToken) : 
                CreateInvalidSessionResponse(request);

            await o;

            SessionManager.Cleanup();

            return o.Result;
        }

        /// <summary>
        /// Returns value indicating whether session is valid.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <returns>Value indicating whether session is valid.</returns>
        private bool IsValidSession(HttpRequestMessage request)
        {
            IEnumerable<string> values = null;

            return !request.RequestUri.AbsolutePath.TrimStart('/').StartsWith("api/", StringComparison.OrdinalIgnoreCase) ||
                (string.Compare(request.RequestUri.AbsolutePath.Trim('/'), "api/sessions/new", StringComparison.OrdinalIgnoreCase) == 0 && request.Method == HttpMethod.Put) ||
                (string.Compare(request.RequestUri.AbsolutePath.Trim('/'), "api/sessions/feedback", StringComparison.OrdinalIgnoreCase) == 0 && request.Method == HttpMethod.Post) ||
                (request.Headers.TryGetValues(SessionManager.RequestHeaderName, out values) && values.Any() && SessionManager.Current != null && string.Compare(values.First(), SessionManager.Current.SessionId, StringComparison.Ordinal) == 0);
        }

        /// <summary>
        /// Creates new "Invalid session Id" response.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <returns>Task.</returns>
        private Task<HttpResponseMessage> CreateInvalidSessionResponse(HttpRequestMessage request)
        {
            return Task.FromResult(request.CreateResponse(HttpStatusCode.BadRequest, "Invalid session Id."));
        }
    }
}