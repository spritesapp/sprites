using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Ifly.QueueService
{
    /// <summary>
    /// Represents generic message body.
    /// </summary>
    public class GenericMessageBody
    {
        /// <summary>
        /// Gets or sets the message parameters.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public GenericMessageBody()
        {
            this.Parameters = new Dictionary<string, string>();
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="parameters">Parameters.</param>
        public GenericMessageBody(params Tuple<string, string>[] parameters) : this()
        {
            if (parameters != null && parameters.Any())
            {
                foreach (var p in parameters)
                    this.AddOrUpdateParameter<string>(p.Item1, p.Item2);
            }
        }

        /// <summary>
        /// Returns the value of a given parameter.
        /// </summary>
        /// <typeparam name="TValue">Value type.</typeparam>
        /// <param name="name">Parameter name.</param>
        /// <returns>Parameter value.</returns>
        public TValue GetParameter<TValue>(string name)
        {
            Type t = typeof(TValue);
            string val = string.Empty;
            TValue ret = default(TValue);

            if (!string.IsNullOrEmpty(name) && Parameters.ContainsKey(name))
            {
                val = Parameters[name];

                if (t.Equals(typeof(string)))
                    ret = (TValue)(object)val;
                else
                    ret = (TValue)Convert.ChangeType(val, t);
            }

            return ret;
        }

        /// <summary>
        /// Adds or updates the value of a given parameter.
        /// </summary>
        /// <typeparam name="TValue">Value type.</typeparam>
        /// <param name="name">Parameter name.</param>
        /// <param name="value">Parameter value.</param>
        public void AddOrUpdateParameter<TValue>(string name, TValue value)
        {
            if (!string.IsNullOrEmpty(name) && value != null)
            {
                if (Parameters.ContainsKey(name))
                    Parameters[name] = value.ToString();
                else
                    Parameters.Add(name, value.ToString());
            }
        }

        /// <summary>
        /// Returns a string representation of the current object.
        /// </summary>
        /// <returns>A string representation of the current object.</returns>
        public override string ToString()
        {
            return JsonConvert.SerializeObject(this);
        }

        /// <summary>
        /// Returns a strongly-typed representation of the given message body.
        /// </summary>
        /// <param name="body">Message body.</param>
        /// <returns>A strongly-typed representation of the given message body.</returns>
        public static GenericMessageBody FromString(string body)
        {
            GenericMessageBody ret = null;

            if (!string.IsNullOrEmpty(body))
            {
                try
                {
                    ret = JsonConvert.DeserializeObject<GenericMessageBody>(body);
                }
                catch (Exception) { }
            }

            return ret;
        }
    }
}
