using FluentNHibernate.Automapping;
using FluentNHibernate.Automapping.Alterations;

namespace Ifly.Storage.Configuration
{
    /// <summary>
    /// Represents auto-mapping override for Impression.
    /// </summary>
    public class SocialImpactMappingOverride : IAutoMappingOverride<SocialImpact>
    {
        /// <summary>
        /// Overrides the auto-mapping.
        /// </summary>
        /// <param name="mapping">Mapping.</param>
        public void Override(AutoMapping<SocialImpact> mapping)
        {
            mapping.Map(m => m.PresentationId).Index("IDX_SocialImpact_PresentationId");
            mapping.Map(m => m.Channel).CustomType<SocialImpactChannel>().Index("IDX_SocialImpact_Channel");
            mapping.Map(m => m.Timestamp).Index("IDX_SocialImpact_Timestamp");
        }
    }
}
