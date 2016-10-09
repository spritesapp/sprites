using Ifly.QueueService;
using System;
using System.Linq;

namespace Ifly.PaymentService
{
    /// <summary>
    /// Represents payment expiration notifier.
    /// </summary>
    internal class Notifier
    {
        private static bool _isNotifying;
        private static readonly log4net.ILog _log = log4net.LogManager.GetLogger
            (System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);

        /// <summary>
        /// Notifies about expiring payments.
        /// </summary>
        public static void NotifyAboutExpiringPayments()
        {
            DateTime dtCheck = DateTime.UtcNow.AddMonths(-1).AddDays(2), prevDay = dtCheck.AddDays(-1),
                dtCheckYear = DateTime.UtcNow.AddYears(-1).AddDays(14), prevDayYear = dtCheckYear.AddDays(-1),
                dtStart = new DateTime(prevDay.Year, prevDay.Month, prevDay.Day, 23, 59, 59, DateTimeKind.Utc),
                dtEnd = new DateTime(dtCheck.Year, dtCheck.Month, dtCheck.Day, 23, 59, 59, DateTimeKind.Utc),
                dtStartYear = new DateTime(prevDayYear.Year, prevDayYear.Month, prevDayYear.Day, 23, 59, 59, DateTimeKind.Utc),
                dtEndYear = new DateTime(dtCheckYear.Year, dtCheckYear.Month, dtCheckYear.Day, 23, 59, 59, DateTimeKind.Utc);

            Func<string, string> valueOrDefault = v => !string.IsNullOrWhiteSpace(v) ? v : "-";

            if (!_isNotifying)
            {
                _isNotifying = true;

                try
                {
                    using (var repository = new Storage.Repositories.RavenRepository<User>())
                    {
                        foreach (var u in repository.Query().Where(u => u.Email != null && 
                            u.Subscription != null &&
                            u.Subscription.RenewedToDuration == SubscriptionDuration.OneMonth &&
                            (
                                u.Subscription.RenewedTo != SubscriptionType.Basic &&
                                u.Subscription.Renewed >= dtStart &&
                                u.Subscription.Renewed <= dtEnd
                            ) ||
                            u.Subscription.RenewedToDuration == SubscriptionDuration.OneYear &&
                            (
                                u.Subscription.RenewedTo != SubscriptionType.Basic &&
                                u.Subscription.Renewed >= dtStartYear &&
                                u.Subscription.Renewed <= dtEndYear
                            )
                        ))
                        {
                            if (!string.IsNullOrEmpty(u.Email) && u.Email.IndexOf('@') > 0)
                            {
                                MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                                {
                                    Id = Guid.NewGuid().ToString(),
                                    Subject = Ifly.Resources.Frontpage.Email_SubscriptionExpiring_Subject,
                                    Body = new GenericMessageBody
                                    (
                                        new Tuple<string, string>("Recipient", u.Email), 
                                        new Tuple<string, string>("Body", string.Format(Ifly.Resources.Frontpage.Email_SubscriptionExpiring_Body, 
                                            string.Format("{0} ({1})", valueOrDefault(u.Name), valueOrDefault(u.Email))))
                                    ).ToString()
                                }});
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _log.Error("Failed to notify about expiring subscriptions.", ex);
                }

                _isNotifying = false;
            }
        }
    }
}
