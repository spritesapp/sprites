using Ifly.Storage.Services;
using System.Web.Http;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents a root (presentation) API controller.
    /// </summary>
    public abstract class RootApiController : 
        DataApiController<Presentation, IPresentationService>,
        IConfigurableServiceController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public virtual int Priority
        {
            get { return 0; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        protected RootApiController() { }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public virtual void Configure(HttpConfiguration config) { }
    }
}