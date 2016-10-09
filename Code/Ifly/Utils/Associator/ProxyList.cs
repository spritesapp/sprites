using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading;

namespace Ifly.Utils.Associator
{
    /// <summary>
    /// Represents a proxy list.
    /// </summary>
    public static class ProxyList
    {
        /// <summary>
        /// Represents random proxy enumerable.
        /// </summary>
        public sealed class RandomProxyEnumerable : IEnumerable<string>
        {
            private sealed class RandomProxyEnumerator : IEnumerator<string>
            {
                private string _current;
                private readonly string[] _proxies;
                private readonly List<int> _usedIndices;
                
                public string Current
                {
                    get { return _current; }
                }

                object System.Collections.IEnumerator.Current
                {
                    get { return _current; }
                }

                public RandomProxyEnumerator(string[] proxies)
                {
                    _proxies = proxies;
                    _usedIndices = new List<int>();
                }

                public void Dispose() { }

                public bool MoveNext()
                {
                    bool ret = _usedIndices.Count < _proxies.Length;

                    if (ret)
                    {
                        int nextIndex = Shuffle(Enumerable.Range(0, _proxies.Length))
                            .Except(_usedIndices).First();

                        _current = _proxies[nextIndex];
                        _usedIndices.Add(nextIndex);
                    }

                    return ret;
                }

                public void Reset()
                {
                    _usedIndices.Clear();
                }

                private IEnumerable<T> Shuffle<T>(IEnumerable<T> source)
                {
                    var rng = new Random();
                    var buffer = source.ToList();

                    for (int i = 0; i < buffer.Count; i++)
                    {
                        int j = rng.Next(i, buffer.Count);
                        yield return buffer[j];

                        buffer[j] = buffer[i];
                    }
                }
            }

            private readonly string[] _proxies;

            public RandomProxyEnumerable(string[] proxies)
            {
                _proxies = proxies;
            }

            public IEnumerator<string> GetEnumerator()
            {
                return new RandomProxyEnumerator(_proxies);
            }

            System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator()
            {
                return new RandomProxyEnumerator(_proxies);
            }
        }

        private sealed class ProxyInfo
        {
            public string Address { get; set; }
            public double UpTime { get; set; }
            public int LastCheckedMinutes { get; set; }
        }

        private static object _lock;
        private static long _lastUpdateTime;
        private static List<string> _proxies;

        static ProxyList()
        {
            _lastUpdateTime = 0;
            _lock = new object();
            _proxies = new List<string>();
        }

        /// <summary>
        /// Marks the given proxy.
        /// </summary>
        /// <param name="proxy">Proxy.</param>
        public static void MarkAsDead(string proxy)
        {
            lock (_lock)
            {
                _proxies.Remove(proxy);
            }
        }

        /// <summary>
        /// Returns all proxies.
        /// </summary>
        /// <returns>All proxies.</returns>
        public static IEnumerable<string> GetProxies()
        {
            bool randomize = false;

            long timestamp = DateTime.UtcNow.Ticks, 
                ttl = TimeSpan.TicksPerMillisecond * 1000 * 60 * 10;

            if (_lastUpdateTime + ttl < timestamp || !_proxies.Any())
            {
                Interlocked.Exchange(ref _lastUpdateTime, timestamp);

                lock (_lock)
                {
                    _proxies.Clear();

                    var proxyFile = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/proxy.txt");

                    if (File.Exists(proxyFile))
                    {
                        using (var reader = new StreamReader(proxyFile))
                        {
                            while(true)
                            {
                                string line = reader.ReadLine();

                                if (string.IsNullOrEmpty(line))
                                    break;

                                if (Regex.IsMatch(line, @"([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(:[0-9]+)"))
                                    _proxies.Add(line);
                            }
                        }

                        randomize = true;
                    }
                    else
                    {
                        var request = WebRequest.CreateHttp("http://proxy-list.org/ru/index.php");

                        request.Timeout = 5000;
                        request.Accept = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8";
                        request.UserAgent = "ozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36";
                        request.Headers["Accept-Language"] = "en-US,en;q=0.8,cs;q=0.6,da;q=0.4,de;q=0.2,fr;q=0.2,pl;q=0.2,ru;q=0.2";

                        string html = string.Empty;

                        try
                        {
                            using (var response = request.GetResponse())
                            {
                                html = System.Text.Encoding.UTF8.GetString(
                                    Input.ReadFromStream(response.GetResponseStream())
                                );
                            }
                        }
                        catch (Exception) { }

                        if (!string.IsNullOrEmpty(html))
                        {
                            var proxyMap = new Dictionary<string, ProxyInfo>();

                            foreach (var match in Regex.Matches(html, @"([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(:[0-9]+)", RegexOptions.IgnoreCase | RegexOptions.Multiline).OfType<Match>())
                            {
                                string address = string.Concat(match.Groups[1].Value, match.Groups[2].Value);

                                if (!proxyMap.ContainsKey(address))
                                    proxyMap.Add(address, new ProxyInfo() { Address = address });

                                var upTimeMatch = Regex.Match(html.Substring(match.Index + match.Length), @"([0-9]{1,3})%", RegexOptions.IgnoreCase | RegexOptions.Multiline);

                                if (upTimeMatch.Success)
                                {
                                    proxyMap[address].UpTime = double.Parse(upTimeMatch.Groups[1].Value);

                                    var lastCheckMinutesMatch = Regex.Match(html.Substring(match.Index + match.Length +
                                        upTimeMatch.Index + upTimeMatch.Length), @"[0-9]{1,}", RegexOptions.IgnoreCase | RegexOptions.Multiline);

                                    if (lastCheckMinutesMatch.Success)
                                        proxyMap[address].LastCheckedMinutes = int.Parse(lastCheckMinutesMatch.Value);
                                }
                            }

                            _proxies = proxyMap.Values.OrderByDescending(v => v.UpTime)
                                .ThenBy(v => v.LastCheckedMinutes).Select(v => v.Address).ToList();
                        }
                    }
                }
            }

            return randomize ? (IEnumerable<string>)new RandomProxyEnumerable(_proxies.ToArray()) : new List<string>(_proxies.ToArray());
        }
    }
}
