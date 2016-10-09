using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;

namespace Ifly.Utils
{
    /// <summary>
    /// Provides methods for working with encryption/hashing algorithms.
    /// </summary>
    public static class Crypto
    {
        private static byte[] _salt = Encoding.ASCII.GetBytes("o6806642kbM7c5");
        private static byte[] _iv = Encoding.ASCII.GetBytes("HRb2pIjHRa2pIjuG");

        /// <summary>
        /// Encrypts the given data and returns the encrypted value as base-64 encoded string.
        /// </summary>
        /// <param name="data">Data to encrypt.</param>
        /// <param name="secret">Secret key.</param>
        /// <returns>Encrypted value as base-64 encoded string.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="data" /> is null.</exception>
        /// <exception cref="System.ArgumentException"><paramref name="secret" /> is null or an empty string.</exception>
        public static string Encrypt(object data, string secret)
        {
            byte[] bytes = null;
            string ret = string.Empty;
            
            if (data == null)
                throw new ArgumentNullException("data");

            if (string.IsNullOrEmpty(secret))
                throw new ArgumentException("Encryption key must be specified.", "secret");

            using (var key = new Rfc2898DeriveBytes(secret, _salt))
            {
                using (var c = new RijndaelManaged())
                {
                    c.Key = key.GetBytes(32);
                    c.IV = key.GetBytes(16);

                    using (var encryptor = c.CreateEncryptor(c.Key, c.IV))
                    {
                        using (var stream = new MemoryStream())
                        {
                            using (var cryptoStream = new CryptoStream(stream, encryptor, CryptoStreamMode.Write))
                            {
                                bytes = Encoding.UTF8.GetBytes(new JavaScriptSerializer().Serialize(data));
                                cryptoStream.Write(bytes, 0, bytes.Length);
                            }

                            ret = Convert.ToBase64String(stream.ToArray());
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Decrypts the given data and returns the decrypted value.
        /// </summary>
        /// <typeparam name="T">Value type.</typeparam>
        /// <param name="encrypted">Encrypted data as base 64 encoded string.</param>
        /// <param name="secret">Secret key.</param>
        /// <returns>Decrypted value.</returns>
        /// <exception cref="System.ArgumentNullException"><paramref name="encrypted" /> is null.</exception>
        /// <exception cref="System.ArgumentException"><paramref name="secret" /> is null or an empty string.</exception>
        public static T Decrypt<T>(string encrypted, string secret)
        {
            T ret = default(T);
            byte[] bytes = null;
            string data = string.Empty;

            if (encrypted == null)
                throw new ArgumentNullException("encrypted");

            if (string.IsNullOrEmpty(secret))
                throw new ArgumentException("Encryption key must be specified.", "secret");

            using (var key = new Rfc2898DeriveBytes(secret, _salt))
            {
                bytes = Convert.FromBase64String(encrypted);
                
                using (var c = new RijndaelManaged())
                {
                    c.Key = key.GetBytes(32);
                    c.IV = key.GetBytes(16);

                    using (var decryptor = c.CreateDecryptor(c.Key, c.IV))
                    {
                        using (var stream = new MemoryStream())
                        {
                            using (var cryptoStream = new CryptoStream(stream, decryptor, CryptoStreamMode.Write))
                                cryptoStream.Write(bytes, 0, bytes.Length);

                            data = Encoding.UTF8.GetString(stream.ToArray());
                        }
                        
                        ret = new JavaScriptSerializer().Deserialize<T>(data);
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Returns the MD5 hash of a given value.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <returns>The MD5 hash of a given value.</returns>
        public static string GetHash(object value)
        {
            byte[] hash = null;
            string ret = string.Empty;
            var output = new StringBuilder();

            if (value == null)
                throw new ArgumentNullException("value");

            using (var md5 = MD5.Create())
                hash = md5.ComputeHash(Encoding.ASCII.GetBytes(value.ToString()));

            foreach (var b in hash)
                output.Append(b.ToString("X2"));

            ret = output.ToString();

            return ret;
        }
    }
}
