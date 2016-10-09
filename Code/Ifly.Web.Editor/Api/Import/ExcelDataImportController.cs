using Ifly.Web.Editor.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;

namespace Ifly.Web.Editor.Api.Import
{
    /// <summary>
    /// Represents Excel/CSV data import controller.
    /// </summary>
    public class ExcelDataImportController : RootApiController
    {
        /// <summary>
        /// Gets the service priority.
        /// </summary>
        public override int Priority
        {
            get { return 5; }
        }

        /// <summary>
        /// Imports and processed the Excel/CSV file.
        /// </summary>
        /// <returns>Import result.</returns>
        [HttpPost]
        public async Task<ExcelDataImportResultModel> UploadData()
        {
            long fileSize = 0;
            int maxSizeKb = 1024;
            string root = string.Empty;
            MultipartFileData file = null;
            ExcelDataImportResultModel ret = null;
            MultipartFormDataStreamProvider provider = null;

            if (!this.Request.Content.IsMimeMultipartContent())
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);

            root = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Uploads");
            provider = new MultipartFormDataStreamProvider(root);

            await this.Request.Content.ReadAsMultipartAsync(provider);
            file = provider.FileData.FirstOrDefault();

            if (file != null)
            {
                if (File.Exists(file.LocalFileName))
                {
                    fileSize = new FileInfo(file.LocalFileName).Length;

                    if ((fileSize / maxSizeKb) <= maxSizeKb)
                        ret = ProcessUploadedFile(file);

                    if (ret != null)
                        ret.FileSize = fileSize;

                    try
                    {
                        File.Delete(file.LocalFileName);
                    } catch { }
                }
            }

            return ret;
        }

        /// <summary>
        /// Processes uploaded file.
        /// </summary>
        /// <param name="file">File.</param>
        /// <returns>The result of file processing.</returns>
        private ExcelDataImportResultModel ProcessUploadedFile(MultipartFileData file)
        {
            string fileName = string.Empty;
            ExcelDataImportResultModel ret = null;

            if (file.Headers != null && file.Headers.ContentDisposition != null && 
                !string.IsNullOrEmpty(file.Headers.ContentDisposition.FileName))
            {
                fileName = file.Headers.ContentDisposition.FileName.Trim().Trim('\"').Trim();
                if(fileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                    ret = ProcessCsvFile(file.LocalFileName);
                else if (fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
                    ret = ProcessXlsxFile(file.LocalFileName);
            }

            return ret;
        }

        /// <summary>
        /// Processes the given CSV file.
        /// </summary>
        /// <param name="file">File path.</param>
        /// <returns>Processed file.</returns>
        private ExcelDataImportResultModel ProcessCsvFile(string file)
        {
            DataRow row = null;
            DataTable tab = null;
            ExcelDataImportResultModel ret = null;

            try
            {
                using (var reader = new StreamReader(file))
                {
                    using (var csv = new CsvHelper.CsvReader(reader))
                    {
                        while (csv.Read() && csv.CurrentRecord != null)
                        {
                            if (tab == null)
                            {
                                tab = new DataTable();

                                if (csv.FieldHeaders != null && csv.FieldHeaders.Any())
                                {
                                    row = new DataRow();

                                    foreach (var v in csv.FieldHeaders)
                                        row.Cells.Add(new DataCell() { Value = v });

                                    tab.Rows.Add(row);
                                }
                            }

                            row = new DataRow();

                            foreach (var v in csv.CurrentRecord)
                                row.Cells.Add(new DataCell() { Value = v });

                            tab.Rows.Add(row);
                        }
                    }
                }
            }
            catch (System.IO.IOException) { }
            catch (CsvHelper.CsvReaderException) { }

            if (tab != null)
            {
                ret = new ExcelDataImportResultModel();
                ret.SheetData.Add(tab);
            }

            return ret;
        }

        /// <summary>
        /// Processes the given XLSX file.
        /// </summary>
        /// <param name="file">File path.</param>
        /// <returns>Processed file.</returns>
        private ExcelDataImportResultModel ProcessXlsxFile(string file)
        {
            DataRow row = null;
            DataTable tab = null;
            List<string> r = null;
            string v = string.Empty;
            int sheetIndex = 0, sheetOffset = 0;
            ExcelDataImportResultModel ret = null;
            List<string> sheets = new List<string>();
            OfficeOpenXml.ExcelWorkbook workbook = null;
            List<List<string>> data = new List<List<string>>();
            bool hasData = false, hasFullData = false, hasRowData = false;
            List<List<List<string>>> fullData = new List<List<List<string>>>();
            int maxColumns = 25, maxRows = 25, longestRow = 0, offset = 0, i = 0, j = 0;
            
            using (var package = new OfficeOpenXml.ExcelPackage(new FileInfo(file)))
            {
                workbook = package.Workbook;

                if (workbook != null && workbook.Worksheets != null && workbook.Worksheets.Any())
                {
                    if (workbook.Worksheets.Count > 1)
                        sheets.AddRange(workbook.Worksheets.Select(s => s.Name));

                    foreach (var s in workbook.Worksheets)
                    {
                        hasData = false;
                        data.Clear();

                        for (i = 1; i <= maxRows; i++)
                        {
                            data.Add(new List<string>());
                            hasRowData = false;

                            for (j = 1; j <= maxColumns; j++)
                            {
                                v = s.Cells[i, j].GetValue<string>();

                                if (!hasRowData)
                                    hasRowData = !string.IsNullOrWhiteSpace(v);

                                if (!hasData)
                                    hasData = hasRowData;

                                data[data.Count - 1].Add(v);
                            }

                            if (!hasRowData)
                                data.RemoveAt(data.Count - 1);
                            else if (data[data.Count - 1].Count > longestRow)
                            {
                                offset = 0;
                                r = data[data.Count - 1];

                                while (string.IsNullOrWhiteSpace(r[r.Count - offset - 1]) && offset < (r.Count - 1))
                                    offset++;

                                if (r.Count - offset > longestRow)
                                    longestRow = r.Count - offset;
                            }
                        }

                        if (hasData)
                        {
                            for (i = 0; i < data.Count; i++)
                            {
                                if (data[i].Count > longestRow)
                                    data[i].RemoveRange(longestRow, data[i].Count - longestRow);
                            }

                            hasFullData = true;
                            fullData.Add(new List<List<string>>(data.Select(d => new List<string>(d))));
                        }
                        else if ((sheetIndex - sheetOffset) >= 0 && (sheetIndex - sheetOffset) < sheets.Count)
                        {
                            sheets.RemoveAt(sheetIndex - sheetOffset);
                            sheetOffset++;
                        }

                        sheetIndex++;
                    }
                }
            }

            if (hasFullData)
            {
                ret = new ExcelDataImportResultModel();

                ret.AvailableSheets = sheets;

                foreach (var fd in fullData)
                {
                    tab = new DataTable();

                    for (i = 0; i < fd.Count; i++)
                    {
                        row = new DataRow();

                        for (j = 0; j < fd[i].Count; j++)
                            row.Cells.Add(new DataCell() { Value = fd[i][j] });

                        tab.Rows.Add(row);
                    }

                    ret.SheetData.Add(tab);
                }
            }

            return ret;
        }

        /// <summary>
        /// Configures the given service.
        /// </summary>
        /// <param name="config">Configuration.</param>
        public override void Configure(HttpConfiguration config)
        {
            config.Routes.MapHttpRoute(
                name: "UploadExcelDataForImport",
                routeTemplate: "api/import/excel/upload",
                defaults: new { controller = "ExcelDataImport", action = "UploadData" }
            );
        }
    }
}
