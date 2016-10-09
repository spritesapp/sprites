using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ifly.Logging
{
    public enum MessageLevel
    {
        Information = 0,
        Warning = 1,
        Error = 2
    }

    public class Message
    {
        public string Version { get; set; }

        public User User { get; set; }

        public MessageLevel Level { get; set; }
        
        public string Text { get; set; }

        public Message() : this(string.Empty, MessageLevel.Information) { }

        public Message(string text) : this(text, MessageLevel.Information) { }

        public Message(string text, MessageLevel level)
        {
            this.Text = text;
            this.Level = level;
        }

        public override string ToString()
        {
            return this.Text;
        }
    }
}
