using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ifly.Logging
{
    /// <summary>
    /// Represents a simulator of log.
    /// </summary>
    public class MockLog : ILog
    {
        public void Write(Message message) {}
    }
}
