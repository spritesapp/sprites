using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ifly.Logging
{
    public interface ILogger
    {
        ILog Log { get; set; }

        void Write(Message message);
    }
}
