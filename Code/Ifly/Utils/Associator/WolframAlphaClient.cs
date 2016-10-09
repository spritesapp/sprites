using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;

namespace Ifly.Utils.Associator
{
    /// <summary>
    /// Represents Wolfram | Alpha client.
    /// </summary>
    public class WolframAlphaClient
    {
        /// <summary>
        /// Represents Wolfram | Alpha comparison.
        /// </summary>
        public class WolframAlphaComparison : AssociationResult { }

        private class ComparisonData
        {
            public double? Ratio { get; private set; }
            public string Description { get; private set; }

            public ComparisonData(double? ratio, string description)
            {
                this.Ratio = ratio;
                this.Description = description;
            }
        }

        private class PodInfo
        {
            public string Query { get; private set; }
            public string Category { get; private set; }
            public string ApiEndpointUrl { get; private set; }

            public PodInfo(string apiEndpointUrl, string query, string category)
            {
                this.Query = query;
                this.Category = category;
                this.ApiEndpointUrl = apiEndpointUrl;
            }
        }

        private double _value;
        private ValueUnit _valueUnit;
        private string _workerHost;
        private Dictionary<string, PodInfo> _pods;

        /// <summary>
        /// Gets or sets value indicating whether to supress all exceptions.
        /// </summary>
        public bool Silent { get; set; }

        /// <summary>
        /// Loads the initial processing data for a given association request.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <param name="unit">Unit.</param>
        public void Load(double value, ValueUnit unit)
        {
            _value = value;
            _valueUnit = unit;

            var url = string.Format("http://www.wolframalpha.com/input/?i={0}", 
                UnitConverter.Explain(value, unit).Replace(" ", "+"));

            var html = ReadResponse(() =>
            {
                var request = CreateRequest(url);

                request.Method = "GET";
                request.Referer = url;

                return request;
            });

            var rawPods = GetRawPods(html);
            var pods = GetPods(rawPods);

            _workerHost = GetWorkerHost(html);

            _pods = new Dictionary<string, PodInfo>();

            foreach (var pod in pods)
            {
                if (!_pods.ContainsKey(pod.Category))
                    _pods.Add(pod.Category, pod);
            }
        }

        /// <summary>
        /// Returns comparison data for a given association.
        /// </summary>
        /// <returns>Comparison data for a given association.</returns>
        public IEnumerable<WolframAlphaComparison> GetComparisonData()
        {
            var ret = new List<WolframAlphaComparison>();

            if (_pods != null && !string.IsNullOrEmpty(_workerHost))
            {
                foreach (var pod in _pods.Values.Where(pair => 
                    pair.Category.StartsWith("Comparison", StringComparison.OrdinalIgnoreCase)))
                {
                    var url = string.Format("http://{0}/input/{1}&i={2}&podId={3}&asynchronous=true",
                        _workerHost, pod.ApiEndpointUrl, pod.Query, pod.Category);

                    var referer = string.Format("http://www.wolframalpha.com/input/?i={0}", pod.Query);

                    var html = ReadResponse(() =>
                    {
                        var request = CreateRequest(url);

                        request.Method = "GET";
                        request.Referer = referer;

                        return request;
                    });

                    var comparisonData = GetComparisonDataFromPodResponse(html);

                    foreach (var comparisonDataRow in comparisonData)
                    {
                        ret.Add(new WolframAlphaComparison()
                        {
                            Category = pod.Category.Replace("ComparisonAs", string.Empty),
                            Value = _value,
                            Unit = _valueUnit,
                            Ratio = comparisonDataRow.Ratio,
                            Description = comparisonDataRow.Description
                        });
                    }
                }
            }

            return ret;
        }

        private HttpWebRequest CreateRequest(string url)
        {
            var request = WebRequest.CreateHttp(new Uri(url, UriKind.Absolute));

            request.Timeout = 3000;
            request.Accept = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8";
            request.UserAgent = "ozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36";
            request.Headers["Accept-Language"] = "en-US,en;q=0.8,cs;q=0.6,da;q=0.4,de;q=0.2,fr;q=0.2,pl;q=0.2,ru;q=0.2";

            return request;
        }

