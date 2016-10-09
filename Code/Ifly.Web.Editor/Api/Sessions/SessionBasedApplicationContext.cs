namespace Ifly.Web.Editor.Api.Sessions
{
    /// <summary>
    /// Represents session-based application context.
    /// </summary>
    public class SessionBasedApplicationContext : Ifly.ApplicationContext
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public SessionBasedApplicationContext() { }

        /// <summary>
        /// Returns an object used to synchronize access to various resources from multiple threads.
        /// </summary>
        /// <returns>An object used to synchronize access to various resources from multiple threads.</returns>
        public override object GetSynchronizationObject()
        {
            object ret = SessionManager.Current != null ? SessionManager.Current.SynchronizationObject : null;
            return ret != null ? ret : base.GetSynchronizationObject();
        }
    }
}