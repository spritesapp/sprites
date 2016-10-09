using System;
using System.Diagnostics;
using System.IO;

namespace Ifly.ServiceAdapter
{
    /// <summary>
    /// Represents audio mix output location.
    /// </summary>
    public enum AudioMixOutputLocation
    {
        /// <summary>
        /// Mix into new track.
        /// </summary>
        NewTrack = 0,

        /// <summary>
        /// Mix into track.
        /// </summary>
        PrimaryTrack = 1,

        /// <summary>
        /// Mix into secondary track.
        /// </summary>
        SecondaryTrack = 2
    }

    /// <summary>
    /// Represents an audio mixer.
    /// </summary>
    public static class AudioMixer
    {
        /// <summary>
        /// Mixes two tracks.
        /// </summary>
        /// <param name="primaryTrack">Primary track.</param>
        /// <param name="secondaryTrack">Secondary track.</param>
        /// <param name="outputLocation">Output location.</param>
        /// <returns>Output file name.</returns>
        public static string MixTracks(
            string primaryTrack,
            string secondaryTrack,
            AudioMixOutputLocation outputLocation)
        {
            Func<string, string> 
                addAudioExtension = path =>
            {
                return string.Concat(path, ".mp3");
            }, getExtension = path =>
            {
                string ext = Path.GetExtension(path);

                return ext.ToLowerInvariant().Trim().Trim('.').Trim();
            };

            string mutedSecondary = addAudioExtension(Path.GetTempFileName()),
                    temp = string.Empty,
                    ret = temp;

            // Validating method parameters.

            if (string.IsNullOrWhiteSpace(primaryTrack))
                throw new ArgumentException("Primary track must be specified.", "primaryTrack");

            if (string.IsNullOrWhiteSpace(secondaryTrack))
                throw new ArgumentException("Secondary track must be specified.", "secondaryTrack");

            if (!File.Exists(primaryTrack))
                throw new ArgumentException("Primary track must point to existing file.", "primaryTrack");

            if (!File.Exists(secondaryTrack))
                throw new ArgumentException("Primary track must point to existing file.", "primaryTrack");

            // Resolving the path to the output file.

            switch (outputLocation)
            {
                case AudioMixOutputLocation.PrimaryTrack:
                    ret = primaryTrack;
                    break;
                case AudioMixOutputLocation.SecondaryTrack:
                    ret = secondaryTrack;
                    break;
            }

            // Preserving the extension of an output file.
            temp = string.Format("{0}.{1}", Path.GetTempFileName(), getExtension(ret));

            // Extension couldn't be resolved (output file is a temp file) - appending ".mp3" by default.
            if (temp.EndsWith("."))
                temp = addAudioExtension(temp);

            // Using ffmpeg to mix tracks.
            RunShell(string.Format("ffmpeg -i \"{0}\" -af \"volume=0.1\" \"{1}\"", secondaryTrack, mutedSecondary));
            RunShell(string.Format("ffmpeg -i \"{0}\" -i \"{1}\" -filter_complex amix=inputs=2:duration=first \"{2}\"", mutedSecondary, primaryTrack, temp));

            // Deleting muted secondary file.
            if (File.Exists(mutedSecondary))
                File.Delete(mutedSecondary);

            // Replacing temporary file with result.
            if (string.Compare(ret, temp, true) != 0)
            {
                File.Delete(ret);
                File.Move(temp, ret);

                // Automatic clean-up.
                if (string.Compare(ret, primaryTrack, true) != 0 && File.Exists(primaryTrack))
                    File.Delete(primaryTrack);
                else if (string.Compare(ret, secondaryTrack, true) != 0 && File.Exists(secondaryTrack))
                    File.Delete(secondaryTrack);
            }
            
            return ret;
        }

        /// <summary>
        /// Runs the given shell command.
        /// </summary>
        /// <param name="command">Command.</param>
        private static void RunShell(string command)
        {
            Process process = new Process();
            ProcessStartInfo startInfo = new ProcessStartInfo();

            startInfo.FileName = "cmd.exe";
            startInfo.CreateNoWindow = true;
            startInfo.UseShellExecute = false;
            startInfo.RedirectStandardOutput = true;
            startInfo.Arguments = string.Concat("/C ", command);
            startInfo.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;

            process.StartInfo = startInfo;
            
            process.Start();

            process.WaitForExit();
        }
    }
}
