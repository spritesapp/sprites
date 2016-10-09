using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;

namespace Ifly.Utils
{
    /// <summary>
    /// Provides a set of utility methods for dealing with user's input.
    /// </summary>
    public static class Input
    {
        /// <summary>
        /// Reads data from a stream until the end is reached. The
        /// data is returned as a byte array. An IOException is
        /// thrown if any of the underlying IO calls fail.
        /// </summary>
        /// <param name="stream">The stream to read data from</param>
        public static byte[] ReadFromStream(System.IO.Stream stream)
        {
            int read = 0;
            byte[] buffer = new byte[32768], ret = null;
            
            using (System.IO.MemoryStream ms = new System.IO.MemoryStream())
            {
                while (true)
                {
                    read = stream.Read(buffer, 0, buffer.Length);
                    if (read <= 0)
                    {
                        ret = ms.ToArray();
                        break;
                    }

                    ms.Write(buffer, 0, read);
                }
            }

            return ret;
        }

        /// <summary>
        /// Formats the given string by using the given source and format provider.
        /// </summary>
        /// <param name="format">Format.</param>
        /// <param name="provider">Format provider.</param>
        /// <param name="source">Source.</param>
        /// <returns>Formatted text.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="format">format</paramref> is null.</exception>
        /// <remarks>Credits: http://james.newtonking.com/archive/2008/03/29/formatwith-2-0-string-formatting-with-named-variables. </remarks>
        public static string FormatWith(string format, object source)
        {
            Regex r = null;
            string rewrittenFormat = string.Empty;
            List<object> values = new List<object>();

            if (format == null)
                throw new ArgumentNullException("format");

            r = new Regex(@"(?<start>\{)+(?<property>[\w\.\[\]]+)(?<format>:[^}]+)?(?<end>\})+",
                RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);

            rewrittenFormat = r.Replace(format, m =>
            {
                Group startGroup = m.Groups["start"],
                    propertyGroup = m.Groups["property"],
                    formatGroup = m.Groups["format"],
                    endGroup = m.Groups["end"];

                values.Add((propertyGroup.Value == "0")
                  ? source
                  : DataBinder.Eval(source, propertyGroup.Value));

                return new string('{', startGroup.Captures.Count) + (values.Count - 1) + formatGroup.Value
                  + new string('}', endGroup.Captures.Count);
            });

            return string.Format(rewrittenFormat, values.ToArray());
        }

        /// <summary>
        /// Returns value indicating whether filter chain can be applied to the given response.
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="response">Response.</param>
        /// <returns>Value indicating whether filter chain can be applied to the given response.</returns>
        public static bool CanApplyFilterChain(HttpRequest request, HttpResponse response)
        {
            bool ret = false;

            string contentType = response.ContentType ?? string.Empty;

            ret = contentType.IndexOf("application/octet-stream", StringComparison.OrdinalIgnoreCase) < 0 &&
                contentType.IndexOf("application/pdf", StringComparison.OrdinalIgnoreCase) < 0;

            if (ret)
            {
                ret = request.RawUrl.IndexOf("AudioRecorderWorker.js", StringComparison.OrdinalIgnoreCase) < 0 &&
                    request.RawUrl.IndexOf("lame.all.min.js", StringComparison.OrdinalIgnoreCase) < 0;
            }

            return ret;
        }
    }
}
