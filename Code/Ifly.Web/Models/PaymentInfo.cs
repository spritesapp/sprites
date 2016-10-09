using System.Collections.Generic;

namespace Ifly.Web.Models
{
    /// <summary>
    /// Represents payment info set.
    /// </summary>
    public class PaymentInfoSet
    {
        /// <summary>
        /// Gets or sets the info list.
        /// </summary>
        public List<PaymentInfo> Info { get; set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public PaymentInfoSet()
        {
            this.Info = new List<PaymentInfo>();
        }
    }

    /// <summary>
    /// Represents payment information.
    /// </summary>
    public class PaymentInfo
    {
        /// <summary>
        /// Gets or sets user Id.
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Gets or sets subscription duration.
        /// </summary>
        public SubscriptionDuration Duration { get; set; }

        /// <summary>
        /// Gets or sets subscription type.
        /// </summary>
        public SubscriptionType SubscriptionType { get; set; }

        /// <summary>
        /// Gets or sets value indicating whether payment is required.
        /// </summary>
        public bool RequiresPayment { get; set; }

        /// <summary>
        /// Gets or sets the description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or sets the amount (with cents).
        /// </summary>
        public int Amount { get; set; }
    }
}