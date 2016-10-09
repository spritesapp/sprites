using System;

namespace Ifly.Payments
{
    /// <summary>
    /// Represents payment history entry.
    /// </summary>
    public class PaymentHistoryEntry : Storage.Record
    {
        /// <summary>
        /// Gets or sets the user Id.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Gets or sets the date and time of the payment.
        /// </summary>
        public DateTime Date { get; set; }

        /// <summary>
        /// Gets or sets the subscription type.
        /// </summary>
        public SubscriptionType SubscriptionType { get; set; }

        /// <summary>
        /// Gets or sets subscription duration.
        /// </summary>
        public SubscriptionDuration Duration { get; set; }

        /// <summary>
        /// Gets or sets the 
        /// </summary>
        public double Amount { get; set; }

        /// <summary>
        /// Gets or sets the account charted to.
        /// </summary>
        public string ChargedTo { get; set; }

        /// <summary>
        /// Gets or sets the transaction Id.
        /// </summary>
        public string TransactionId { get; set; }
    }
}
