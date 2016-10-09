using System;
using System.ServiceProcess;

namespace Ifly.HelpRepositoryService
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        static void Main(string[] args)
        {
            //ServiceBase[] ServicesToRun;
            //ServicesToRun = new ServiceBase[] 
            //{ 
            //    new Service() 
            //};
            //ServiceBase.Run(ServicesToRun);

            Populator.PopulateHelpTopics();
        }
    }
}
