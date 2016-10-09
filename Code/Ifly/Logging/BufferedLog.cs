using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Ifly.Storage.Repositories;
using System.Threading;

namespace Ifly.Logging
{
    /// <summary>
    /// Represents a buffered log.
    /// </summary>
    public class BufferedLog : ILog
    {
        private ConcurrentDictionary<string, Message> _batch;

        private int _batchMaxSize;

        private int _flushInterval;

        private Timer _timer;

        private log4net.ILog _log;

        public BufferedLog(log4net.ILog log)
        {
            if (log == null) {
                throw new ArgumentNullException("log");
            }

            this._log = log;
            this._batch = new ConcurrentDictionary<string, Message>();
            this._batchMaxSize = 25;
            this._flushInterval = 20;

            long interval = this._flushInterval * 60000;
            long startTimeout = 60000;

            this._timer = new Timer(new TimerCallback((state) => this.Flush()), this, startTimeout, interval);
        }

        public void Write(Message message)
        {
            if (this.IsFull())
            {
                this.Flush();
            }

            if (!this._batch.Keys.Contains(message.Text))
            {
                this._batch.TryAdd(message.Text, message);
            }
        }

        private void Clear()
        {
            this._batch.Clear();
        }

        private void Flush()
        {
            try
            {
                var text = string.Empty;

                foreach (Message msg in this._batch.Values)
                {
                    text = msg.Text;

                    switch (msg.Level)
                    {
                        case MessageLevel.Information:
                            this._log.Info(msg);
                            break;
                        case MessageLevel.Warning:
                            this._log.Warn(msg);
                            break;
                        case MessageLevel.Error:
                            this._log.Error(msg);
                            break;
                        default:
                            this._log.Info(msg);
                            break;
                    }
                }
            }
            finally
            {
                this.Clear();
            }
        }

        private bool IsFull()
        {
            return this._batch.Count >= this._batchMaxSize;
        }
    }
}
