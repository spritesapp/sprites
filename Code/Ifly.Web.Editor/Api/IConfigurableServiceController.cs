using System.Web.Http;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents a configuration HTTP API service.
    /// </summary>
    public interface IConfigurableServiceController : IDependency
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        int Priority { get; }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        void Configure(HttpConfiguration config);
    }
}
