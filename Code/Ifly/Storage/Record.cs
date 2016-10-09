namespace Ifly.Storage
{
    /// <summary>
    /// Represents a record.
    /// </summary>
    public abstract class Record : IRecord
    {
        /// <summary>
        /// Gets or sets the record Id.
        /// </summary>
        public virtual int Id { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        protected Record() { }

        /// <summary>
        /// Returns string representation of the current object.
        /// </summary>
        /// <returns>String representation of the current object.</returns>
        public override string ToString()
        {
            return string.Format("Id = {0}", this.Id.ToString());
        }
    }
}
