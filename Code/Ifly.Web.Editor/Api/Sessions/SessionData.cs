using System;
using System.Collections.Concurrent;

namespace Ifly.Web.Editor.Api.Sessions
{
    /// <summary>
    /// Represents a session data.
    /// </summary>
    public class SessionData
    {
        private DateTime _expiresFrom;
        private readonly TimeSpan _expires;
        private readonly object _synchronizationObject;
        private readonly ConcurrentDictionary<string, object> _data;
        
        /// <summary>
        /// Get or sets the session Id.
        /// </summary>
        public string SessionId { get; set; }

        /// <summary>
        /// Gets value indicating whether this session data is expired.
        /// </summary>
        public bool IsExpired
        {
            get { return _expiresFrom.Add(_expires) < DateTime.Now; }
        }

        /// <summary>
        /// Gets the last time the session data was accessed.
        /// </summary>
        public DateTime LastAccessTime
        {
            get { return _expiresFrom; }
        }

        /// <summary>
        /// Gets the synchronization object.
        /// </summary>
        public object SynchronizationObject
        {
            get { return _synchronizationObject; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="sessionId">Session Id.</param>
        /// <param name="expires">Sliding expiration.</param>
        public SessionData(string sessionId, TimeSpan expires)
        {
            _expires = expires;
            SessionId = sessionId;
            _expiresFrom = DateTime.Now;
            _synchronizationObject = new object();
            _data = new ConcurrentDictionary<string, object>();
        }

        /// <summary>
        /// Returns value indicating whether the given field is in the data bucket.
        /// </summary>
        /// <param name="field">Field name.</param>
        /// <returns>Value indicating whether the given field is in the data bucket.</returns>
        public bool Contains(string field)
        {
            return field != null && _data.ContainsKey(field);
        }

        /// <summary>
        /// Gets the value of a given field.
        /// </summary>
        /// <typeparam name="TValue">Value type.</typeparam>
        /// <param name="field">Field name.</param>
        /// <returns>Value.</returns>
        public TValue Get<TValue>(string field)
        {
            object o = null;
            TValue ret = default(TValue);

            if (Contains(field))
            {
                if (_data.TryGetValue(field, out o) && o is TValue)
                    ret = (TValue)o;
            }

            _expiresFrom = DateTime.Now;

            return ret;
        }

        /// <summary>
        /// Sets the new value for a given field.
        /// </summary>
        /// <typeparam name="TValue">Value type.</typeparam>
        /// <param name="field">Field name.</param>
        /// <param name="value">Value.</param>
        public void Set<TValue>(string field, TValue value)
        {
            if (field != null)
                _data.AddOrUpdate(field, value, (k, e) => value);

            _expiresFrom = DateTime.Now;
        }
    }
}