using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Resources;
using System.Text.RegularExpressions;

namespace Ifly.HelpRepositoryService
{
    /// <summary>
    /// Represents payment expiration notifier.
    /// </summary>
    internal class Populator
    {
        private static bool _isPopulating;
        private static readonly log4net.ILog _log = log4net.LogManager.GetLogger
            (System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Populates help topics.
        /// </summary>
        public static void PopulateHelpTopics()
        {
            HelpTopic topic = null;
            int totalAddedTopics = 0;
            string topicMarkdown = null;
            List<HelpTopic> topics = null;
            int mediaItemsMarkerIndex = -1;
            ResourceSet allResourceItems = null;
            string titlePattern = @"^#\s+([^\n]+)$";
            string mediaItemsMarkdown = string.Empty;
            string mediaItemsMarker = "Related images and videos:";
            Dictionary<string, HelpTopicScore> scores = new Dictionary<string, HelpTopicScore>();

            if (!_isPopulating)
            {
                _isPopulating = true;

                try
                {
                    using (var repository = new Storage.Repositories.RavenRepository<HelpTopic>())
                    {
                        // Deleting all topics.
                        while ((topics = repository.Query().Take(10).ToList()).Count > 0)
                        {
                            try
                            {
                                _log.Info(string.Format("Deleting next {0} topics...", topics.Count));

                                topics.ForEach(t =>
                                {
                                    // Remembering the score.
                                    if (!scores.ContainsKey(t.ReferenceKey))
                                        scores.Add(t.ReferenceKey, t.Score);

                                    repository.Delete(t);
                                });

                                System.Threading.Thread.Sleep(50);
                            }
                            catch { }
                        }

                        // Reading all items from "Topics.resx" file.
                        allResourceItems = Topics.ResourceManager.GetResourceSet(CultureInfo.CurrentUICulture, true, true);

                        foreach (DictionaryEntry entry in allResourceItems)
                        {
                            topicMarkdown = entry.Value.ToString().Trim();

                            if (!string.IsNullOrWhiteSpace(topicMarkdown) && topicMarkdown.Length > 0)
                            {
                                topic = new HelpTopic();

                                topic.ReferenceKey = entry.Key.ToString().Replace('_', '.').ToLowerInvariant();
                                topic.Title = Regex.Match(topicMarkdown, titlePattern, RegexOptions.Multiline).Groups[1].Value.Trim();

                                // Removing the title.
                                topicMarkdown = Regex.Replace(topicMarkdown, titlePattern, string.Empty, RegexOptions.Multiline).Trim();

                                mediaItemsMarkerIndex = topicMarkdown.IndexOf(mediaItemsMarker, StringComparison.OrdinalIgnoreCase);

                                if (mediaItemsMarkerIndex >= 0)
                                {
                                    // Extracting and stripping media items list.
                                    mediaItemsMarkdown = topicMarkdown.Substring(mediaItemsMarkerIndex + mediaItemsMarker.Length).Trim();
                                    topicMarkdown = topicMarkdown.Substring(0, mediaItemsMarkerIndex).Trim();

                                    // Getting list items and separating them into its own collection (displayed as a gallery).
                                    topic.MediaItems = mediaItemsMarkdown.Split(new string[] { "- " }, StringSplitOptions.None)
                                        .Select(item => item.Trim()).Where(item => !string.IsNullOrWhiteSpace(item) && item.Length > 0)
                                        .Select(item => item.IndexOf('/') < 0 ? string.Format("/Assets/img/help/{0}/{1}", entry.Key, item) : item).ToList();
                                }

                                topic.Body = topicMarkdown;

                                if (scores.ContainsKey(topic.ReferenceKey))
                                    topic.Score = scores[topic.ReferenceKey];

                                _log.Info(string.Format("Adding new topic: {0}...", topic.ReferenceKey));

                                // Inserting new topic.
                                repository.Update(topic);

                                totalAddedTopics++;
                            }
                        }
                    }

                    _log.Info(string.Format("Done adding topics (total: {0}).", totalAddedTopics));
                }
                catch (Exception ex)
                {
                    _log.Error("Failed to populate help topics.", ex);
                }

                _isPopulating = false;
            }
        }
    }
}
