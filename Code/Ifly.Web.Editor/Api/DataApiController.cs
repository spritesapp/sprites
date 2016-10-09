using System.Web.Http;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents a data record API controller.
    /// </summary>
    /// <typeparam name="TRecord">Record type.</typeparam>
    /// <typeparam name="TService">Data service type.</typeparam>
    public abstract class DataApiController<TRecord, TService> : ApiController
        where TRecord: Ifly.Storage.IRecord
        where TService: class, Ifly.Storage.Services.IDataService<TRecord>
    {
        /// <summary>
        /// Gets the service.
        /// </summary>
        protected TService Service { get; private set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        protected DataApiController()
        {
            this.Service = Resolver.Resolve<TService>();
        }
    }
}