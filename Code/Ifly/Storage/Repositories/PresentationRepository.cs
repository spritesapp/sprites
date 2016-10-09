using System.Linq;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents a presentation repository.
    /// </summary>
    public class PresentationRepository : RavenRepository<Presentation>, IPresentationRepository
    {
        /// <summary>
        /// Returns the presentation descriptors for a given user.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <returns>Presentation descriptors.</returns>
        public IList<PresentationRecordDescriptor> GetPresentationsByUser(int userId)
        {
            IList<PresentationRecordDescriptor> ret = new List<PresentationRecordDescriptor>();

            if (userId > 0)
            {
                foreach (var result in base.Session.Query<Presentation>()
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.Created)
                    .Select(p => new { p.Id, p.Title, p.Created, p.IsArchived }))
                {
                    ret.Add(new PresentationRecordDescriptor() {
                        Id = result.Id,
                        Name = result.Title,
                        Created = result.Created,
                        IsArchived = result.IsArchived
                    });
                }
            }

            return ret;
        }

        /// <summary>
        /// Updates the given record.
        /// </summary>
        /// <param name="record">Record to update.</param>
        /// <returns>AUpdated record.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="record" /> is null.</exception>
        public override Presentation Update(Presentation record)
        {
            int presentationId = -1;

            if (record == null)
                throw new System.ArgumentNullException("record");

            presentationId = record.Id;

            if (presentationId <= 0)
                presentationId = base.Update(record).Id;

            if (record != null)
            {
                // Updating publish settings presentation Id.
                if (record.PublishSettings != null)
                    record.PublishSettings.PresentationId = presentationId;

                // Updating presenter settings presentation Id.
                if (record.PresenterSettings != null)
                    record.PresenterSettings.PresentationId = presentationId;

                if (record.Slides.Any())
                {
                    // Updating slide Ids.
                    foreach (var slide in record.Slides.Where(s => s.Id <= 0))
                    {
                        slide.Id = base.NewId(slide);
                        slide.PresentationId = presentationId;
                    }

                    // Updating element Ids.
                    foreach (var slide in record.Slides)
                    {
                        if (slide.Elements.Any())
                        {
                            foreach (var element in slide.Elements.Where(e => e.Id <= 0))
                            {
                                element.Id = base.NewId(element);
                                element.SlideId = slide.Id;
                            }
                        }
                    }

                    // Updating element property Ids.
                    foreach (var slide in record.Slides)
                    {
                        foreach (var element in slide.Elements)
                        {
                            if (element.Properties.Any())
                            {
                                foreach (var property in element.Properties.Where(e => e.Id <= 0))
                                {
                                    property.Id = base.NewId(property);
                                    property.ElementId = element.Id;
                                }
                            }
                        }
                    }
                }
            }

            return base.Update(record);
        }
    }
}
