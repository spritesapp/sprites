using System;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Specialized;
using System.Collections.Generic;

using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Upload;
using Google.Apis.Util.Store;
using Google.Apis.YouTube.v3;
using Google.Apis.YouTube.v3.Data;
using Google.Apis.Auth.OAuth2.Flows;

namespace Ifly.VideoPublishService
{
    /// <summary>
    /// Represents YouTube video publish.
    /// </summary>
    internal class YouTubeVideoPublish : VideoPublish
    {
        /// <summary>
        /// Begins publishing a video.
        /// </summary>
        /// <param name="filePath">Physical path of the video file.</param>
        /// <param name="parameters">RPC parameters.</param>
        /// <returns></returns>
        public override async Task<VideoPublishResult> PublishAsync(string filePath, IDictionary<string, string> parameters)
        {
            VideoPublishResult ret = null;

            Log.Info(string.Format("Sending {0} to YouTube...", filePath));

            if (System.IO.File.Exists(filePath) && parameters != null)
            {
                var credential = new UserCredential(new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer()
                {
                    ClientSecrets = new ClientSecrets()
                    {
                        ClientId = "732432655752-sc8rnb18i0os9s6gg9ru3fnvbdghc6mf.apps.googleusercontent.com",
                        ClientSecret = "rK7K4jw-5InCOPmPzoE8iLIM"
                    },
                    Scopes = new string[] { "https://www.googleapis.com/auth/youtube.upload" }
                }), parameters["UserId"], new Google.Apis.Auth.OAuth2.Responses.TokenResponse()
                {
                    AccessToken = parameters["AccessToken"],
                    Issued = DateTime.UtcNow,
                    ExpiresInSeconds = 300,
                    Scope = "https://www.googleapis.com/auth/youtube.upload"
                });

                var youtubeService = new YouTubeService(new BaseClientService.Initializer()
                {
                    HttpClientInitializer = credential,
                    ApplicationName = Assembly.GetExecutingAssembly().GetName().Name
                });

                var video = new Video();
                video.Snippet = new VideoSnippet();
                video.Snippet.Title = parameters["Title"];

                video.Status = new VideoStatus();
                video.Status.PrivacyStatus = "unlisted";

                using (var fileStream = new FileStream(filePath, FileMode.Open))
                {
                    var videosInsertRequest = youtubeService.Videos.Insert(video, "snippet,status", fileStream, "video/*");

                    videosInsertRequest.ProgressChanged += p =>
                    {
                        switch (p.Status)
                        {
                            case UploadStatus.Failed:
                                Log.Error(string.Format("Error uploading {0} to YouTube.", filePath), p.Exception);
                                break;
                            case UploadStatus.Completed:
                                Log.Info(string.Format("Successfully uploaded {0} bytes to YouTube for {1}.", p.BytesSent, filePath));
                                break;
                        }
                    };

                    videosInsertRequest.ResponseReceived += v =>
                    {
                        if (!string.IsNullOrEmpty(v.Id))
                        {
                            Log.Info(string.Format("Upload to YouTube of {0} is finished.", filePath));

                            ret = new VideoPublishResult()
                            {
                                Url = "https://www.youtube.com/my_videos"
                            };
                        }
                    };

                    await videosInsertRequest.UploadAsync();
                }
            }

            return ret;
        }
    }
}
