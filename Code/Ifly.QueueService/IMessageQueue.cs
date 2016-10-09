using System.Collections.Generic;

namespace Ifly.QueueService
{
    /// <summary>
    /// Represents a message queue.
    /// </summary>
    public interface IMessageQueue
    {
        /// <summary>
        /// Returns all messages currently residing in the queue.
        /// </summary>
        /// <returns>Messages.</returns>
        IEnumerable<Message> GetMessages();

        /// <summary>
        /// Adds (or updates) the given messages within the queue.
        /// </summary>
        /// <param name="messages">Messages to add/update.</param>
        void AddMessages(IEnumerable<Message> messages);

        /// <summary>
        /// Removes the given messages from the queue.
        /// </summary>
        /// <param name="messages">Messages to remove..</param>
        void RemoveMessages(IEnumerable<Message> messages);

        /// <summary>
        /// Removes all messages from the queue.
        /// </summary>
        void Clear();
    }
}