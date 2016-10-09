namespace Ifly.QueueService
{
    /// <summary>
    /// Represents a message queue manager.
    /// </summary>
    public class MessageQueueManager : IMessageQueueManager
    {
        private static IMessageQueueManager _current = new MessageQueueManager();
        
        /// <summary>
        /// Gets or sets the current queue manager.
        /// </summary>
        public static IMessageQueueManager Current
        {
            get { return _current; }
            set { System.Threading.Interlocked.Exchange(ref _current, value); }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        protected MessageQueueManager() { }

        /// <summary>
        /// Returns the given queue.
        /// </summary>
        /// <param name="type">Queue type.</param>
        /// <returns>Queue instance.</returns>
        public virtual IMessageQueue GetQueue(MessageQueueType type)
        {
            IMessageQueue ret = null;

            switch (type)
            {
                case MessageQueueType.Email:
                    ret = Queues.EmailQueue.Current;
                    break;
                case MessageQueueType.Impressions:
                    ret = Queues.ImpressionsQueue.Current;
                    break;
                case MessageQueueType.Export:
                    ret = Queues.ExportQueue.Current;
                    break;
                case MessageQueueType.VideoPublish:
                    ret = Queues.VideoPublishQueue.Current;
                    break;
            }

            return ret;
        }
    }
}
