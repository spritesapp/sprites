using System;
namespace Ifly.QueueService
{
    /// <summary>
    /// Represents a message.
    /// </summary>
    public class Message
    {
        /// <summary>
        /// Gets or sets the message Id.
        /// </summary>
        public string Id { get; set; }

        /// <summary>
        /// Gets or sets the message subject.
        /// </summary>
        public string Subject { get; set; }

        /// <summary>
        /// Gets or sets the message body.
        /// </summary>
        public string Body { get; set; }

        /// <summary>
        /// Gets or sets the date and time when this message was created.
        /// </summary>
        public DateTime Created { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public Message()
        {
            Created = DateTime.UtcNow;
        }
    }
}
