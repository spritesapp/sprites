using System.ServiceProcess;
using System.Threading;

namespace Ifly.HelpRepositoryService
{
    /// <summary>
    /// Represents a service.
    /// </summary>
    /// <remarks>To install: sc create Ifly.HelpRepositoryService binpath=... start=auto.</remarks>
    public partial class Service : ServiceBase
    {
        private static Timer _timer;

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public Service()
        {
            InitializeComponent();
        }

        /// <summary>
        /// Occurs on service start.
        /// </summary>
        /// <param name="args">Arguments.</param>
        protected override void OnStart(string[] args)
        {
            _timer = new Timer(OnTimer, null, 0, 1000 * 60 * 60 * 24);
        }

        /// <summary>
        /// Occurs on service stop.
        /// </summary>
        protected override void OnStop() { }

        /// <summary>
        /// Occurs on every timer signaling.
        /// </summary>
        /// <param name="state">State.</param>
        private void OnTimer(object state)
        {
            // No tasks to perform.
        }
    }
}
