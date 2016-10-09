using System;

namespace Ifly.External.OAuth
{
    /// <summary>
    /// Represents OAuth state.
    /// </summary>
    public class OAuthState
    {
        /// <summary>
        /// Gets or sets the application name.
        /// </summary>
        public string ApplicationName { get; set; }

        /// <summary>
        /// Gets or sets the user Id.
        /// </summary>
        public int UserId { get; set; }

        private static readonly string _salt = "g87d09halGFh18G51AGH8";

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public OAuthState() : this(string.Empty, 0) { }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="applicationName">Application name.</param>
        /// <param name="userId">User Id.</param>
        public OAuthState(string applicationName, int userId)
        {
            this.ApplicationName = applicationName;
            this.UserId = userId;
        }

        /// <summary>
        /// Returns string representation of the current object.
        /// </summary>
        /// <returns>String representation of the current object.</returns>
        public override string ToString()
        {
            return string.Format("{0}:{1}:{2}", UserId, ApplicationName,
                Utils.Crypto.GetHash(UserId.ToString() + _salt + ApplicationName));
        }

        /// <summary>
        /// Parses OAuth state from the given input.
        /// </summary>
        /// <param name="input">Input.</param>
        /// <returns>OAuth state.</returns>
        public static OAuthState Parse(string input)
        {
            int userId = 0;
            string[] parts = null;
            OAuthState ret = new OAuthState();

            if (!string.IsNullOrEmpty(input) && input.IndexOf(':') > 0)
            {
                parts = input.Split(new char[] { ':' }, StringSplitOptions.RemoveEmptyEntries);

                if (parts != null && parts.Length == 3 && int.TryParse(parts[0], out userId))
                {
                    ret.UserId = userId;
                    ret.ApplicationName = parts[1];

                    if (string.Compare(Utils.Crypto.GetHash(userId.ToString() + _salt + parts[1]), parts[2], StringComparison.Ordinal) != 0)
                    {
                        ret.UserId = 0;
                        ret.ApplicationName = string.Empty;
                    }
                }
            }

            return ret;
        }
    }
}
