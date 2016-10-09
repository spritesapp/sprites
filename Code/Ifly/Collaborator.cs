using System;

namespace Ifly
{
    /// <summary>
    /// Represents a collaborator.
    /// </summary>
    public class Collaborator : IComparable, IComparable<Collaborator>
    {
        /// <summary>
        /// Gets or sets user Id.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the platform-specific client Id.
        /// </summary>
        public string ClientId { get; set; }

        /// <summary>
        /// Gets or sets the full name of the user.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Gets or sets the user's email address.
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Returns a string representation of the current object.
        /// </summary>
        /// <returns></returns>
        public override string ToString()
        {
            return string.Format("{0} ({1})", Name ?? Email, Id);
        }

        /// <summary>
        /// Returns the hash code of the current object.
        /// </summary>
        /// <returns>The hash code of the current object.</returns>
        public override int GetHashCode()
        {
            return Id.GetHashCode() ^
                (ClientId ?? string.Empty).GetHashCode() ^
                (Name ?? string.Empty).GetHashCode() ^
                (Email ?? string.Empty).GetHashCode();
        }

        /// <summary>
        /// Returns value indicating whether the current object is equal to the given one.
        /// </summary>
        /// <param name="obj">Object to compare to.</param>
        /// <returns>Value indicating whether the current object is equal to the given one.</returns>
        public override bool Equals(object obj)
        {
            return obj != null && obj is Collaborator && CompareTo(obj as Collaborator) == 0;
        }

        /// <summary>
        /// Compares the current object to the given one and returns comparison result.
        /// </summary>
        /// <param name="obj">Object to compare to.</param>
        /// <returns>Comparison result.</returns>
        public int CompareTo(object obj)
        {
            return obj is Collaborator ? CompareTo(obj as Collaborator) : -1;
        }

        /// <summary>
        /// Compares the current object to the given one and returns comparison result.
        /// </summary>
        /// <param name="other">Object to compare to.</param>
        /// <returns>Comparison result.</returns>
        public int CompareTo(Collaborator other)
        {
            int ret = -1;

            if (other != null)
            {
                ret = string.Compare(Id.ToString(), other.Id.ToString());

                if (ret == 0)
                {
                    ret = string.Compare(ClientId ?? string.Empty, other.ClientId ?? string.Empty);

                    if (ret == 0)
                    {
                        ret = string.Compare(Name ?? string.Empty, other.Name ?? string.Empty);

                        if (ret == 0)
                            ret = string.Compare(Email ?? string.Empty, other.Email ?? string.Empty);
                    }
                }
            }

            return ret;
        }
    }
}
