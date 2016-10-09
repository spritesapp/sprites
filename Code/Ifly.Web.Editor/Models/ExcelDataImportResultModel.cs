using System.Collections.Generic;

namespace Ifly.Web.Editor.Models
{
    /// <summary>
    /// Represents Excel/CSV data import result model.
    /// </summary>
    public class ExcelDataImportResultModel
    {
        /// <summary>
        /// Gets or sets the file size, in bytes.
        /// </summary>
        public long FileSize { get; set; }

        /// <summary>
        /// Gets or sets the list of all available Excel sheets.
        /// </summary>
        public IList<string> AvailableSheets { get; set; }

        /// <summary>
        /// Gets or sets the sheet data.
        /// </summary>
        public IList<Ifly.DataTable> SheetData { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public ExcelDataImportResultModel()
        {
            this.AvailableSheets = new List<string>();
            this.SheetData = new List<Ifly.DataTable>();
        }
    }
}