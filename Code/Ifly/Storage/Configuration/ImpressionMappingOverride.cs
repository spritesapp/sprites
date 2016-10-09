using FluentNHibernate.Automapping;
using FluentNHibernate.Automapping.Alterations;

namespace Ifly.Storage.Configuration
{   
    /// <summary>
    /// Represents auto-mapping override for Impression.
    /// </summary>
    public class ImpressionMappingOverride : IAutoMappingOverride<Impression>
    {
        /// <summary>
        /// Overrides the auto-mapping.
        /// </summary>
        /// <param name="mapping">Mapping.</param>
        public void Override(AutoMapping<Impression> mapping)
        {
            mapping.Map(m => m.PresentationId).Index("IDX_Impression_PresentationId");
            mapping.Map(m => m.PresentationUserId).Index("IDX_Impression_PresentationUserId");
            mapping.Map(m => m.Timestamp).Index("IDX_Impression_Timestamp");
        }
    }
}
