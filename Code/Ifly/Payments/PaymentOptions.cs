namespace Ifly.Payments
{
    /// <summary>
    /// Represents payment options.
    /// </summary>
    public class PaymentOptions
    {
        /// <summary>
        /// Gets or sets subscription type.
        /// </summary>
        public SubscriptionType Subscription { get; set; }

        /// <summary>
        /// Gets or sets subscription duration.
        /// </summary>
        public SubscriptionDuration Duration { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="subscription">Subscription.</param>
        public PaymentOptions(UserSubscription subscription) : this(subscription.RenewedTo, subscription.RenewedToDuration) { }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="subscription">Subscription type.</param>
        public PaymentOptions(SubscriptionType subscription) : this(subscription, SubscriptionDuration.OneMonth) { }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="subscription">Subscription type.</param>
        /// <param name="duration">Subscription duration.</param>
        public PaymentOptions(SubscriptionType subscription, SubscriptionDuration duration)
        {
            this.Subscription = subscription;
            this.Duration = duration;
        }
    }
}
