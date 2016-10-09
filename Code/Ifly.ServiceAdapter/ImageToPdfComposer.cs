using iTextSharp.text;
using iTextSharp.text.pdf;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace Ifly.ServiceAdapter
{
    /// <summary>
    /// Represents image to PDF composer.
    /// </summary>
    public static class ImageToPdfComposer
    {
        /// <summary>
        /// Tries to compose a PDf out of the given image (or a set of images if multiple related are found within the same directory).
        /// </summary>
        /// <param name="physicalPath">Image physical path.</param>
        /// <returns>PDF byte data.</returns>
        public static byte[] TryCompose(string physicalPath)
        {
            Image img = null;
            byte[] ret = null;
            float margin = 100f;
            PdfWriter writer = null;
            Document document = null;
            Rectangle imageSize = null;
            IEnumerable<string> images = null;
            
            if (File.Exists(physicalPath) && string.Compare(Path.GetExtension(physicalPath).Trim('.'), "pdf", true) == 0)
            {
                var lastImage = Image.GetInstance(physicalPath);

                imageSize = new Rectangle(PixelsToPoints(lastImage.ScaledWidth), PixelsToPoints(lastImage.ScaledHeight));

                using (var stream = new MemoryStream())
                {
                    try
                    {
                        document = new Document(new Rectangle(imageSize.Width + margin, imageSize.Height + margin), 0, 0, 0, 0);
                        writer = PdfWriter.GetInstance(document, stream);

                        writer.CompressionLevel = PdfStream.NO_COMPRESSION;

                        document.Open();

                        images = GetAllImages(physicalPath);

                        foreach (var image in images)
                        {
                            document.NewPage();

                            var table = new PdfPTable(1)
                            {
                                WidthPercentage = 100
                            };

                            var cell = new PdfPCell()
                            {
                                VerticalAlignment = iTextSharp.text.Element.ALIGN_MIDDLE
                            };

                            cell.MinimumHeight = document.PageSize.Height - (document.BottomMargin + document.TopMargin);

                            img = Image.GetInstance(image);

                            img.Border = Rectangle.BOX;
                            img.BorderColor = BaseColor.LIGHT_GRAY;
                            img.BorderWidth = 3f;

                            img.SetDpi(300, 300);

                            img.ScaleToFit(new Rectangle(imageSize.Width, imageSize.Height));
                            img.Alignment = Image.ALIGN_CENTER;

                            cell.AddElement(img);

                            table.AddCell(cell);

                            document.Add(table);
                        }
                    }
                    finally
                    {
                        if (images != null && images.Any())
                        {
                            foreach(var image in images)
                            {
                                if (File.Exists(image))
                                {
                                    try
                                    {
                                        File.Delete(image);
                                    }
                                    catch (Exception) { }
                                }
                            }
                        }
                        if (document != null)
                        {
                            try
                            {
                                document.Close();
                            }
                            catch (Exception) { }
                        }

                        ret = stream.ToArray();
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Returns a list of physical paths to all images that are part of this PDF document.
        /// </summary>
        /// <param name="physicalPath">Physical path of the last image.</param>
        /// <returns>A list of physical paths.</returns>
        private static IEnumerable<string> GetAllImages(string physicalPath)
        {
            string partPrefix = "_part_";
            string partPattern = "([0-9]+)_part_";
            string lastFileName = Path.GetFileNameWithoutExtension(physicalPath);
            List<string> ret = Directory.EnumerateFiles(Path.GetDirectoryName(physicalPath)).Where(file =>
            {
                var fileName = Path.GetFileNameWithoutExtension(file);

                return fileName.IndexOf(partPrefix, StringComparison.OrdinalIgnoreCase) > 0 &&
                    string.Compare(Regex.Replace(fileName, partPattern, string.Empty), lastFileName, true) == 0;
            }).Concat(new string[] { physicalPath }).ToList();

            ret.Sort((x, y) =>
            {
                return x.IndexOf(partPrefix, StringComparison.OrdinalIgnoreCase) < 0 ? 1 :
                    (y.IndexOf(partPrefix, StringComparison.OrdinalIgnoreCase) < 0 ? -1 :
                    (int.Parse(Regex.Match(x, partPattern).Groups[1].Value) - int.Parse(Regex.Match(y, partPattern).Groups[1].Value)));
            });

            return ret;
        }

        /// <summary>
        /// Convers pixels to PDF points.
        /// </summary>
        /// <param name="value">Pixels value.</param>
        /// <param name="dpi">DPI (default is 96).</param>
        /// <returns>Points.</returns>
        public static float PixelsToPoints(float value, int dpi = 96)
        {
            return value * 72 / dpi;
        }
    }
}
