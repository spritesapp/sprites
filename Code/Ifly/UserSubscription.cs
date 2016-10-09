using System;

namespace Ifly
{
    /// <summary>
    /// Represents a subscription type.
    /// </summary>
    public enum SubscriptionType
    {
        /// <summary>
        /// Basic.
        /// </summary>
        Basic = 0,

        /// <summary>
        /// Pro.
        /// </summary>
        Pro = 1,

        /// <summary>
        /// Agency.
        /// </summary>
        Agency = 2 
    }

    /// <summary>
    /// Represents subscription duration.
    /// </summary>
    public enum SubscriptionDuration
    {
        /// <summary>
        /// One month.
        /// </summary>
        OneMonth = 0,

        /// <summary>
        /// One year.
        /// </summary>
        OneYear = 1
    }

    /// <summary>
    /// Represents user subscription.
    /// </summary>
    public class UserSubscription
    {
        /// <summary>
        /// Gets or sets the subscription type.
        /// </summary>
        public SubscriptionType RenewedTo { get; set; }

        /// <summary>
        /// Gets or sets the subscription duration.
        /// </summary>
        public SubscriptionDuration RenewedToDuration { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the user subscription was renewed.
        /// </summary>
        public DateTime Renewed { get; set; }

        /// <summary>
        /// Gets the current subscription type.
        /// </summary>
        public SubscriptionType Type
        {
            get
            {
                return RenewedTo != SubscriptionType.Basic ?
                    (!HasExpired ? RenewedTo : SubscriptionType.Basic)
                    : SubscriptionType.Basic;
            }
        }

        /// <summary>
        /// Gets value indicating whether user subscription is expiring.
        /// </summary>
        public bool IsExpiring
        {
            get
            {
                int upper = 20;
                Lazy<double> daysSinceRenewed = new Lazy<double>(() => DateTime.UtcNow.Subtract(Renewed).TotalDays);

                if (RenewedToDuration == SubscriptionDuration.OneYear)
                    upper = 340;

                return RenewedTo != SubscriptionType.Basic && daysSinceRenewed.Value >= upper;
            }
        }

        /// <summary>
        /// Gets value indicating whether user subscription has expired.
        /// </summary>
        public bool HasExpired
        {
            get
            {
                int upper = 31;
                Lazy<double> daysSinceRenewed = new Lazy<double>(() => DateTime.UtcNow.Subtract(Renewed).TotalDays);

                if (RenewedToDuration == SubscriptionDuration.OneYear)
                    upper = 365;

                return RenewedTo != SubscriptionType.Basic ? (daysSinceRenewed.Value > upper) : false;
            }
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public UserSubscription()
        {
            RenewedTo = SubscriptionType.Basic;
            RenewedToDuration = SubscriptionDuration.OneMonth;
            Renewed = new DateTime(2013, 8, 1);
        }
    }
}
