using Ifly.QueueService;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Threading;
using System.Web;
using System.Threading.Tasks;

namespace Ifly.VideoPublishService
{
    /// <summary>
    /// Represents a dispatcher.
    /// </summary>
    internal class Publisher
    {
        private static readonly object _lock = new object();
        private static readonly int _maxPublishers = 10;
        private static int _currentPublishers = 0;

        private static readonly log4net.ILog _log = log4net.LogManager.GetLogger
            (System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Dispatches queued messages.
        /// </summary>
        public static void PublishQueuedVideos()
        {
            Message message = null;
            IMessageQueue queue = null;
            IEnumerable<Message> messages = null;

            // At max, there're [N] publishers that can run concurrently.
            if (_currentPublishers < _maxPublishers)
            {
                lock (_lock)
                {
                    queue = MessageQueueManager.Current.GetQueue(MessageQueueType.VideoPublish);
                    messages = queue.GetMessages().ToList();

                    if (messages.Any())
                    {
                        message = messages.First();

                        // Removing the message right away - no other publisher should see it while we're attempting to publish.
                        queue.RemoveMessages(new Message[] { message });
                    }
                }

                // Queueing video to be published.
                if (message != null)
                    ThreadPool.QueueUserWorkItem(new WaitCallback(PublishVideoAsync), message);
            }
        }

        /// <summary>
        /// Publishes a video.
        /// </summary>
        /// <param name="param">Parameter.</param>
        public static async void PublishVideoAsync(object param)
        {
            GenericMessageBody body = null;
            Message message = param as Message;
            
            try
            {
                // On more publisher to execute.
                Interlocked.Increment(ref _currentPublishers);
                
                body = GenericMessageBody.FromString(message.Body);

                if (body != null)
                {
                    // Running the publisher.
                    await RunPublisherAsync(
                        body.GetParameter<string>("Destination"),
                        body.GetParameter<string>("PhysicalPath"), 
                        HttpUtility.ParseQueryString(body.GetParameter<string>("PublisherParameters"))
                    );
                }
            }
            catch (System.Exception ex)
            {
                _log.Error("Failed to publish videos.", ex);
            }
            finally
            {
                // Done running - make room for others to run.
                Interlocked.Decrement(ref _currentPublishers);
            }
        }

        /// <summary>
        /// Runs publisher.
        /// </summary>
        /// <param name="destination">Destination (e.g. "YouTube").</param>
        /// <param name="physicalPath">Physical path of the video.</param>
        /// <param name="parameters">Publisher parameters.</param>
        /// <returns>A task.</returns>
        private static async Task<VideoPublish> RunPublisherAsync(string destination, string physicalPath, NameValueCollection parameters)
        {
            VideoPublish ret = null;
            VideoPublishResult result = null;
            IDictionary<string, string> rpcParameters = new Dictionary<string, string>();

            if (parameters != null)
            {
                foreach (string key in parameters.AllKeys)
                {
                    if (!rpcParameters.ContainsKey(key))
                        rpcParameters.Add(key, parameters[key]);
                }
            }

            if (string.Compare(destination, "youtube", true) == 0)
                ret = new YouTubeVideoPublish() { Log = _log };
            else if (string.Compare(destination, "facebook", true) == 0)
                ret = new FacebookVideoPublish() { Log = _log };

            if (ret == null)
                await Task.Delay(1);
            else
            {
                result = await ret.PublishAsync(physicalPath, rpcParameters);

                // Deleting the file - we don't need it anymore (not served to the user).
                if (System.IO.File.Exists(physicalPath))
                {
                    try
                    {
                        System.IO.File.Delete(physicalPath);
                    }
                    catch (System.IO.IOException) { }
                }

                // Letting the client know that we're done - placing a text file with the result.
                // In other words, we're saying "I'm not here, but here's an information on where to find me".
                System.IO.File.WriteAllText(physicalPath.Replace("_pub.mp4", string.Empty) + ".txt", result != null ? 
                    Newtonsoft.Json.JsonConvert.SerializeObject(result) : string.Empty);
            }

            return ret;
        }
    }
}
