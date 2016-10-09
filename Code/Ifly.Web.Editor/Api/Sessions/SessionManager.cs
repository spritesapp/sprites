using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Web;

namespace Ifly.Web.Editor.Api.Sessions
{
    /// <summary>
    /// Represents a session manager. This class cannot be inherited.
    /// </summary>
    public sealed class SessionManager
    {
        private static readonly ConcurrentDictionary<string, SessionData> _data;

        /// <summary>
        /// Gets the session expiration timeout, in minutes.
        /// </summary>
        public const int ExpirationTimeout = 60;

        /// <summary>
        /// Gets the maximum number of concurrent sessions.
        /// </summary>
        public const int MaxConcurrentSessions = 5000;

        /// <summary>
        /// Gets the name of HTTP header which holds information about the current session.
        /// </summary>
        public const string RequestHeaderName = "X-Ifly-SessionId";

        /// <summary>
        /// Gets the current session data.
        /// </summary>
        public static SessionData Current
        {
            get
            {
                SessionData ret = null;
                string id = HttpContext.Current != null && HttpContext.Current.Request != null ?
                    HttpContext.Current.Request.Headers[RequestHeaderName] : string.Empty;

                if (!string.IsNullOrEmpty(id))
                    _data.TryGetValue(id, out ret);

                return ret;
            }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static SessionManager()
        {
            _data = new ConcurrentDictionary<string, SessionData>();
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        private SessionManager() { }

        /// <summary>
        /// Removes expired session data.
        /// </summary>
        public static void Cleanup()
        {
            SessionData d = null;

            Array.ForEach(_data.Where(p => p.Value.IsExpired).Select(p => p.Key).ToArray(), 
                k => _data.TryRemove(k, out d));

            if (_data.Count > MaxConcurrentSessions)
            {
                Array.ForEach(_data.OrderBy(p => p.Value.LastAccessTime).Take(_data.Count - MaxConcurrentSessions).Select(p => p.Key).ToArray(),
                    k => _data.TryRemove(k, out d));
            }
        }

        /// <summary>
        /// Returns value indicating whether the session with the given Id is currently being maintained.
        /// </summary>
        /// <param name="sessionId">Session Id.</param>
        /// <returns>Value indicating whether the session with the given Id is currently being maintained.</returns>
        public static bool ContainsSession(string sessionId)
        {
            SessionData data = null;

            return !string.IsNullOrEmpty(sessionId) && 
                _data.TryGetValue(sessionId, out data) && !data.IsExpired;
        }

        /// <summary>
        /// Maps existing session to the one with the new session Id.
        /// </summary>
        /// <param name="sessionId">Existing session Id.</param>
        /// <param name="clientId">Client Id.</param>
        /// <returns>The Id of the new session.</returns>
        public static string MapSession(string sessionId, string clientId)
        {
            SessionData data = null;
            string ret = string.Empty;
            string previousSessionId = string.Empty;

            if (!string.IsNullOrEmpty(sessionId) &&
                _data.TryGetValue(sessionId, out data) && !data.IsExpired)
            {
                ret = NewSession(clientId);
                previousSessionId = data.SessionId;

                if (!string.IsNullOrEmpty(ret))
                {
                    _data.TryRemove(previousSessionId, out data);
                    data.SessionId = ret;
                    _data.AddOrUpdate(ret, data, (k, e) => data);
                }
            }

            return ret;
        }

        /// <summary>
        /// Generates new session Id from the given client Id.
        /// </summary>
        /// <param name="clientId">Client Id.</param>
        /// <returns>Session Id.</returns>
        public static string NewSession(string clientId)
        {
            string ret = Utils.Crypto.GetHash(clientId + Guid.NewGuid().ToString());

            _data.TryAdd(ret, new SessionData(ret, TimeSpan.FromMinutes(ExpirationTimeout)));
            
            Cleanup();

            return ret;
        }
    }
}