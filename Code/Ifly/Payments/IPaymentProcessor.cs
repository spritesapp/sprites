using System.Collections.Generic;

namespace Ifly.Payments
{
    /// <summary>
    /// Represents payment processor.
    /// </summary>
    public interface IPaymentProcessor : IDependency
    {
        /// <summary>
        /// Tries to create a charge.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="options">Payment options.</param>
        /// <param name="token">Card token.</param>
        /// <param name="description">Charge description.</param>
        /// <exception cref="Ifly.Payments.ChargeException">Occurs when charge is failed.</exception>
        void TryCreateCharge(int userId, PaymentOptions options, string token, string description);

        /// <summary>
        /// Returns payment history for a given user.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <returns>Payment history.</returns>
        IEnumerable<PaymentHistoryEntry> GetPaymentHistory(int userId);

        /// <summary>
        /// Gets or sets value indicating whether the given user has valid payment for a given subscription.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="options">Payment options.</param>
        /// <returns>Value indicating whether the given user has valid payment for a given subscription.</returns>
        bool HasValidPayment(int userId, PaymentOptions options);

        /// <summary>
        /// Returns the PDF stream of the given receipt.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="receiptId">Receipt Id.</param>
        /// <returns>Stream.</returns>
        System.IO.Stream GetReceiptStream(int userId, int receiptId);

        /// <summary>
        /// Creates default subscription for a new user.
        /// </summary>
        /// <param name="proposed">Proposed subscription type.</param>
        /// <returns>Default subscription.</returns>
        UserSubscription CreateDefaultSubscription(SubscriptionType? proposed = null);

        /// <summary>
        /// Returns value indicating whether payments are enabled.
        /// </summary>
        /// <returns>Value indicating whether payments are enabled.</returns>
        bool IsEnabled();

        /// <summary>
        /// Returns charge amount for a given subscription type.
        /// </summary>
        /// <param name="options">Payment options.</param>
        /// <returns>Charge amount (in cents).</returns>
        int GetChargeAmount(PaymentOptions options);

        /// <summary>
        /// Creates payment history entry.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="options">Payment options.</param>
        /// <param name="amount">Amount.</param>
        /// <param name="chargedTo">Account charged to.</param>
        /// <param name="transactionId">Transaction Id.</param>
        /// <param name="autoUpdateSubscription">Value indicating whether to automatically update user subscription.</param>
        void CreatePaymentHistoryEntry(int userId, PaymentOptions options, int amount, string chargedTo, string transactionId, bool autoUpdateSubscription);
    }
}
