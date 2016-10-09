namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents user repository.
    /// </summary>
    public interface IUserRepository : IRepository<User>, IDependency 
    {
        /// <summary>
        /// Selects the given user by the external Id.
        /// </summary>
        /// <param name="externalId">External Id.</param>
        /// <returns>User.</returns>
        User SelectByExternalId(string externalId);
    }
}
