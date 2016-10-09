using Facebook;
using System.Collections.Generic;
using System.Dynamic;
using System.IO;
using System.Threading.Tasks;

namespace Ifly.VideoPublishService
{
    /// <summary>
    /// Represents YouTube video publish.
    /// </summary>
    internal class FacebookVideoPublish : VideoPublish
    {
        /// <summary>
        /// Begins publishing a video.
        /// </summary>
        /// <param name="filePath">Physical path of the video file.</param>
        /// <param name="parameters">RPC parameters.</param>
        /// <returns></returns>
        public override async Task<VideoPublishResult> PublishAsync(string filePath, IDictionary<string, string> parameters)
        {
            dynamic response = null;
            VideoPublishResult ret = null;
            dynamic publishParameters = new ExpandoObject();
            var client = new FacebookClient(parameters["AccessToken"]);
            
            Log.Info(string.Format("Sending {0} to Facebook...", filePath));

            publishParameters.title = parameters["Title"];
            publishParameters.access_token = parameters["AccessToken"];
            publishParameters.source = new FacebookMediaStream { ContentType = "video/mp4", FileName = "video.mp4" }.SetValue(File.OpenRead(filePath));

            response = await client.PostTaskAsync("/me/videos", publishParameters);

            if (response != null)
            {
                ret = new VideoPublishResult() 
                { 
                    Url = string.Format("https://www.facebook.com/video.php?v={0}", response.id)
                };
            }

            return ret;
        }
    }
}
