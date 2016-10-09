using FluentNHibernate;
using FluentNHibernate.Automapping;
using System;
using System.Linq;

namespace Ifly.Storage.Configuration
{
    /// <summary>
    /// Represents Fluent NHibernate auto-mapping configuration.
    /// </summary>
    public class FluentNHibernateAutoMappingConfiguration : DefaultAutomappingConfiguration
    {
        /// <summary>
        /// Returns value indicating whether the given type should be auto-mapped.
        /// </summary>
        /// <param name="type">Type.</param>
        /// <returns>Value indicating whether the given type should be auto-mapped.</returns>
        public override bool ShouldMap(Type type)
        {
            return !string.IsNullOrEmpty(type.Namespace) && type.Namespace.StartsWith("Ifly") && type.GetInterfaces().Any(y => y.Equals(typeof(IRelationalRecord)));
        }

        /// <summary>
        /// Returns value indicating whether the given member is the record identifier.
        /// </summary>
        /// <param name="member">Member.</param>
        /// <returns>Value indicating whether the given member is the record identifier.</returns>
        public override bool IsId(Member member)
        {
            return string.Compare(member.Name, "Id", true) == 0;
        }
    }
}
