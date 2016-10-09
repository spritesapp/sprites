using System;
using System.Configuration;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using log4net;
using log4net.Config;
using System.Reflection;
using System.Diagnostics;

namespace Ifly.Logging
{
    /// <summary>
    /// Represents a logger.
    /// </summary>
    public class Logger : ILogger
    {
        /// <summary>
        /// Represents application error handler.
        /// </summary>
        public class ApplicationErrorHandler
        {
            private readonly string _errorSignature;
            private readonly string _errorText;

            /// <summary>
            /// Initializes a new instance of an object.
            /// </summary>
            /// <param name="errorSignature">Error signature.</param>
            /// <param name="errorText">Error text.</param>
            public ApplicationErrorHandler(string errorSignature, string errorText)
            {
                _errorSignature = errorSignature;
                _errorText = errorText;
            }

            /// <summary>
            /// Registers a handler to process the given error.
            /// </summary>
            /// <param name="handler">Handler.</param>
            public void Handle(Action<string, string> handler)
            {
                if (handler != null)
                    handler(_errorSignature, _errorText);
            }
        }

        private string AppVersion { get; set; }

        /// <summary>
        /// Gets the current logger.
        /// </summary>
        public static Logger Current { get; private set; }
        
        public ILog Log { get; set; }

        static Logger()
        {
            try
            {
                Logger.Current = new Logger(new System.IO.FileInfo(HttpContext.Current.Server.MapPath("~/log4net.config")));
            }
            catch
            {
                Logger.Current = new Logger(null);
            }
        }

        private Logger(FileInfo settings)
        {
            var enabled = true;

            bool.TryParse(ConfigurationManager.AppSettings["LoggingEnabled"], out enabled);

            if (enabled && settings != null)
            {
                log4net.Config.XmlConfigurator.ConfigureAndWatch(settings);

                this.Log = new BufferedLog(log4net.LogManager.GetLogger(typeof(BufferedLog)));
            }
            else
            {
                this.Log = new MockLog();
            }

            this.AppVersion = FileVersionInfo.GetVersionInfo(Assembly.GetExecutingAssembly().Location).FileVersion;
        }

        /// <summary>
        /// Writes the given message to the log.
        /// </summary>
        /// <param name="message">Message to write.</param>
        public void Write(Message message)
        {
            this.Log.Write(message);
        }

        /// <summary>
        /// Writes the given message to the log.
        /// </summary>
        /// <param name="text">Message text.</param>
        /// <param name="level">Level.</param>
        public void Write(string text, MessageLevel level = MessageLevel.Information)
        {
            this.Write(new Message(text, level) {
                User = Ifly.ApplicationContext.Current.User,
                Version = this.AppVersion
            });
        }

        /// <summary>
        /// Executes when application error occurs.
        /// </summary>
        /// <param name="exception">Application error.</param>
        /// <returns>Error handler.</returns>
        public static ApplicationErrorHandler OnError(Exception exception)
        {
            User u = null;
            Assembly assembly = Assembly.GetExecutingAssembly();
            FileVersionInfo fvi = FileVersionInfo.GetVersionInfo(assembly.Location);
            string url = string.Empty, method = string.Empty, headers = string.Empty;
            string messageHash = Utils.Crypto.GetHash(exception.Message + exception.StackTrace);

            try
            {
                // In case we don't have a connection to the database, this will fail.
                u = Ifly.ApplicationContext.Current.User;
            }
            catch (ArgumentException) { }
            catch (TypeInitializationException) { }

            try
            {
                if (System.Web.HttpContext.Current != null && System.Web.HttpContext.Current.Request != null)
                {
                    url = System.Web.HttpContext.Current.Request.RawUrl;

                    headers = string.Join("\n", System.Web.HttpContext.Current.Request.Headers.AllKeys.OrderBy(k => k).Select(k =>
                        string.Format("{0}: {1}", k, System.Web.HttpContext.Current.Request.Headers[k])));

                    method = (System.Web.HttpContext.Current.Request.HttpMethod ?? string.Empty).ToUpperInvariant();
                }
            }
            catch (Exception) { }

            var text = new System.Text.StringBuilder();

            text.AppendLine(exception.Message).AppendLine();
            text.AppendLine("------------------------------------------------------------------").AppendLine();
            text.AppendLine(string.Format("{0} {1}", method, url)).AppendLine();
            text.AppendLine(headers).AppendLine();
            text.AppendLine("------------------------------------------------------------------").AppendLine();
            text.AppendLine(string.Format("Version: {0}, User: {1} <{2}>", fvi.FileVersion, u != null ? u.Name : "?", u != null ? u.Email : "?")).AppendLine();
            text.AppendLine("------------------------------------------------------------------").AppendLine();
            text.AppendLine(exception.StackTrace);

            Logging.Logger.Current.Write(text.ToString(), Logging.MessageLevel.Error);

            return new ApplicationErrorHandler(messageHash, text.ToString());
        }
    }
}
