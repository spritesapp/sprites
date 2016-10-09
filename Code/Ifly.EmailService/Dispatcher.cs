using Ifly.QueueService;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace Ifly.EmailService
{
    /// <summary>
    /// Represents a dispatcher.
    /// </summary>
    internal class Dispatcher
    {
        private static bool _isDispatching;
        private static readonly log4net.ILog _log = log4net.LogManager.GetLogger
            (System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Dispatches queued messages.
        /// </summary>
        public static void DispatchQueuedMessages()
        {
            MailMessage mail = null;
            bool canDispatch = false;
            IMessageQueue queue = null;
            int connectionPortIndex = 0;
            GenericMessageBody body = null;
            string recipient = string.Empty;
            MailAddress replyToOverride = null;
            IEnumerable<Message> messages = null;
            string feedbackSender = string.Empty;
            List<Message> dispatchedMessages = null;
            int[] connectionPorts = new int[] { 587, 465 };
            int feedbackSenderStart = -1, feedbackSenderEnd = -1;
            HashSet<string> dispatchedMessageMap = new HashSet<string>();
            WebExceptionStatus errorStatus = WebExceptionStatus.UnknownError;
            
            Func<string, string> sanitizeEmailAddress = email =>
                {
                    var result = Regex.Replace(email, "@{1,}", "@").Trim();

                    result = result.Replace(",", ".");

                    if (result.EndsWith("@"))
                        result += "trashbinemailaddress.com";

                    if (result.StartsWith("@"))
                        result = "noreply" + result;

                    result = result.Trim();
                    result = Regex.Replace(result, @"\s|;", "_");

                    return result;
                };

            if (!_isDispatching)
            {
                _isDispatching = true;

                queue = MessageQueueManager.Current.GetQueue(MessageQueueType.Email);
                messages = queue.GetMessages().ToList();
                dispatchedMessages = new List<Message>();
                dispatchedMessageMap = new HashSet<string>();

                if (messages != null && messages.Any())
                {
                    _log.Info(string.Format("Dispatching {0} message(s)...", messages.Count()));

                    try
                    {
                        using (var client = new SmtpClient())
                        {
                            foreach (var m in messages)
                            {
                                canDispatch = true;
                                
                                mail = new MailMessage();

                                mail.IsBodyHtml = false;
                                mail.From = new MailAddress("pavel.volgarev@spritesapp.com", "Pavel Volgarev");
                                mail.To.Add("pavel.volgarev@spritesapp.com");
                                mail.Subject = m.Subject;

                                body = GenericMessageBody.FromString(m.Body);

                                if (body != null)
                                {
                                    mail.To.Clear();
                                    mail.IsBodyHtml = true;

                                    recipient = body.GetParameter<string>("Recipient");

                                    if (!string.IsNullOrEmpty(recipient) && recipient.IndexOf("@") > 0)
                                    {
                                        mail.To.Add(sanitizeEmailAddress(recipient));
                                        mail.Body = body.GetParameter<string>("Body");
                                        mail.ReplyToList.Add("pavel.volgarev@spritesapp.com");
                                    }
                                    else
                                    {
                                        canDispatch = false;

                                        if (!dispatchedMessageMap.Contains(m.Id))
                                        {
                                            dispatchedMessageMap.Add(m.Id);
                                            dispatchedMessages.Add(m);
                                        }
                                    }
                                }
                                else
                                {
                                    mail.Body = m.Body;

                                    if (mail.Subject.IndexOf("howdy", StringComparison.InvariantCultureIgnoreCase) >= 0)
                                    {
                                        feedbackSenderStart = mail.Body.IndexOf("--");
                                        
                                        if (feedbackSenderStart >= 0)
                                        {
                                            feedbackSenderEnd = mail.Body.IndexOf("#", feedbackSenderStart + 2);
                                            if (feedbackSenderEnd >= 0)
                                            {
                                                feedbackSender = mail.Body.Substring(feedbackSenderStart + 2,
                                                    feedbackSenderEnd - (feedbackSenderStart + 2)).Trim().Replace("&lt;", "<").Replace("&gt;", ">");

                                                if (feedbackSender.IndexOf('@') > 0)
                                                {
                                                    try
                                                    {
                                                        replyToOverride = new MailAddress(feedbackSender);
                                                    }
                                                    catch (FormatException) { }
                                                    catch (ArgumentException) { }

                                                    if (replyToOverride != null)
                                                        mail.ReplyToList.Add(replyToOverride);
                                                }
                                            }
                                        }
                                    }
                                }
                                    

                                if (canDispatch)
                                {
                                    connectionPortIndex = -1;

                                    do
                                    {
                                        try
                                        {
                                            if (connectionPortIndex >= 0 && connectionPortIndex < connectionPorts.Length)
                                                client.Port = connectionPorts[connectionPortIndex];

                                            if (!dispatchedMessageMap.Contains(m.Id))
                                            {
                                                dispatchedMessageMap.Add(m.Id);
                                                dispatchedMessages.Add(m);
                                            }

                                            client.Send(mail);

                                            break;
                                        }
                                        catch (Exception ex)
                                        {
                                            _log.Error(string.Format("Failed to dispatch message with Id '{0}'", m.Id), ex);

                                            if (ex.InnerException is WebException)
                                            {
                                                errorStatus = (ex.InnerException as WebException).Status;

                                                // When connection can't be made, we're going to try different ports (explicit/implicit SSL).
                                                if (errorStatus == WebExceptionStatus.ConnectFailure)
                                                    connectionPortIndex++;
                                            }
                                            else if ((ex.Message ?? string.Empty).IndexOf("timeout", System.StringComparison.OrdinalIgnoreCase) >= 0)
                                                connectionPortIndex++;
                                        }
                                    }
                                    while (connectionPortIndex < connectionPorts.Length);
                                }
                            }
                        }

                        queue.RemoveMessages(dispatchedMessages);
                        dispatchedMessageMap.Clear();
                    }
                    catch (Exception ex)
                    {
                        _log.Error(string.Format("Failed to dispatch {0} message(s).", messages.Count()), ex);
                    }
                }

                _isDispatching = false;
            }
        }
    }
}
