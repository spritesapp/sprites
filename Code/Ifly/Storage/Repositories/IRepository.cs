using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents a repository.
    /// </summary>
    /// <typeparam name="TRecord">Record type.</typeparam>
    public interface IRepository<TRecord> : System.IDisposable
        where TRecord : IRecord
    {
        /// <summary>
        /// Selects the given record by its Id.
        /// </summary>
        /// <param name="id">Record Id.</param>
        /// <returns>Record.</returns>
        TRecord Select(int id);

        /// <summary>
        /// Returns IQueryable object.
        /// </summary>
        /// <returns>IQueryable object.</returns>
        IQueryable<TRecord> Query();

        /// <summary>
        /// Updates the given record.
        /// </summary>
        /// <param name="record">Record to update.</param>
        /// <returns>AUpdated record.</returns>
        TRecord Update(TRecord record);

        /// <summary>
        /// Delete the given record.
        /// </summary>
        /// <param name="record">Record to delete.</param>
        /// <returns>Deleted record.</returns>
        TRecord Delete(TRecord record);
    }
}
