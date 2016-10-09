using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents data row.
    /// </summary>
    public class DataRow
    {
        /// <summary>
        /// Gets or sets the row cells.
        /// </summary>
        public IList<DataCell> Cells { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public DataRow()
        {
            this.Cells = new List<DataCell>();
        }
    }
}
