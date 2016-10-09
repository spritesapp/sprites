namespace Ifly.QueueService
{
    /// <summary>
    /// Represents a message queue manager.
    /// </summary>
    public interface IMessageQueueManager
    {
        /// <summary>
        /// Returns the given queue.
        /// </summary>
        /// <param name="type">Queue type.</param>
        /// <returns>Queue instance.</returns>
        IMessageQueue GetQueue(MessageQueueType type);
    }
}
