using System;

namespace Ifly.Payments
{
    /// <summary>
    /// Represents charge exception.
    /// </summary>
    public class ChargeException : Exception
    {
        /// <summary>
        /// Represents failure reason.
        /// </summary>
        public enum ChargeFailureReason
        {
            /// <summary>
            /// Bad request.
            /// </summary>
            BadRequest = 0,

            /// <summary>
            /// Internal error.
            /// </summary>
            InternalError = 1
        }

        /// <summary>
        /// Represents charge info. This class cannot be inherited.
        /// </summary>
        public sealed class ChargeInfo
        {
            /// <summary>
            /// Gets the failure code.
            /// </summary>
            public string FailureCode { get; private set; }

            /// <summary>
            /// Gets the failure description.
            /// </summary>
            public string FailureDescription { get; private set; }

            /// <summary>
            /// Initializes a new instance of an object.
            /// </summary>
            /// <param name="failureCode">Failure code.</param>
            /// <param name="failureDescription">Failure description.</param>
            public ChargeInfo(string failureCode, string failureDescription)
            {
                this.FailureCode = failureCode;
                this.FailureDescription = failureDescription;
            }
        }

        /// <summary>
        /// Gets the failure reason.
        /// </summary>
        public ChargeFailureReason Reason { get; private set; }

        /// <summary>
        /// Gets the charge info.
        /// </summary>
        public ChargeInfo Charge { get; private set; }

        /// <summary>
        /// Gets the subscription type.
        /// </summary>
        public SubscriptionType SubscriptionType { get; private set; }

        /// <summary>
        /// Gets the user Id.
        /// </summary>
        public int UserId { get; private set; }

        /// <summary>
        /// Gets the user.
        /// </summary>
        public User User { get; private set; }

        /// <summary>
        /// Gets or sets the detailed exception diagnostics data.
        /// </summary>
        public string DiagnosticsData { get; private set; }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        /// <param name="reason">Failure reason.</param>
        /// <param name="userId">User Id.</param>
        /// <param name="subscriptionType"></param>
        /// <param name="user"></param>
        /// <param name="charge"></param>
        public ChargeException(
            ChargeFailureReason reason, 
            int userId, 
            SubscriptionType subscriptionType, 
            User user, 
            ChargeInfo charge,
            string diagnosticsData) : base("Card charge failed.")
        {
            this.Reason = reason;
            this.UserId = userId;
            this.SubscriptionType = subscriptionType;
            this.User = user;
            this.Charge = charge;
            this.DiagnosticsData = diagnosticsData;
        }
    }
}
