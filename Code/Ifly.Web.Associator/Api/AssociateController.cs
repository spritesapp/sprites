using Ifly.Utils.Associator;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Http;

namespace Ifly.Web.Associator.Api
{
    /// <summary>
    /// Allows associating values.
    /// </summary>
    public class AssociateController : ApiController
    {
        /// <summary>
        /// Returns characteristics associated with the given value.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <param name="unit">Unit.</param>
        /// <param name="accessToken">Access token.</param>
        /// <returns>Characteristics associated with the given value.</returns>
        [HttpPost]
        public IEnumerable<AssociationResult> ReceiveAssociations(double value, ValueUnit unit)
        {
            WolframAlphaClient client = null;
            IEnumerable<AssociationResult> ret = null;

            if (!IsValidRequest())
                throw new HttpResponseException(HttpStatusCode.BadRequest);

            client = new WolframAlphaClient() { Silent = true };

            client.Load(value, unit);

            ret = client.GetComparisonData();

            return ret;
        }

        /// <summary>
        /// Returns value indicating whether the current request is valid.
        /// </summary>
        /// <returns>Value indicating whether the current request is valid.</returns>
        private bool IsValidRequest()
        {
            Func<string, string> header = key =>
                {
                    string result = string.Empty;
                    IEnumerable<string> values = null;

                    if (Request.Headers.TryGetValues(key, out values) && values.Any())
                        result = values.First();

                    return result;
                };

            return string.Compare(header("X-Requested-With"), "XmlHTTPRequest", true) == 0 &&
                header("Referer").IndexOf("spritesapp.com", StringComparison.OrdinalIgnoreCase) > 0;
        }
    }
}
