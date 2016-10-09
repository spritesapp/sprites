using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;

namespace Ifly.Web.Editor.Api
{
    /// <summary>
    /// Represents impressions controller.
    /// </summary>
    public class ImpressionsController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 4; }
        }

        /// <summary>
        /// Returns infographic impressions.
        /// </summary>
        /// <param name="id">Infographic Id.</param>
        /// <returns>Impressions.</returns>
        [HttpGet]
        public IEnumerable<ImpressionSummary> GetImpressions(int id)
        {
            int order = 0;
            Presentation p = null;
            List<int> days = new List<int>();
            string presentationUrl = string.Empty;
            ImpressionSummary normalSummary = null;
            List<ImpressionSummary> ret = new List<ImpressionSummary>();
            DateTime dtNow = DateTime.UtcNow, dtSevenDaysAgo = dtNow.AddDays(-7), dtCurrent = dtSevenDaysAgo;

            if (id > 0)
            {
                p = base.Service.Read(id);

                if (p != null && Ifly.ApplicationContext.Current.User != null && p.UserId == Ifly.ApplicationContext.Current.User.Id)
                {
                    presentationUrl = PublishConfiguration.GetAbsoluteUri(Request.RequestUri, id);

                    using (var repository = new Storage.Repositories.NHibernateRepository<Impression>())
                    {
                        // Selecting all non-empty impressions (the ones that have timestamp and presentation Id set) with point in time as day of the month.
                        var inner = from i in repository.Query()
                                    where i.Timestamp != null && i.PresentationId != null
                                    select new
                                    {
                                        Timestamp = i.Timestamp.Value,
                                        PresentationId = i.PresentationId.Value,
                                        PointInTime = i.Timestamp.Value.Day
                                    };

                        // Selecting all impressions for the last seven days groupped by point in time (day of the month).
                        var outer = from i in inner
                                    where i.PresentationId == id && i.Timestamp >= dtSevenDaysAgo && i.Timestamp <= dtNow
                                    group i by i.PointInTime;

                        // Selecting summary projections.
                        var query = from i in outer
                                    select new 
                                    { 
                                        PointInTime = i.Key, 
                                        TotalImpressions = i.Count() 
                                    };

                        // Materializing.
                        var results = query.ToList();

                        // Determining month days in a sequence (e.g. 29, 30, 31, 1, 2, 3, 4).
                        do
                        {
                            dtCurrent = dtCurrent.AddDays(1);
                            days.Add(dtCurrent.Day);
                        }
                        while (dtCurrent < dtNow);

                        foreach (int day in days)
                        {
                            normalSummary = new ImpressionSummary()
                            {
                                Order = order++,
                                PointInTime = day,
                                TotalImpressions = 0
                            };

                            // Trying to find data for the given point in time.
                            var r = results.FirstOrDefault(candidate => candidate.PointInTime == day);
                            
                            if (r != null)
                                normalSummary.TotalImpressions = r.TotalImpressions;

                            ret.Add(normalSummary);
                        }
                    }

                    // Adding social summaries.
                    using (var repository = new Storage.Repositories.NHibernateRepository<SocialImpact>())
                    {
                        ret.AddRange(repository
                            .Query()
                            .Where(x => x.PresentationId == id && x.Value != null)
                            .Select(x => new ImpressionSummary() { TotalImpressions = x.Value.Value }).ToList());
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "GetImpressions",
                routeTemplate: "api/impressions/{id}",
                defaults: new { controller = "Impressions", action = "GetImpressions" }
            );
        }
    }
}