        private string ReadResponse(Func<HttpWebRequest> requestFactory)
        {
            bool responseReceived = false;
            string response = string.Empty;

            foreach (var proxy in ProxyList.GetProxies())
            {
                try
                {
                    var request = requestFactory();

                    request.Proxy = new WebProxy(proxy);

                    using (var responseObject = request.GetResponse())
                    {
                        byte[] data = Input.ReadFromStream(responseObject.GetResponseStream());
                        response = System.Text.Encoding.UTF8.GetString(data);

                        responseReceived = true;
                    }
                }
                catch (Exception) 
                {
                    ProxyList.MarkAsDead(proxy);

                    if (!Silent)
                        throw;
                }

                if (responseReceived)
                    break;
            }

            return response;
        }

        private IEnumerable<string> GetRawPods(string html)
        {
            return Regex.Matches(html, @"pod\.jsp", RegexOptions.IgnoreCase).OfType<Match>().Select(match => 
            {
                return html.Substring(match.Index - 1, html.IndexOf(");", match.Index) - match.Index + 1).Trim();
            }).ToList();
        }

        private IEnumerable<PodInfo> GetPods(IEnumerable<string> rawPods)
        {
            return rawPods.Select(rawPod =>
            {
                var parameters = rawPod.Split(new string[] { "\", \"" }, StringSplitOptions.None).Select(parameter =>
                {
                    return parameter.Trim(new char[] { '\"', ' ' });
                }).ToArray();

                return parameters.Length >= 6 ?
                    new PodInfo(parameters[0], parameters[2], parameters[5]) : null;
            }).Where(pod => pod != null);
        }

        private IEnumerable<ComparisonData> GetComparisonDataFromPodResponse(string html)
        {
            return Regex.Matches(html, "\"stringified\":", RegexOptions.IgnoreCase).OfType<Match>().Select(match =>
            {
                int startIndex = html.IndexOf("\"", match.Index + match.Length),
                    endIndex = html.IndexOf("\",", match.Index);

                var rawDescription = html.Substring(startIndex + 1, endIndex - startIndex - 1).Trim(new char[] { ' ', '~' });

                double? ratio = null;

                if (rawDescription.StartsWith("("))
                {
                    var rangeUnparsed = rawDescription.Substring(1, rawDescription.IndexOf(')') - 1).Trim();
                    var range = rangeUnparsed.Split(new string[] { " to ", " ~~ " }, StringSplitOptions.RemoveEmptyEntries).ToArray();

                    if (range.Length > 1)
                    {
                        ratio = rangeUnparsed.IndexOf("~~") > 0 ? double.Parse(range[0]) :
                            Math.Round((double.Parse(range[0]) + double.Parse(range[1])) / 2, 2);
                    }
                }
                else if (Regex.IsMatch(rawDescription, "^[0-9]", RegexOptions.IgnoreCase))
                    ratio = double.Parse(rawDescription.Substring(0, rawDescription.IndexOf(' ')));

                var times = "&times;";
                var description = ratio.HasValue ? rawDescription.Substring(rawDescription.IndexOf(times) + times.Length).Trim() : rawDescription;

                if (description.EndsWith(")"))
                    description = description.Substring(0, description.LastIndexOf("(")).Trim();

                description = description.Replace("\\\"", "\"");
                description = description.Replace("\\'", "'");
                description = description.Trim(new char[] { '=', ' '});

                return new ComparisonData(ratio, description);
            });
        }

        private string GetWorkerHost(string html)
        {
            var match = Regex.Match(html, @"http://www([0-9a-zA-Z]+)\.wolframalpha\.com/Calculate/MSP/", RegexOptions.IgnoreCase);
            return match.Success ? new Uri(match.Value).Host : string.Empty;
        }
    }
}
