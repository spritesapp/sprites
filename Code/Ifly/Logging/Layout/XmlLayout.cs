using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using log4net.Core;
using log4net.Layout;

namespace Ifly.Logging.Layout
{
    class XmlLayout : log4net.Layout.XmlLayoutBase
    {
        protected override void FormatXml(XmlWriter writer, LoggingEvent loggingEvent)
        {
            var message = loggingEvent.MessageObject as Ifly.Logging.Message;

            if (message != null)
            {
                writer.WriteStartElement("LogEntry");
                writer.WriteAttributeString("Date", loggingEvent.TimeStamp.ToString("dd-MM-yyy hh:mm"));
                writer.WriteAttributeString("Level", message.Level.ToString());
                writer.WriteAttributeString("Version", message.Version);
                writer.WriteAttributeString("User", message.User != null ? string.Format("{0}:{1}", message.User.Id, message.User.Name) : string.Empty);
                writer.WriteCData(loggingEvent.RenderedMessage);
                writer.WriteEndElement();
            }
        }
    }
}
