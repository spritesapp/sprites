using System;
using System.Linq;
using Raven.Client;
using System.Collections.Generic;
using Raven.Abstractions.Indexing;
using Raven.Client.Indexes;
using System.Text.RegularExpressions;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents help topic repository.
    /// </summary>
    public class HelpTopicRepository : RavenRepository<HelpTopic>, IHelpTopicRepository
    {
        /// <summary>
        /// Searches among all help topics by the given search term.
        /// </summary>
        /// <param name="term">Search term.</param>
        /// <param name="offset">Zero-based offset of the matching record.</param>
        /// <param name="amount">Amount of matching records to return.</param>
        /// <returns>Matching help topics.</returns>
        public HelpTopicSearchResultSet Search(string term, int offset = 0, int amount = 20)
        {
            HelpTopicSearchResultSet ret = new HelpTopicSearchResultSet();

            // Normalizing search terms.
            string[] terms = (term ?? string.Empty)
                .Split(new char[] {' '}, StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim().ToLowerInvariant()).Distinct().ToArray();

            // Limiting the maximum number of terms.
            if (terms.Length > 10)
                terms = terms.Take(10).ToArray();

            if (terms.Any())
            {
                // Space-separated term sequence for Raven.
                string termSequence = string.Join(" ", terms);

                // Getting results with highlights.
                var results = base.Session.Query<HelpTopic>("HelpTopics/ByTitleAndBody")
                    .Search(topic => topic.Title, termSequence)
                    .Search(topic => topic.Body, termSequence)
                    .ToList()
                    .Where(topic => topic.ReferenceKey != "index")
                    .ToList()
                    .OrderBy(topic => topic.Score.Total);

                // Materializing the count.
                ret.Total = results.Count();
                
                // Materializing results for the current page.
                ret.Results = results.Skip(offset).Take(amount).ToList().Select(topic => new HelpTopicSearchResult()
                {
                    TopicId = topic.Id,
                    TopicReferenceKey = topic.ReferenceKey,
                    Title = topic.Title,
                    Summary = HelpTopicRepository.SummarizeAndHighlightMatches(topic.Body, terms)
                }).ToList();
            }

            return ret;
        }

        /// <summary>
        /// Returns a help topic with the given reference key.
        /// </summary>
        /// <param name="referenceKey">Reference key.</param>
        /// <returns>Help topic.</returns>
        public HelpTopic SelectByReferenceKey(string referenceKey)
        {
            string key = (referenceKey ?? string.Empty).Replace("_", ".");

            return this.Query().Where(topic => topic.ReferenceKey == key).FirstOrDefault();
        }

        /// <summary>
        /// Strips markdown from text.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <returns>Text without markdown.</returns>
        private static string StripMarkDown(string text)
        {
            string ret = text.Trim();

            ret = Regex.Replace(ret, @"#{1,}\s{1,}", string.Empty);
            ret = Regex.Replace(ret, @"\[([^\]]+)\]\(#([^\)]+)\)", "$1");
            ret = Regex.Replace(ret, @"(\r\n|\r|\n)", string.Empty);
            ret = Regex.Replace(ret, @"-\s\*\*([^\*]+)\*\*", "$1 - ");
            ret = Regex.Replace(ret, @"\*\*", "\"");

            ret = ret.Replace(Environment.NewLine, string.Empty);

            ret = Regex.Replace(ret, @"(\.|,|;|\?|!)([^\s]+)", "$1 $2");

            return ret.Trim();
        }

        /// <summary>
        /// Summarizes the given text and highlight matching terms using "**" Markdown notation.
        /// </summary>
        /// <param name="text">Text to summarize.</param>
        /// <param name="terms">Terms to highlight.</param>
        /// <returns>Summarized text.</returns>
        private static string SummarizeAndHighlightMatches(string text, string[] terms)
        {
            string emphasis = "**";
            string seeMore = " ... ";
            string ret = string.Empty;
            int beginningAcumulate = 0;
            int beginningOfHighlight = -1;
            Tuple<int, int> overlapping = null;
            char[] phraseEnd = new char[] { '.', '?', '!', ';' };
            int startIndex = -1, endIndex = -1, phraseSpread = 42;
            List<Tuple<int, int>> indices = new List<Tuple<int, int>>();
            bool addOpeningEmphasis = false, addClosingEmphasis = false;

            text = StripMarkDown(text);

            foreach (string t in terms)
            {
                startIndex = text.IndexOf(t, StringComparison.OrdinalIgnoreCase);

                if (startIndex >= 0)
                {
                    endIndex = startIndex + t.Length + phraseSpread - 1;

                    startIndex -= (startIndex - phraseSpread >= 0) ? phraseSpread : startIndex;
                    endIndex -= (endIndex > (text.Length - 1)) ? (endIndex - text.Length + 1) : 0;

                    indices.Add(new Tuple<int, int>(startIndex, endIndex));
                }
            }

            // Sorting by start index, ascending.
            indices.Sort((x, y) =>
            {
                return x.Item1 - y.Item1;
            });

            do
            {
                overlapping = null;

                // Trying to find an overlap.
                for (int i = 0; i < indices.Count; i++)
                {
                    for (int j = i + 1; j < indices.Count; j++)
                    {
                        if ((indices[i].Item1 + indices[i].Item2) > indices[j].Item1)
                        {
                            overlapping = new Tuple<int, int>(i, j);
                            break;
                        }
                    }

                    if (overlapping != null)
                        break;
                }

                // Merging if overlap is found.
                if (overlapping != null)
                {
                    indices[overlapping.Item1] = new Tuple<int, int>(
                        indices[overlapping.Item1].Item1,
                        indices[overlapping.Item2].Item2
                    );

                    indices.RemoveAt(overlapping.Item2);
                }
            }
            while (overlapping != null);

            if (indices.Count > 0)
            {
                // Joining the resulting snippets.
                ret = string.Concat(string.Join(seeMore, indices.Select(pair => text.Substring(pair.Item1, pair.Item2 - pair.Item1 + 1))), seeMore).Trim();

                beginningOfHighlight = indices[0].Item1;

                if (beginningOfHighlight > 0)
                {
                    // Finding the beginning of the phrase/sentence.
                    while (beginningOfHighlight >= 0 && !phraseEnd.Where(ch => ch == text[beginningOfHighlight]).Any())
                    {
                        beginningAcumulate++;
                        beginningOfHighlight--;
                    }

                    // Not considering phrase terminator itself.
                    if (beginningOfHighlight > 0)
                        beginningAcumulate--;

                    if (beginningAcumulate > 0)
                    {
                        ret = (beginningAcumulate > indices[0].Item1 ?
                            text.Substring(0, indices[0].Item1) :
                            text.Substring(indices[0].Item1 - beginningAcumulate, beginningAcumulate).TrimStart()) + ret;
                    }
                }

                // Adding emphasises ("**", highlighting the matching terms).
                foreach (string t in terms)
                {
                    startIndex = ret.IndexOf(t, StringComparison.OrdinalIgnoreCase);

                    if (startIndex >= 0)
                    {
                        addOpeningEmphasis = startIndex > 0;
                        addClosingEmphasis = startIndex + t.Length < ret.Length;

                        if (!addOpeningEmphasis)
                            ret = string.Concat(emphasis, ret);
                        else
                        {
                            ret = string.Concat(ret.Substring(0, startIndex),
                                emphasis, ret.Substring(startIndex));
                        }

                        if (!addClosingEmphasis)
                            ret = string.Concat(ret, emphasis);
                        else
                        {
                            ret = string.Concat(ret.Substring(0, startIndex + t.Length + emphasis.Length), emphasis,
                                ret.Substring(startIndex - 2 + t.Length + (emphasis.Length * 2)));
                        }
                    }
                }
            }
            
            if (string.IsNullOrEmpty(ret))
                ret = string.Concat(text.Substring(0, phraseSpread), seeMore);

            return ret;
        }
    }
}
