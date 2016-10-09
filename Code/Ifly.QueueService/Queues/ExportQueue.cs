using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;

using Amazon;
using Amazon.SQS;
using Amazon.SQS.Model;
using System.Globalization;

namespace Ifly.QueueService.Queues
{
    /// <summary>
    /// Represents an export queue. This class cannot be inherited.
    /// </summary>
    internal sealed class ExportQueue : IMessageQueue
    {
        private static readonly Lazy<ExportQueue> _current = new Lazy<ExportQueue>(() =>
            { return new ExportQueue(); });

        private readonly IMessageQueue _proxy;

        /// <summary>
        /// Gets the current queue.
        /// </summary>
        public static ExportQueue Current
        {
            get { return _current.Value; }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        private ExportQueue()
        {
            _proxy = !string.IsNullOrEmpty(ConfigurationManager.AppSettings["ExportProviderUrl"]) ?
                new SQSExportQueue() : new LocalExportQueue() as IMessageQueue;
        }

        /// <summary>
        /// Returns all messages currently residing in the queue.
        /// </summary>
        /// <returns>Messages.</returns>
        public IEnumerable<Message> GetMessages()
        {
            return _proxy.GetMessages();
        }

        /// <summary>
        /// Adds (or updates) the given messages within the queue.
        /// </summary>
        /// <param name="messages">Messages to add/update.</param>
        public void AddMessages(IEnumerable<Message> messages)
        {
            _proxy.AddMessages(messages);
        }

        /// <summary>
        /// Removes the given messages from the queue.
        /// </summary>
        /// <param name="messages">Messages to remove..</param>
        public void RemoveMessages(IEnumerable<Message> messages)
        {
            _proxy.RemoveMessages(messages);
        }

        /// <summary>
        /// Removes all messages from the queue.
        /// </summary>
        public void Clear()
        {
            _proxy.Clear();
        }
    }

    /// <summary>
    /// Represents a local export queue. This class cannot be inherited.
    /// </summary>
    internal sealed class LocalExportQueue : MessageQueue
    {
        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public LocalExportQueue() : base(ConfigurationManager.AppSettings["ExportService:QueueFile"]) { }
    }

    /// <summary>
    /// Represents an SQS export queue. This class cannot be inherited.
    /// </summary>
    internal sealed class SQSExportQueue : IMessageQueue
    {
        private static readonly CultureInfo _culture = new CultureInfo("en-US");

        /// <summary>
        /// Returns all messages currently residing in the queue.
        /// </summary>
        /// <returns>Messages.</returns>
        public IEnumerable<Message> GetMessages()
        {
            string subject = string.Empty;
            DateTime created = DateTime.MinValue;
            List<Message> ret = new List<Message>();

            using (var client = CreateClient())
            {
                foreach (var message in client.ReceiveMessage(new ReceiveMessageRequest() { QueueUrl = GetQueueUrl(client) }).Messages)
                {
                    subject = string.Empty;
                    created = DateTime.MinValue;

                    if (message.Attributes != null)
                    {
                        if (message.Attributes.ContainsKey("Subject"))
                            subject = message.Attributes["Subject"] ?? string.Empty;

                        if (message.Attributes.ContainsKey("Created"))
                            DateTime.TryParseExact(message.Attributes["Created"], "s", _culture, DateTimeStyles.None, out created);

                        ret.Add(new Message()
                        {
                            Subject = subject,
                            Body = message.Body,
                            Created = DateTime.SpecifyKind(created, DateTimeKind.Utc),
                            Id = EncodeMessageId(message.MessageId, message.ReceiptHandle)
                        });
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Adds (or updates) the given messages within the queue.
        /// </summary>
        /// <param name="messages">Messages to add/update.</param>
        public void AddMessages(IEnumerable<Message> messages)
        {
            Func<Message, Dictionary<string, MessageAttributeValue>> createAttributes = msg =>
            {
                var result = new Dictionary<string, MessageAttributeValue>();

                if (!string.IsNullOrEmpty(msg.Subject))
                    result.Add("Subject", new MessageAttributeValue() { DataType = "String", StringValue = msg.Subject });

                result.Add("Created", new MessageAttributeValue() { DataType = "String", StringValue = msg.Created.ToString("s", _culture) });

                return result;
            };

            if (messages != null && messages.Any())
            {
                using (var client = CreateClient())
                {
                    client.SendMessageBatch(new SendMessageBatchRequest()
                    {
                        Entries = new List<SendMessageBatchRequestEntry>(messages.Select(m =>
                            new SendMessageBatchRequestEntry()
                            {
                                Id = Guid.NewGuid().ToString(),
                                MessageAttributes = new Dictionary<string, MessageAttributeValue>(createAttributes(m)),
                                MessageBody = m.Body
                            }
                        )),
                        QueueUrl = GetQueueUrl(client)
                    });
                }
            }
        }

        /// <summary>
        /// Removes the given messages from the queue.
        /// </summary>
        /// <param name="messages">Messages to remove..</param>
        public void RemoveMessages(IEnumerable<Message> messages)
        {
            if (messages != null && messages.Any())
            {
                using (var client = CreateClient())
                {
                    client.DeleteMessageBatch(new DeleteMessageBatchRequest()
                    {
                        Entries = new List<DeleteMessageBatchRequestEntry>(messages.Select(m =>
                            new DeleteMessageBatchRequestEntry()
                            {
                                Id = Guid.NewGuid().ToString(),
                                ReceiptHandle = DecodeMessageId(m.Id).Item2
                            }
                        )),
                        QueueUrl = GetQueueUrl(client)
                    });
                }
            }
        }

        /// <summary>
        /// Removes all messages from the queue.
        /// </summary>
        public void Clear()
        {
            RemoveMessages(GetMessages());
        }

        /// <summary>
        /// Creates SQS client.
        /// </summary>
        /// <returns>SQS client.</returns>
        private IAmazonSQS CreateClient()
        {
            return AWSClientFactory.CreateAmazonSQSClient(
                "AKIAJYOMMF624CPAWJVQ",
                "3gwWov3ViX/UTQAGFjUXglxdpcz9oNIFi+GFKLHf",
                RegionEndpoint.USWest2
            );
        }

        /// <summary>
        /// Returns queue URL.
        /// </summary>
        /// <param name="client">Client.</param>
        /// <returns>Queue URL.</returns>
        private string GetQueueUrl(IAmazonSQS client)
        {
            return client.GetQueueUrl(new GetQueueUrlRequest() { QueueName = "sprites-export" }).QueueUrl;
        }

        /// <summary>
        /// Encodes message Id.
        /// </summary>
        /// <param name="id">Id.</param>
        /// <param name="receiptHandle">Receipt handle.</param>
        /// <returns>Encoded Id.</returns>
        private string EncodeMessageId(string id, string receiptHandle)
        {
            return string.Format("{0}#{1}", id, receiptHandle);
        }

        /// <summary>
        /// Decodes message Id.
        /// </summary>
        /// <param name="id">Id.</param>
        /// <returns>Decoded Id.</returns>
        private Tuple<string, string> DecodeMessageId(string id)
        {
            string[] components = (id ?? string.Empty).Split(new char[] { '#' }, StringSplitOptions.RemoveEmptyEntries);
            return new Tuple<string, string>(components.Length > 0 ? components[0] : (id ?? string.Empty), components.Length > 1 ? components[1] : string.Empty);
        }
    }
}
