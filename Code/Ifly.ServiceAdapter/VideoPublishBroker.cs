using Ifly.QueueService;
using System;

namespace Ifly.ServiceAdapter
{
    /// <summary>
    /// Represents video publish broker.
    /// </summary>
    public static class VideoPublishBroker
    {
        /// <summary>
        /// Creates new video publish task.
        /// </summary>
        /// <param name="physicalPath">Physical path of a video file.</param>
        /// <param name="publisherParameters">Publisher parameters.</param>
        /// <returns>Value indicating whether task was created.</returns>
        public static bool CreateVideoPublishTask(string physicalPath, string publisherParameters)
        {
            bool ret = false;
            int destinationIndex = publisherParameters != null ? publisherParameters.IndexOf(':') : -1;
            string newFile = physicalPath + "_pub.mp4", destination = destinationIndex > 0 ? 
                publisherParameters.Substring(0, destinationIndex) : string.Empty;

            if (!string.IsNullOrEmpty(destination))
            {
                ret = true;

                // Renaming original file so we don't accidently report on it as being "done".
                System.IO.File.Move(physicalPath, newFile);

                // The video publish service will pick the task from the queue.
                MessageQueueManager.Current.GetQueue(MessageQueueType.VideoPublish).AddMessages(new Message[] { new Message()
                {
                    Id = System.Guid.NewGuid().ToString(),
                    Body = new GenericMessageBody
                    (
                        new Tuple<string, string>("Destination", destination),
                        new Tuple<string, string>("PhysicalPath", newFile),
                        new Tuple<string, string>("PublisherParameters", publisherParameters.Substring(destinationIndex + 1))
                    ).ToString()
                }});
            }

            return ret;
        }

        /// <summary>
        /// Returns the status of the video publish task represented by the given file.
        /// </summary>
        /// <param name="physicalPath">Physical path to the video file.</param>
        /// <returns>Raw status data or an empty string if no status is available.</returns>
        public static string GetVideoPublishStatus(string physicalPath)
        {
            string ret = string.Empty, statusFile = physicalPath + ".txt";

            if (System.IO.File.Exists(statusFile))
            {
                ret = System.IO.File.ReadAllText(statusFile);

                // Deleting the status file.
                try
                {
                    System.IO.File.Delete(statusFile);
                }
                catch (System.IO.IOException) { }

                // Deleting the file - we don't need it anymore (not served to the user).
                if (System.IO.File.Exists(physicalPath))
                {
                    try
                    {
                        System.IO.File.Delete(physicalPath);
                    }
                    catch (System.IO.IOException) { }
                }
            }

            return ret;
        }
    }
}
