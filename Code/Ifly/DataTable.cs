using System.Collections.Generic;

namespace Ifly
{
    /// <summary>
    /// Represents data table.
    /// </summary>
    public class DataTable
    {
        /// <summary>
        /// Gets or sets the rows.
        /// </summary>
        public IList<DataRow> Rows { get; set; }

        /// <summary>
        /// Gets or sets the columns.
        /// </summary>
        public IList<DataColumn> Columns { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public DataTable()
        {
            this.Rows = new List<DataRow>();
            this.Columns = new List<DataColumn>();
        }
    }
}
