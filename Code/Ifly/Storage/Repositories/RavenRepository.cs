using System;
using System.Collections.Generic;
using System.Linq.Expressions;

using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Connection;
using Raven.Client.Linq;
using System.Linq;
using Raven.Client.Indexes;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents a RavenDB repository.
    /// </summary>
    /// <typeparam name="TRecord">Record type.</typeparam>
    public class RavenRepository<TRecord> : IRepository<TRecord>
        where TRecord: IRecord
    {
        private static readonly IDocumentStore _store;
        private readonly IDocumentSession _session;

        /// <summary>
        /// Gets the RavenDB document session.
        /// </summary>
        protected IDocumentSession Session
        {
            get { return _session; }
        }

        /// <summary>
        /// Gets the RavenDB document store.
        /// </summary>
        protected IDocumentStore Store
        {
            get { return _store; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static RavenRepository()
        {
            _store = new DocumentStore()
            {
                ConnectionStringName = "Main"
            };

            _store.Initialize();
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public RavenRepository()
        {
            _session = _store.OpenSession("Ifly");
            _session.Advanced.MaxNumberOfRequestsPerSession = 1000;
        }

        /// <summary>
        /// Selects the given record by its Id.
        /// </summary>
        /// <param name="id">Record Id.</param>
        /// <returns>Record.</returns>
        public virtual TRecord Select(int id)
        {
            TRecord ret = default(TRecord);

            if (id > 0)
                ret = Session.Load<TRecord>(id);

            return ret;
        }

        /// <summary>
        /// Returns IQueryable object.
        /// </summary>
        /// <returns>IQueryable object.</returns>
        public IQueryable<TRecord> Query()
        {
            return this.Session.Query<TRecord>();
        }

        /// <summary>
        /// Updates the given record.
        /// </summary>
        /// <param name="record">Record to update.</param>
        /// <returns>AUpdated record.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="record" /> is null.</exception>
        public virtual TRecord Update(TRecord record)
        {
            TRecord ret = record;

            if (record == null)
                throw new ArgumentNullException("record");

            lock (ApplicationContext.Current.GetSynchronizationObject())
            {
                Session.Store(ret);
                Session.SaveChanges();
            }

            return ret;
        }

        /// <summary>
        /// Delete the given record.
        /// </summary>
        /// <param name="record">Record to delete.</param>
        /// <returns>Deleted record.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="record" /> is null.</exception>
        public virtual TRecord Delete(TRecord record)
        {
            TRecord ret = record;

            if (record == null)
                throw new ArgumentNullException("record");

            if (ret.Id > 0)
            {
                Session.Delete(ret);
                Session.SaveChanges();
            }

            return ret;
        }

        /// <summary>
        /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
        /// </summary>
        public void Dispose()
        {
            Session.Dispose();
        }

        /// <summary>
        /// Generates new Id for a given record.
        /// </summary>
        /// <typeparam name="T">Record type.</typeparam>
        /// <param name="record">Record.</param>
        /// <returns>Record Id.</returns>
        protected int NewId<T>(T record) where T: IRecord
        {
            return int.Parse(_store.Conventions.GenerateDocumentKey("Ifly", _store.DatabaseCommands, record)
                .Split(new char[] { '/' }, StringSplitOptions.RemoveEmptyEntries)[1]);
        }
    }
}
