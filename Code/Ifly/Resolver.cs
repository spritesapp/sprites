using Autofac;
using System.Reflection;
using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents a dependency resolver. This class cannot be inherited.
    /// </summary>
    public static class Resolver
    {
        private static IContainer _container;

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static Resolver()
        {
            var builder = new ContainerBuilder();

            foreach (var asm in System.AppDomain.CurrentDomain.GetAssemblies())
            {
                builder.RegisterAssemblyTypes(asm)
                    .Where(t => typeof(IDependency).IsAssignableFrom(t))
                    .AsImplementedInterfaces();
            }

            _container = builder.Build();
        }

        /// <summary>
        /// Resolves the implementation of a given contract.
        /// </summary>
        /// <typeparam name="TContract">Contract type.</typeparam>
        /// <returns>Contract implementation.</returns>
        public static TContract Resolve<TContract>()
        {
            return _container.Resolve<TContract>();
        }

        /// <summary>
        /// Resolves all implementations of a given contract.
        /// </summary>
        /// <typeparam name="TContract">Contract type.</typeparam>
        /// <returns>Contract implementations.</returns>
        public static IEnumerable<TContract> ResolveAll<TContract>()
        {
            return _container.Resolve<IEnumerable<TContract>>();
        }
    }
}
