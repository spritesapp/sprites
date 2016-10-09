using System;

namespace Ifly.External.OAuth
{
    /// <summary>
    /// Represents OAuth client name attribute. This class cannot be inherited.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = false)]
    public sealed class OAuthClientNameAttribute : Attribute
    {
        /// <summary>
        /// Gets client name.
        /// </summary>
        public string Name { get; private set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="name">Client name.</param>
        public OAuthClientNameAttribute(string name)
        {
            this.Name = name;
        }
    }
}
