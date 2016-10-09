using System;
using System.Dynamic;
using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents a user.
    /// </summary>
    public class User : Storage.Record
    {
        /// <summary>
        /// Gets or sets the full name of the user.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the user's email address.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Gets or sets the date and time when this user was created.
        /// </summary>
        public System.DateTime Created { get; set; }

        /// <summary>
        /// Gets or sets the provider-qualified Id of the user assigned by the external service (OAuth provider).
        /// </summary>
        public string ExternalId { get; set; }

        /// <summary>
        /// Gets or sets user subscription.
        /// </summary>
        public UserSubscription Subscription { get; set; }

        /// <summary>
        /// Gets or sets user password details.
        /// </summary>
        public UserPasswordDetails Password { get; set; }

        /// <summary>
        /// Gets or sets the API authorization.
        /// </summary>
        public External.UserApiAuthorization ApiAuthorization { get; set; }

        /// <summary>
        /// Gets or sets the company name.
        /// </summary>
        public string CompanyName { get; set; }

        /// <summary>
        /// Gets or sets the company address.
        /// </summary>
        public string CompanyAddress { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public User()
        {
            this.Created = System.DateTime.UtcNow;
            this.Subscription = new UserSubscription();
            this.Password = new UserPasswordDetails();
            this.ApiAuthorization = new External.UserApiAuthorization();
        }

        /// <summary>
        /// Converts the given user instance to lightweight client-side definition.
        /// </summary>
        /// <returns>Client-side definition.</returns>
        public dynamic ToClientDefinition()
        {
            var ret = new ExpandoObject();

            Func<ExpandoObject, string, object, ExpandoObject> addProperty = (expando, name, value) => 
                {
                    (expando as IDictionary<string, object>).Add(name, value);
                    return expando;
                };

            addProperty(ret, "Id", Id);
            addProperty(ret, "Name", Name);
            addProperty(ret, "Email", Email);
            addProperty(ret, "Subscription", addProperty(new ExpandoObject(), "Type", Subscription.Type));
            addProperty(ret, "CompanyName", CompanyName);
            addProperty(ret, "CompanyAddress", CompanyAddress);

            return ret;
        }
    }
}
