namespace Ifly.Utils.Associator
{
    /// <summary>
    /// Represents value unit.
    /// </summary>
    public enum ValueUnit
    {
        /// <summary>
        /// Centimeters.
        /// </summary>
        Centimeters = 1,

        /// <summary>
        /// Meters.
        /// </summary>
        Meters = 2,

        /// <summary>
        /// Kilometers.
        /// </summary>
        Kilometers = 3,

        /// <summary>
        /// Grams.
        /// </summary>
        Grams = 4,

        /// <summary>
        /// Kilograms.
        /// </summary>
        Kilograms = 5,

        /// <summary>
        /// Tons.
        /// </summary>
        Tons = 6
    }

    /// <summary>
    /// Represents a unit convereter.
    /// </summary>
    public static class UnitConverter
    {
        /// <summary>
        /// Returns a user-friendly explanation of a given value.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <param name="unit">Value unit.</param>
        /// <returns>User-friendly explanation.</returns>
        public static string Explain(double value, ValueUnit unit)
        {
            string unitString = System.Enum.GetName(typeof(ValueUnit), unit).ToLowerInvariant();

            if (value.ToString().EndsWith("1"))
                unitString = unitString.Substring(0, unitString.Length - 1);

            return string.Format("{0} {1}", value.ToString(), unitString);
        }
    }
}
