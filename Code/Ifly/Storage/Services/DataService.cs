using Ifly.Storage.Repositories;
using System;

namespace Ifly.Storage.Services
{
    /// <summary>
    /// Represents a data service that supports CRUD operations.
    /// </summary>
    /// <typeparam name="TRecord">Record type.</typeparam>
    /// <typeparam name="TRepository">Repository type.</typeparam>
    public abstract class DataService<TRecord, TRepository> : IDataService<TRecord> 
        where TRecord : IRecord
        where TRepository: IRepository<TRecord>
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        protected DataService() { }

        /// <summary>
        /// Creates or updates the given record.
        /// </summary>
        /// <param name="record">Record to create/update.</param>
        /// <returns>Resulting record.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="record" /> is null.</exception>
        public TRecord CreateOrUpdate(TRecord record)
        {
            TRecord ret = record;

            if (record == null)
                throw new ArgumentNullException("record");

            using (var repo = OpenRespository())
                ret = repo.Update(ret);

            return ret;
        }

        /// <summary>
        /// Reads the given record.
        /// </summary>
        /// <param name="id">Record Id.</param>
        /// <returns>Record.</returns>
        public virtual TRecord Read(int id)
        {
            TRecord ret = default(TRecord);

            if (id > 0)
            {
                using (var repo = OpenRespository())
                    ret = repo.Select(id);
            }

            return ret;
        }

        /// <summary>
        /// Deletes the given record.
        /// </summary>
        /// <param name="record">Record to delete.</param>
        /// <returns>Deleted record.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="record" /> is null.</exception>
        public virtual TRecord Delete(TRecord record)
        {
            TRecord ret = record;

            if (record == null)
                throw new ArgumentNullException("record");

            using (var repo = OpenRespository())
                ret = repo.Delete(ret);

            return ret;
        }

        /// <summary>
        /// Opens the associated repository.
        /// </summary>
        /// <returns>Repository.</returns>
        protected virtual TRepository OpenRespository()
        {
            return Resolver.Resolve<TRepository>();
        }
    }
}
