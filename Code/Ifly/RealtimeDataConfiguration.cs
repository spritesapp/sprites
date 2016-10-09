namespace Ifly
{
    /// <summary>
    /// Represents data import source type.
    /// </summary>
    public enum DataImportSourceType
    {
        /// <summary>
        /// Excel/CSV.
        /// </summary>
        Excel = 0,

        /// <summary>
        /// Google Spreadsheets.
        /// </summary>
        Google = 1,

        /// <summary>
        /// Custom URL.
        /// </summary>
        Url = 2
    }

    /// <summary>
    /// Represents relatime data configuration.
    /// </summary>
    public class RealtimeDataConfiguration
    {
        /// <summary>
        /// Gets or sets the source type.
        /// </summary>
        public DataImportSourceType SourceType { get; set; }

        /// <summary>
        /// Gets or sets the endpoint.
        /// </summary>
        public string Endpoint { get; set; }

        /// <summary>
        /// Gets or sets the URL-encoded parameters.
        /// </summary>
        public string Parameters { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public RealtimeDataConfiguration()
        {
            SourceType = DataImportSourceType.Google;
            Endpoint = string.Empty;
            Parameters = string.Empty;
        }
    }
}
