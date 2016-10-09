using FluentNHibernate.Automapping;
using FluentNHibernate.Cfg;
using FluentNHibernate.Cfg.Db;
using NHibernate;
using NHibernate.Context;
using NHibernate.Linq;
using NHibernate.Tool.hbm2ddl;
using System;
using System.Linq;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents NHibernate repository.
    /// </summary>
    /// <typeparam name="TRecord">Record type.</typeparam>
    public class NHibernateRepository<TRecord> : IRepository<TRecord>
        where TRecord : IRelationalRecord
    {
        private readonly ISession _session;
        private static ISessionFactory _sessionFactory;
        private static readonly object _lock = new object();

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public NHibernateRepository()
        {
            _session = GetSessionFactory().GetCurrentSession();

            if (!_session.IsOpen)
                _session = GetSessionFactory().OpenSession();
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
                ret = _session.Get<TRecord>(id);

            return ret;
        }

        /// <summary>
        /// Returns IQueryable object.
        /// </summary>
        /// <returns>IQueryable object.</returns>
        public IQueryable<TRecord> Query()
        {
            return _session.Query<TRecord>();
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
                _session.SaveOrUpdate(ret);

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
                _session.Delete(ret);

            return ret;
        }

        /// <summary>
        /// Performs application-defined tasks associated with freeing, releasing, or resetting unmanaged resources.
        /// </summary>
        public void Dispose()
        {
            _session.Flush();
            _session.Dispose();

            if (System.Web.HttpContext.Current != null)
                WebSessionContext.Unbind(_sessionFactory);
        }

        /// <summary>
        /// Obtains session factory.
        /// </summary>
        /// <returns>Session factory.</returns>
        private static ISessionFactory GetSessionFactory()
        {
            FluentConfiguration config = null;

            if (_sessionFactory == null)
            {
                lock (ApplicationContext.Current.GetSynchronizationObject())
                {
                    if (_sessionFactory == null)
                    {
                        config = Fluently.Configure()
                            .Database(MsSqlConfiguration.MsSql2008.ConnectionString(c => c.FromConnectionStringWithKey("Relational")))
                            .Mappings(m => m.AutoMappings.Add(AutoMap.AssemblyOf<IRelationalRecord>(new Configuration.FluentNHibernateAutoMappingConfiguration()).Conventions.AddFromAssemblyOf<Configuration.FluentNHibernateAutoMappingConfiguration>().UseOverridesFromAssemblyOf<Configuration.FluentNHibernateAutoMappingConfiguration>()))
                            .ExposeConfiguration(c => new SchemaUpdate(c).Execute(false, true));

                        if (System.Web.HttpContext.Current != null)
                            config = config.CurrentSessionContext<WebSessionContext>();
                        else
                            config = config.CurrentSessionContext<ThreadLocalSessionContext>();

                        _sessionFactory = config.BuildSessionFactory();
                    }
                }
            }

            if (System.Web.HttpContext.Current != null && !WebSessionContext.HasBind(_sessionFactory))
                WebSessionContext.Bind(_sessionFactory.OpenSession());

            return _sessionFactory;
        }
    }
}
