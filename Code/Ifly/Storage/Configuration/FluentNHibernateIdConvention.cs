using FluentNHibernate.Conventions;
using FluentNHibernate.Conventions.Instances;

namespace Ifly.Storage.Configuration
{
    /// <summary>
    /// Represents an identity convention.
    /// </summary>
    public class FluentNHibernateIdConvention : IIdConvention
    {
        /// <summary>
        /// Applies the convention.
        /// </summary>
        /// <param name="instance">Identity instance.</param>
        public void Apply(IIdentityInstance instance)
        {
            instance.GeneratedBy.Increment();
        }
    }
}
