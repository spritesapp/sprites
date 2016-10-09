using System;
using System.Configuration;

namespace Ifly.QueueService.Queues
{
    /// <summary>
    /// Represents an email queue. This class cannot be inherited.
    /// </summary>
    internal sealed class EmailQueue : MessageQueue
    {
        private static readonly Lazy<EmailQueue> _current = new Lazy<EmailQueue>(() =>
            { return new EmailQueue(); });

        /// <summary>
        /// Gets the current queue.
        /// </summary>
        public static EmailQueue Current
        {
            get { return _current.Value; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        private EmailQueue() : base(ConfigurationManager.AppSettings["EmailService:QueueFile"]) { }
    }
}
