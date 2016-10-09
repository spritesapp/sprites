using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Ifly.VideoPublishService
{
    /// <summary>
    /// Represents video publish progress arguments.
    /// </summary>
    internal class VideoPublishProgressArgs : System.EventArgs
    {
        /// <summary>
        /// Gets or sets the time elapsed since the publish started.
        /// </summary>
        public TimeSpan Elapsed { get; private set; }

        /// <summary>
        /// Gets or sets the percentage completed.
        /// </summary>
        public double PercentageCompleted { get; private set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="elapsed">The time elapsed since the publish started.</param>
        /// <param name="percentageCompleted">The percentage completed.</param>
        public VideoPublishProgressArgs(TimeSpan elapsed, double percentageCompleted)
        {
            this.Elapsed = elapsed;
            this.PercentageCompleted = percentageCompleted;
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="startTime">The start time.</param>
        /// <param name="percentageCompleted">The percentage completed.</param>
        public VideoPublishProgressArgs(DateTime startTime, double percentageCompleted) : 
            this(DateTime.UtcNow.Subtract(startTime), percentageCompleted) { }
        
    }

    /// <summary>
    /// Represents video publish.
    /// </summary>
    internal abstract class VideoPublish
    {
        /// <summary>
        /// Occurs when the publish progress is updated.
        /// </summary>
        public event EventHandler<VideoPublishProgressArgs> Progress;

        /// <summary>
        /// Gets or sets the log.
        /// </summary>
        public log4net.ILog Log { get; set; }

        /// <summary>
        /// Begins publishing a video.
        /// </summary>
        /// <param name="filePath">Physical path of the video file.</param>
        /// <param name="parameters">RPC parameters.</param>
        /// <returns></returns>
        public abstract Task<VideoPublishResult> PublishAsync(string filePath, IDictionary<string, string> parameters);

        /// <summary>
        /// Raises "Progress" event.
        /// </summary>
        /// <param name="e">Event arguments.</param>
        protected virtual void OnProgress(VideoPublishProgressArgs e)
        {
            if (Progress != null)
                Progress(this, e);
        }
    }
}
