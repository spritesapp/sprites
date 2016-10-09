using System;
using System.Collections.Generic;
using System.Linq;
using Ifly.QueueService;
using Ifly.Utils.Social;

namespace Ifly.ImpressionsService
{
    /// <summary>
    /// Represents a collector.
    /// </summary>
    internal class Collector
    {
        private static bool _isCollecting;
        private static readonly log4net.ILog _log = log4net.LogManager.GetLogger
            (System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Collects queued impressions.
        /// </summary>
        public static void CollectQueuedImpressions()
        {
            Presentation p = null;
            IMessageQueue queue = null;
            GenericMessageBody body = null;
            IEnumerable<Message> messages = null;
            IDictionary<int, int> addedImpressions = null;
            List<Tuple<GenericMessageBody, Message>> dispatchedMessages = null;

            if (!_isCollecting)
            {
                _isCollecting = true;

                queue = MessageQueueManager.Current.GetQueue(MessageQueueType.Impressions);
                messages = queue.GetMessages().ToList();
                dispatchedMessages = new List<Tuple<GenericMessageBody, Message>>();

                if (messages != null && messages.Any())
                {
                    try
                    {
                        using (var repository = new Storage.Repositories.NHibernateRepository<Impression>())
                        {
                            foreach (var m in messages)
                            {
                                try
                                {
                                    body = GenericMessageBody.FromString(m.Body);

                                    if (body != null)
                                    {
                                        repository.Update(new Impression()
                                        {
                                            PresentationId = body.GetParameter<int>("PresentationId"),
                                            PresentationUserId = body.GetParameter<int>("PresentationUserId"),
                                            Timestamp = m.Created
                                        });

                                        dispatchedMessages.Add(new Tuple<GenericMessageBody, Message>(body, m));
                                    }
                                }
                                catch (Exception ex)
                                {
                                    _log.Error(string.Format("Failed to collect message with Id '{0}'", m.Id), ex);
                                }
                            }
                        }

                        queue.RemoveMessages(dispatchedMessages.Select(m => m.Item2));
                        addedImpressions = dispatchedMessages.GroupBy(t => t.Item1.GetParameter<int>("PresentationId")).ToDictionary(g => g.Key, g => g.Count());

                        using (var repository = new Storage.Repositories.RavenRepository<Presentation>())
                        {
                            foreach (var imp in addedImpressions)
                            {
                                try
                                {
                                    p = repository.Select(imp.Key);

                                    if (p != null && p.TotalImpressions < 10000)
                                    {
                                        p.TotalImpressions += imp.Value;
                                        repository.Update(p);
                                    }
                                }
                                catch (Exception ex)
                                {
                                    _log.Error(string.Format("Failed to update total impressions for infographic with Id '{0}'", imp.Key), ex);
                                }
                            }
                        }

                        if (addedImpressions != null && addedImpressions.Any())
                        {
                            CollectSocialImpacts(addedImpressions.Keys);
                        }
                    }
                    catch (Exception ex)
                    {
                        _log.Error(string.Format("Failed to collect {0} impression(s).", messages.Count()), ex);
                    }
                }

                _isCollecting = false;
            }
        }

        /// <summary>
        /// Collects social impacts.
        /// </summary>
        /// <param name="ids">Collection of presentation ids.</param>
        private static void CollectSocialImpacts(IEnumerable<int> presentationIds)
        {
            var allEstimators = new Dictionary<SocialImpactChannel, PopularityEstimator>() {
                { SocialImpactChannel.Facebook, new FacebookPopularityEstimator() },
                { SocialImpactChannel.GooglePlus, new GooglePlusPopularityEstimator() },
                { SocialImpactChannel.Twitter, new TwitterPopularityEstimator() },
                { SocialImpactChannel.LinkedIn, new LinkedInPopularityEstimator() }
            };

            DateTime currentTimestamp = DateTime.UtcNow;
            SocialImpact impact = null;
            Dictionary<SocialImpactChannel, PopularityEstimator> estimators = null;

            try
            {
                using (var repository = new Storage.Repositories.NHibernateRepository<SocialImpact>())
                {
                    foreach (var presentationId in presentationIds)
                    {
                        estimators = new Dictionary<SocialImpactChannel, PopularityEstimator>(allEstimators);

                        try
                        {
                            var impacts = repository.Query()
                                .Where(x => x.PresentationId == presentationId)
                                .ToDictionary(k => k.Channel);

                            foreach (var i in impacts.Values)
                            {
                                if ((i.Timestamp - currentTimestamp).TotalMinutes < 30)
                                {
                                    estimators.Remove(i.Channel);
                                }
                            }

                            foreach (var estimator in estimators)
                            {
                                impact = null;

                                if (impacts.ContainsKey(estimator.Key))
                                {
                                    impact = impacts[estimator.Key];
                                }


                                if (impact == null)
                                {
                                    impact = new SocialImpact()
                                    {
                                        Channel = estimator.Key,
                                        PresentationId = presentationId
                                    };
                                }

                                impact.Timestamp = currentTimestamp;
                                impact.Value = (int)estimator.Value.Score(PublishConfiguration.GetAbsoluteUri(new Uri("https://spritesapp.com", UriKind.Absolute), presentationId));

                                repository.Update(impact);
                            }   
                        }
                        catch (Exception ex)
                        {
                            _log.Error(string.Format("Failed to update social impacts for infographic with Id '{0}'", presentationId), ex);
                        }
                        finally
                        {
                            estimators.Clear();
                            estimators = null;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _log.Error(string.Format("Failed to collect {0} social impact(s).", presentationIds.Count()), ex);
            }
        }
    }
}
