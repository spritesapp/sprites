namespace Ifly.Storage.Services
{
    /// <summary>
    /// Represents a data service that supports CRUD operations.
    /// </summary>
    /// <typeparam name="TRecord">Record type.</typeparam>
    public interface IDataService<TRecord>
        where TRecord : IRecord
    {
        /// <summary>
        /// Creates or updates the given record.
        /// </summary>
        /// <param name="record">Record to create/update.</param>
        /// <returns>Resulting record.</returns>
        TRecord CreateOrUpdate(TRecord record);

        /// <summary>
        /// Reads the given record.
        /// </summary>
        /// <param name="id">Record Id.</param>
        /// <returns>Record.</returns>
        TRecord Read(int id);

        /// <summary>
        /// Deletes the given record.
        /// </summary>
        /// <param name="record">Record to delete.</param>
        /// <returns>Deleted record.</returns>
        TRecord Delete(TRecord record);
    }
}
