using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ifly.Logging
{
    public interface ILog
    {
        void Write(Message message);
    }
}
