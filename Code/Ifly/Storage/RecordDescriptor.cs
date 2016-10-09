namespace Ifly.Storage
{
    /// <summary>
    /// Represents a record descriptor.
    /// </summary>
    public class RecordDescriptor : Record
    {
        /// <summary>
        /// Gets or sets the name of the record.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public RecordDescriptor() { }

        /// <summary>
        /// Returns string representation of the current object.
        /// </summary>
        /// <returns>String representation of the current object.</returns>
        public override string ToString()
        {
            return string.Format("(Id, Name) = ({0}, {1})", this.Id, this.Name);
        }
    }
}
