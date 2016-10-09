using System;

namespace Ifly.External.MailChimp
{
    /// <summary>
    /// Represents MailChimp exception.
    /// </summary>
    public class MailChimpException : Exception
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public MailChimpException() : base() { }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="message">Message.</param>
        public MailChimpException(string message) : base(message) { }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="message">Message.</param>
        /// <param name="innerException">Inner exception.</param>
        public MailChimpException(string message, Exception innerException) : base(message, innerException) { }
    }
}
