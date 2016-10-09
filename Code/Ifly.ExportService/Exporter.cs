using Ifly.QueueService;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ifly.ExportService
{
    /// <summary>
    /// Represents an exporter.
    /// </summary>
    internal class Exporter
    {
        private static bool _isExporting;
        private static int _activeProcesses;
        private static readonly int _maxProcesses = 30;
        private static readonly int _processWaitTimeout = 30000;

        private static readonly log4net.ILog _log = log4net.LogManager.GetLogger
            (System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Exports queued presentations.
        /// </summary>
        public static void ExportQueuedPresentations()
        {
            Exception lastError = null;
            IMessageQueue queue = null;
            IEnumerable<Message> messages = null;
            List<Message> dispatchedMessages = null;
            
            if (!_isExporting)
            {
                _isExporting = true;

                queue = MessageQueueManager.Current.GetQueue(MessageQueueType.Export);
                messages = queue.GetMessages().ToList();
                dispatchedMessages = new List<Message>();

                if (messages != null && messages.Any())
                {
                    _log.Info(string.Format("Processing {0} export request(s)...", messages.Count()));

                    try
                    {
                        foreach (var m in messages)
                        {
                            try
                            {
                                ExportPresentation(m);
                            }
                            catch (Exception ex)
                            {
                                lastError = new Exception(ex.Message, lastError != null ? lastError : ex);
                            }
                            finally
                            {
                                dispatchedMessages.Add(m);
                            }
                        }

                        queue.RemoveMessages(dispatchedMessages);

                        if (lastError != null)
                            throw lastError;
                    }
                    catch (Exception ex)
                    {
                        _log.Error(string.Format("Failed to process {0} export request(s).", messages.Count()), ex);
                    }
                }

                _isExporting = false;
            }
        }

        /// <summary>
        /// Exports presentation specified within the given queue request.
        /// </summary>
        /// <param name="request">Request.</param>
        private static void ExportPresentation(Message request)
        {
            Process p = null;
            string audioFile = string.Empty;
            string outputFile = string.Empty;
            int presentationId = 0, slide = 0, totalSlides = 0, width = 0;
            GenericMessageBody body = GenericMessageBody.FromString(request.Body);

            if (body != null)
            {
                _log.Info(string.Format("Got body: {0}", request.Body));

                if ((int.TryParse(body.GetParameter<string>("PresentationId"), out presentationId) && presentationId > 0) &&
                    (int.TryParse(body.GetParameter<string>("Width"), out width) && width > 0))
                {
                    int.TryParse(body.GetParameter<string>("Slide"), out slide);
                    int.TryParse(body.GetParameter<string>("TotalSlides"), out totalSlides);

                    outputFile = body.GetParameter<string>("OutputFile");
                    audioFile = body.GetParameter<string>("AudioFile");

                    if (!string.IsNullOrEmpty(outputFile))
                    {
                        if (System.IO.File.Exists(outputFile))
                            System.IO.File.Delete(outputFile);

                        p = new Process();

                        p.StartInfo.CreateNoWindow = true;
                        p.StartInfo.UseShellExecute = false;
                        p.StartInfo.RedirectStandardOutput = false;
                        p.StartInfo.FileName = System.Configuration.ConfigurationManager.AppSettings["SnapshotterExecutablePath"];
                        p.StartInfo.Arguments = string.Format("--presentationId={0} --slide={1} --totalSlides={2} --width={3} --outputFile=\"{4}\"{5}", presentationId, slide, totalSlides, width, outputFile,
                            !string.IsNullOrEmpty(audioFile) ? string.Format(" --audioFile=\"{0}\"", audioFile) : string.Empty);

                        _activeProcesses++;

                        _log.Info(string.Format("Attempting to execute snapshotter: {0} {1}", p.StartInfo.FileName, p.StartInfo.Arguments));

                        try
                        {
                            p.Start();

                            if (_activeProcesses > _maxProcesses)
                                p.WaitForExit(_processWaitTimeout);

                            _log.Info("Snapshotter executing finished.");
                        }
                        catch (Exception ex)
                        {
                            _log.Error("Error executing snapshotter.", ex);

                            _activeProcesses--;
                            throw ex;
                        }
                    }
                }
            }
        }
    }
}
