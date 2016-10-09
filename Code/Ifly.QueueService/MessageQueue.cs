using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml;

namespace Ifly.QueueService
{
    /// <summary>
    /// Represents a message queue type.
    /// </summary>
    public enum MessageQueueType
    {
        /// <summary>
        /// Email queue.
        /// </summary>
        Email = 1,

        /// <summary>
        /// Infographic impressions.
        /// </summary>
        Impressions = 2,

        /// <summary>
        /// Infographic export (image/video).
        /// </summary>
        Export = 3,

        /// <summary>
        /// Video publish.
        /// </summary>
        VideoPublish = 4
    }

    /// <summary>
    /// Represents a file-based message queue.
    /// </summary>
    public abstract class MessageQueue : IMessageQueue
    {
        private readonly string _physicalPath;

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="physicalPath">Message queue file physical path.</param>
        protected MessageQueue(string physicalPath)
        {
            _physicalPath = physicalPath;
        }

        /// <summary>
        /// Returns all messages currently residing in the queue.
        /// </summary>
        /// <returns>Messages.</returns>
        public virtual IEnumerable<Message> GetMessages()
        {
            Message message = null;
            List<Message> ret = new List<Message>();

            if (File.Exists(this._physicalPath))
            {
                using (var stream = MitigateIOError(() => new FileStream(this._physicalPath, FileMode.Open, FileAccess.Read, FileShare.Read)))
                {
                    using (var reader = XmlReader.Create(stream))
                    {
                        while (reader.Read())
                        {
                            switch (reader.NodeType)
                            {
                                case XmlNodeType.Element:
                                    message = null;

                                    if (string.Compare(reader.LocalName, "message", true) == 0)
                                    {
                                        message = new Message()
                                        {
                                            Id = reader.GetAttribute("id"),
                                            Subject = reader.GetAttribute("subject"),
                                            Created = new System.DateTime(long.Parse(reader.GetAttribute("created")), System.DateTimeKind.Utc)
                                        };
                                    }

                                    break;
                                case XmlNodeType.CDATA:
                                    if (message != null)
                                    {
                                        reader.MoveToContent();

                                        message.Body = reader.Value;
                                        ret.Add(message);
                                    }

                                    break;
                            }
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Adds (or updates) the given messages within the queue.
        /// </summary>
        /// <param name="messages">Messages to add/update.</param>
        public virtual void AddMessages(IEnumerable<Message> messages)
        {
            IDictionary<string, Message> allMessages = null;
            IEnumerable<Message> filteredMessages = messages != null ?
                messages.Where(m => !string.IsNullOrEmpty(m.Id)) : null;

            if (filteredMessages != null && filteredMessages.Any())
            {
                allMessages = GetMessages().ToDictionary(m => m.Id);

                foreach (Message m in filteredMessages)
                {
                    if (allMessages.ContainsKey(m.Id))
                        allMessages[m.Id] = m;
                    else
                        allMessages.Add(m.Id, m);
                }

                this.WriteMessages(allMessages.Values);
            }
        }

        /// <summary>
        /// Removes the given messages from the queue.
        /// </summary>
        /// <param name="messages">Messages to remove..</param>
        public virtual void RemoveMessages(IEnumerable<Message> messages)
        {
            IDictionary<string, Message> allMessages = null;
            IEnumerable<Message> filteredMessages = messages != null ?
                messages.Where(m => !string.IsNullOrEmpty(m.Id)) : null;

            if (filteredMessages != null && filteredMessages.Any())
            {
                allMessages = GetMessages().ToDictionary(m => m.Id);

                foreach (Message m in filteredMessages)
                {
                    if (allMessages.ContainsKey(m.Id))
                        allMessages.Remove(m.Id);
                }

                this.WriteMessages(allMessages.Values);
            }
        }

        /// <summary>
        /// Removes all messages from the queue.
        /// </summary>
        public virtual void Clear()
        {
            MitigateIOError(() =>
            {
                if (File.Exists(this._physicalPath))
                    File.Delete(this._physicalPath);
            });
        }

        /// <summary>
        /// Writes messages to disk.
        /// </summary>
        /// <param name="messages">Messages.</param>
        protected void WriteMessages(IEnumerable<Message> messages)
        {
            XmlWriter writer = null;
            string directoryName = Path.GetDirectoryName(this._physicalPath);

            MitigateIOError(() =>
            {
                if (!Directory.Exists(directoryName))
                    Directory.CreateDirectory(directoryName);

                writer = CreateWriter(this._physicalPath);

                if (writer != null)
                {
                    using (writer)
                    {
                        writer.WriteStartDocument();
                        writer.WriteStartElement("messages");

                        foreach (var m in messages)
                        {
                            writer.WriteStartElement("message");
                            writer.WriteAttributeString("id", m.Id);
                            writer.WriteAttributeString("subject", m.Subject);
                            writer.WriteAttributeString("created", m.Created.Ticks.ToString());
                            writer.WriteCData(m.Body);
                            writer.WriteEndElement();
                        }

                        writer.WriteEndElement();
                        writer.WriteEndDocument();
                    }
                }
            });
        }

        /// <summary>
        /// Creates XML writer.
        /// </summary>
        /// <param name="physicalPath">Physical path.</param>
        /// <returns>XML writer.</returns>
        private XmlWriter CreateWriter(string physicalPath)
        {
            XmlWriter ret = null;
            System.Func<XmlWriter> create = () => XmlWriter.Create(physicalPath);

            try
            {
                ret = create();
            }
            catch (System.IO.IOException) 
            {
                System.Threading.Thread.Sleep(500);
                ret = create();
            }

            return ret;
        }

        /// <summary>
        /// Executes the given action while trying to mitigate I/O errors.
        /// </summary>
        /// <typeparam name="T">Return type.</typeparam>
        /// <param name="factory">Factory.</param>
        /// <param name="maxAttempts">Maximum number of attempts.</param>
        /// <param name="waitTimeBetweenAttempts">Wait time between attempts.</param>
        private T MitigateIOError<T>(System.Func<T> factory, int maxAttempts = 5, int waitTimeBetweenAttempts = 100)
        {
            T ret = default(T);

            for (int i = 0; i < maxAttempts; i++)
            {
                if (i > 0)
                    System.Threading.Thread.Sleep(waitTimeBetweenAttempts);

                try
                {
                    ret = factory();
                    break;
                }
                catch (System.IO.IOException)
                {
                    if (i == (maxAttempts - 1))
                        throw;
                }
            }

            return ret;
        }

        /// <summary>
        /// Executes the given action while trying to mitigate I/O errors.
        /// </summary>
        /// <param name="action">Action.</param>
        /// <param name="maxAttempts">Maximum number of attempts.</param>
        /// <param name="waitTimeBetweenAttempts">Wait time between attempts.</param>
        private void MitigateIOError(System.Action action, int maxAttempts = 5, int waitTimeBetweenAttempts = 100)
        {
            MitigateIOError<object>(() =>
            {
                action();
                return null;
            }, maxAttempts, waitTimeBetweenAttempts);
        }
    }
}