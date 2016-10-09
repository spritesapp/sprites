using System;
using System.Configuration;

namespace Ifly.QueueService.Queues
{
    /// <summary>
    /// Represents a video publish queue. This class cannot be inherited.
    /// </summary>
    internal sealed class VideoPublishQueue : MessageQueue
    {
        private static readonly Lazy<VideoPublishQueue> _current = new Lazy<VideoPublishQueue>(() =>
            { return new VideoPublishQueue(); });

        /// <summary>
        /// Gets the current queue.
        /// </summary>
        public static VideoPublishQueue Current
        {
            get { return _current.Value; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        private VideoPublishQueue() : base(ConfigurationManager.AppSettings["VideoPublishService:QueueFile"]) { }
    }
}
