using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Xml;
using System.Xml.Linq;

namespace Ifly.Media
{
    /// <summary>
    /// Represents a media item manager.
    /// </summary>
    public class MediaItemManager
    {
        private readonly int _userId = 0;

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public MediaItemManager()
        {
            User u = Ifly.ApplicationContext.Current.User;

            if (u != null && u.Subscription != null)
                _userId = u.Id;
        }

        /// <summary>
        /// Returns all media items that belong to the current user.
        /// </summary>
        /// <returns>Media items.</returns>
        public IEnumerable<MediaItem> GetItems()
        {
            IEnumerable<MediaItem> ret = Enumerable.Empty<MediaItem>();

            if (_userId > 0)
            {
                using (var repo = Resolver.Resolve<IMediaItemRepository>())
                    ret = repo.GetMediaItemsByUser(_userId);
            }

            return ret;
        }

        /// <summary>
        /// Creates new media item.
        /// </summary>
        /// <param name="name">Name.</param>
        /// <param name="url">URL.</param>
        /// <returns>Created media item.</returns>
        public MediaItem CreateItem(string name, string url, bool uploadFile = false)
        {
            Uri uri = null;
            byte[] data = null;
            MediaItem ret = null;
            int maxSizeKb = 1024;
            bool isValidMedia = false;
            string root = string.Empty;
            string format = string.Empty;
            string fullPhysicalPath = string.Empty;
            string fileNameWithoutExtension = string.Empty;

            if (_userId > 0)
            {
                if (uploadFile)
                {
                    if (Uri.TryCreate(url, UriKind.Absolute, out uri))
                    {
                        using (var client = new System.Net.WebClient())
                            data = client.DownloadData(url);

                        if (data != null)
                        {
                            fileNameWithoutExtension = System.Guid.NewGuid().ToString();
                            root = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Uploads");
                            fullPhysicalPath = Path.Combine(root, string.Format("{0}.{1}", fileNameWithoutExtension,
                                uri.AbsolutePath.IndexOf('.') > 0 ? uri.AbsolutePath.Substring(uri.AbsolutePath.LastIndexOf('.') + 1) : "bin"));

                            File.WriteAllBytes(fullPhysicalPath, data);
                            format = GetImageFormat(fullPhysicalPath);

                            if (!string.IsNullOrEmpty(format) && (new FileInfo(fullPhysicalPath).Length / maxSizeKb) <= maxSizeKb)
                            {
                                File.Move(fullPhysicalPath, Path.Combine(root, string.Format("{0}.{1}", fileNameWithoutExtension, format)));
                                isValidMedia = true;
                            }
                            else
                            {
                                try
                                {
                                    File.Delete(fullPhysicalPath);
                                }
                                catch (IOException) { }
                            }
                        }
                    }
                }
                else
                    isValidMedia = true;

                if (isValidMedia)
                {
                    using (var repo = Resolver.Resolve<IMediaItemRepository>())
                    {
                        ret = repo.Update(new MediaItem()
                        {
                            UserId = _userId,
                            Name = name,
                            Url = url,
                            Created = DateTime.UtcNow
                        });
                    }
                }
            }
            
            return ret;
        }

        /// <summary>
        /// Removes the given media item.
        /// </summary>
        /// <param name="id">Item Id.</param>
        /// <param name="deleteFile">Value indicating whether to try deleting the Sprites file associated with this item.</param>
        /// <returns>Deleted media item.</returns>
        public MediaItem RemoveItem(int id, bool deleteFile = false)
        {
            bool deleted = false;
            MediaItem ret = null;
            string root = string.Empty;
            string fullPhysicalPath = string.Empty;

            if (_userId > 0 && id > 0)
            {
                using (var repo = Resolver.Resolve<IMediaItemRepository>())
                {
                    ret = repo.Select(id);

                    if (ret != null && ret.UserId == _userId)
                    {
                        ret = repo.Delete(ret);
                        deleted = true;
                    }
                }

                if (deleted && deleteFile && (ret.Url ?? string.Empty).IndexOf('/') > 0)
                {
                    root = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/Uploads");
                    fullPhysicalPath = Path.Combine(root, ret.Url.Substring(ret.Url.LastIndexOf('/') + 1));

                    if (File.Exists(fullPhysicalPath))
                    {
                        try
                        {
                            File.Delete(fullPhysicalPath);
                        }
                        catch (IOException) { }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Determines the format of a given image.
        /// </summary>
        /// <param name="path">Image path.</param>
        /// <returns>Image format.</returns>
        private string GetImageFormat(string path)
        {
            XDocument doc = null;
            string ret = string.Empty;
            List<string> viewBox = new List<string>(new string[] { "0", "0" });
            System.Action<string, System.Action<string>, string> readAttributeValue = (n, v, d) =>
            {
                var attr = doc.Root.Attribute(n);

                if (attr != null && !string.IsNullOrEmpty(attr.Value))
                    v(attr.Value);
                else
                    v(d);
            };

            try
            {
                using (var stream = new FileStream(path, FileMode.Open))
                {
                    using (var reader = XmlReader.Create(stream))
                    {
                        while (reader.Read()) { }
                        ret = "svg";
                    }
                }
            }
            catch (System.Exception) { }

            if (string.Compare(ret, "svg", true) == 0)
            {
                try
                {
                    doc = XDocument.Load(path);

                    readAttributeValue("width", v => { viewBox.Add(v); }, "200");
                    readAttributeValue("height", v => { viewBox.Add(v); }, "200");

                    doc.Root.SetAttributeValue("width", null);
                    doc.Root.SetAttributeValue("height", null);
                    doc.Root.SetAttributeValue("viewBox", string.Join(" ", viewBox));
                    doc.Root.SetAttributeValue("preserveAspectRatio", "xMinYMin meet");

                    doc.Save(path);
                }
                catch (System.Exception) { }
            }

            if (string.IsNullOrEmpty(ret))
            {
                try
                {
                    using (var img = Image.FromFile(path))
                    {
                        if (img.RawFormat.Equals(ImageFormat.Jpeg))
                            ret = "jpg";
                        else if (img.RawFormat.Equals(ImageFormat.Png))
                            ret = "png";
                        else if (img.RawFormat.Equals(ImageFormat.Gif))
                            ret = "gif";
                        else if (img.RawFormat.Equals(ImageFormat.Bmp))
                            ret = "bmp";
                    }
                }
                catch (FileNotFoundException) { }
                catch (System.OutOfMemoryException) { }
            }

            return ret;
        }
    }
}
