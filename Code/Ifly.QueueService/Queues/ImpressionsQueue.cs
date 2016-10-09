using System;
using System.Configuration;

namespace Ifly.QueueService.Queues
{
    /// <summary>
    /// Represents an impressions queue. This class cannot be inherited.
    /// </summary>
    internal sealed class ImpressionsQueue : MessageQueue
    {
        private static readonly Lazy<ImpressionsQueue> _current = new Lazy<ImpressionsQueue>(() =>
            { return new ImpressionsQueue(); });

        /// <summary>
        /// Gets the current queue.
        /// </summary>
        public static ImpressionsQueue Current
        {
            get { return _current.Value; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        private ImpressionsQueue() : base(ConfigurationManager.AppSettings["ImpressionsService:QueueFile"]) { }
    }
}
