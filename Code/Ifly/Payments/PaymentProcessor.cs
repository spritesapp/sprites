using Ifly.Storage.Repositories;
using iTextSharp.text;
using iTextSharp.text.pdf;
using iTextSharp.tool.xml;
using iTextSharp.tool.xml.html;
using iTextSharp.tool.xml.parser;
using iTextSharp.tool.xml.pipeline.css;
using iTextSharp.tool.xml.pipeline.end;
using iTextSharp.tool.xml.pipeline.html;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;

namespace Ifly.Payments
{
    /// <summary>
    /// Represents payment processor.
    /// </summary>
    public class PaymentProcessor : IPaymentProcessor
    {
        private readonly IRepository<PaymentHistoryEntry> _payments;
        private static readonly CultureInfo _culture;

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        static PaymentProcessor()
        {
            _culture = new CultureInfo("en-US");
        }

        /// <summary>
        /// Initializes a new instance of an object.
        /// </summary>
        public PaymentProcessor()
        {
            _payments = new RavenRepository<PaymentHistoryEntry>();
        }

        /// <summary>
        /// Returns payment history for a given user.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <returns>Payment history.</returns>
        public IEnumerable<PaymentHistoryEntry> GetPaymentHistory(int userId)
        {
            return _payments.Query()
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.Date)
                .ToList();
        }

        /// <summary>
        /// Gets or sets value indicating whether the given user has valid payment for a given subscription.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="options">Payment options.</param>
        /// <returns>Value indicating whether the given user has valid payment for a given subscription.</returns>
        public bool HasValidPayment(int userId, PaymentOptions options)
        {
            bool ret = false;
            PaymentHistoryEntry firstEntry = null;
            var history = this.GetPaymentHistory(userId);

            if (history.Any())
            {
                firstEntry = history.First();

                if (options.Subscription == SubscriptionType.Pro)
                    ret = true;
                else if (options.Subscription == SubscriptionType.Agency)
                    ret = firstEntry.SubscriptionType == SubscriptionType.Agency;
            }

            return ret;
        }

        /// <summary>
        /// Returns the PDF stream of the given receipt.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="receiptId">Receipt Id.</param>
        /// <returns>Stream.</returns>
        public Stream GetReceiptStream(int userId, int receiptId)
        {
            User user = null;
            Stream ret = null;
            XMLWorker worker = null;
            IPipeline pipeline = null;
            XMLParser xmlParse = null;
            string html = string.Empty;
            ICSSResolver cssResolver = null;
            PaymentHistoryEntry receipt = null;
            HtmlPipelineContext htmlContext = null;
            Func<string, string> valueOrDefault = v => !string.IsNullOrWhiteSpace(v) ? v : "-";

            if (userId > 0 && receiptId > 0)
            {
                receipt = _payments.Select(receiptId);

                if (receipt != null && receipt.UserId == userId)
                {
                    user = Resolver.Resolve<IRepository<User>>().Select(receipt.UserId);

                    if (user != null)
                    {
                        using (var stream = Assembly.GetExecutingAssembly()
                            .GetManifestResourceStream("Ifly.Resources.PaymentReceiptTemplate.html"))
                        {
                            using (var reader = new StreamReader(stream))
                                html = reader.ReadToEnd();
                        }

                        if (!string.IsNullOrEmpty(html))
                        {
                            html = Utils.Input.FormatWith(html, new
                            {
                                Date = receipt.Date.ToString("R", _culture),
                                UserName = string.Format("{0} ({1})", valueOrDefault(user.Name), valueOrDefault(user.Email)),
                                CompanyName = valueOrDefault(user.CompanyName),
                                CompanyAddress = valueOrDefault(user.CompanyAddress),
                                SubscriptionType = Enum.GetName(typeof(SubscriptionType), receipt.SubscriptionType),
                                Amount = receipt.Amount.ToString("F"),
                                ChargedTo = valueOrDefault(receipt.ChargedTo),
                                TransactionId = valueOrDefault(receipt.TransactionId)
                            });

                            using (Document doc = new Document(PageSize.A4, 30, 30, 30, 30))
                            {
                                using (var s = new MemoryStream())
                                {
                                    using (var writer = PdfWriter.GetInstance(doc, s))
                                    {
                                        doc.Open();

                                        htmlContext = new HtmlPipelineContext(null);
                                        htmlContext.SetTagFactory(Tags.GetHtmlTagProcessorFactory());

                                        cssResolver = XMLWorkerHelper.GetInstance().GetDefaultCssResolver(false);
                                        pipeline = new CssResolverPipeline(cssResolver, new HtmlPipeline(htmlContext, new PdfWriterPipeline(doc, writer)));
                                        worker = new XMLWorker(pipeline, true);
                                        
                                        xmlParse = new XMLParser(true, worker);
                                        xmlParse.Parse(new StringReader(html));
                                        xmlParse.Flush();

                                        doc.Close();
                                        doc.Dispose();

                                        ret = new MemoryStream(s.ToArray());
                                        ret.Seek(0, SeekOrigin.Begin);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Returns value indicating whether payments are enabled.
        /// </summary>
        /// <returns>Value indicating whether payments are enabled.</returns>
        public bool IsEnabled()
        {
            return string.Compare(System.Configuration.ConfigurationManager.AppSettings["StripeEnabled"], "true", true) == 0;
        }

        /// <summary>
        /// Creates default subscription for a new user.
        /// </summary>
        /// <param name="proposed">Proposed subscription type.</param>
        /// <returns>Default subscription.</returns>
        public UserSubscription CreateDefaultSubscription(SubscriptionType? proposed = null)
        {
            return new UserSubscription()
            {
                RenewedTo = proposed.HasValue ? proposed.Value : SubscriptionType.Basic,
                Renewed = proposed.HasValue && proposed.Value == SubscriptionType.Basic ? DateTime.UtcNow.AddSeconds(-5) : new DateTime(1970, 1, 1)
            };
        }

        /// <summary>
        /// Returns charge amount for a given subscription type.
        /// </summary>
        /// <param name="options">Payment options.</param>
        /// <returns>Charge amount (in cents).</returns>
        public int GetChargeAmount(PaymentOptions options)
        {
            int ret = 0;

            switch (options.Subscription)
            {
                case SubscriptionType.Pro:
                    ret = options.Duration == SubscriptionDuration.OneMonth ? 300 : 2700;
                    break;
                case SubscriptionType.Agency:
                    ret = options.Duration == SubscriptionDuration.OneMonth ? 900 : 8100;
                    break;
                default:
                    ret = 0;
                    break;
            }

            return ret;
        }

        /// <summary>
        /// Tries to create a charge.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="options">Payment options.</param>
        /// <param name="token">Card token.</param>
        /// <param name="description">Charge description.</param>
        /// <exception cref="Ifly.Payments.ChargeException">Occurs when charge is failed.</exception>
        public void TryCreateCharge(int userId, PaymentOptions options, string token, string description)
        {
            User u = null;
            int amount = 0;
            Stripe.StripeCharge charge = null;
            ChargeException.ChargeFailureReason? reason = null;

            if (userId > 0 && !string.IsNullOrEmpty(token) && options.Subscription != SubscriptionType.Basic)
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    u = repo.Select(userId);

                    if (u != null)
                    {
                        try
                        {
                            amount = this.GetChargeAmount(options);

                            if (amount > 0)
                            {
                                charge = new Stripe.StripeChargeService().Create(new Stripe.StripeChargeCreateOptions()
                                {
                                    Amount = amount,
                                    Currency = "usd",
                                    Card = token,
                                    Description = description.IndexOf("{0}") >= 0 ? string.Format(description, (int)(amount / 100)) : description
                                });

                                if (!charge.Paid.HasValue || !charge.Paid.Value)
                                {
                                    OnChargeException(new InvalidOperationException("Charge failed (response from Stripe)."),
                                        userId, options.Subscription, token, u, charge);
                                }
                                else
                                {
                                    if (u.Subscription == null)
                                        u.Subscription = new UserSubscription();

                                    u.Subscription.Renewed = DateTime.UtcNow;
                                    u.Subscription.RenewedTo = options.Subscription;
                                    u.Subscription.RenewedToDuration = options.Duration;

                                    repo.Update(u);

                                    this.CreatePaymentHistoryEntry(u.Id, options, amount, charge.StripeCard != null ? string.Format("{0} (xxxx xxxx xxxx {1})",
                                        charge.StripeCard.Type, charge.StripeCard.Last4) : null, charge.Id, false);
                                }
                            }
                            else
                                reason = ChargeException.ChargeFailureReason.BadRequest;
                        }
                        catch (Exception ex)
                        {
                            OnChargeException(ex, userId, options.Subscription, token, u, charge);
                        }
                    }
                    else
                        reason = ChargeException.ChargeFailureReason.BadRequest;
                }
            }
            else
                reason = ChargeException.ChargeFailureReason.BadRequest;

            if (reason.HasValue)
            {
                OnChargeException(new InvalidOperationException("Charge failed (general failure)."),
                    userId, options.Subscription, token, u, charge, reason.Value);
            }
        }

        /// <summary>
        /// Creates payment history entry.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="options">Payment options.</param>
        /// <param name="amount">Amount.</param>
        /// <param name="chargedTo">Account charged to.</param>
        /// <param name="transactionId">Transaction Id.</param>
        /// <param name="autoUpdateSubscription">Value indicating whether to automatically update user subscription.</param>
        public void CreatePaymentHistoryEntry(
            int userId,
            PaymentOptions options,
            int amount,
            string chargedTo,
            string transactionId,
            bool autoUpdateSubscription)
        {
            User u = null;

            if (autoUpdateSubscription)
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    u = repo.Select(userId);

                    if (u != null)
                    {
                        if (u.Subscription == null)
                            u.Subscription = new UserSubscription();

                        u.Subscription.Renewed = DateTime.UtcNow;
                        u.Subscription.RenewedTo = options.Subscription;
                        u.Subscription.RenewedToDuration = options.Duration;

                        repo.Update(u);
                    }
                }
            }

            var ret = new PaymentHistoryEntry()
            {
                UserId = userId,
                Date = DateTime.UtcNow,
                SubscriptionType = options.Subscription,
                Duration = options.Duration,
                Amount = amount / 100, // In dollars, not in cents
                ChargedTo = chargedTo,
                TransactionId = transactionId
            };

            _payments.Update(ret);

            // Eventual consistency, you know...
            System.Threading.Thread.Sleep(500);
        }

        /// <summary>
        /// Occurs on charge exception.
        /// </summary>
        /// <param name="ex">Exception.</param>
        /// <param name="userId">User Id.</param>
        /// <param name="subscriptionType">subscription type.</param>
        /// <param name="token">Charge token.</param>
        /// <param name="user">User.</param>
        /// <param name="charge">Charge.</param>
        private void OnChargeException(
            Exception ex, 
            int userId, 
            SubscriptionType subscriptionType, 
            string token, 
            User user, 
            Stripe.StripeCharge charge,
            ChargeException.ChargeFailureReason? reason = null)
        {
            StringBuilder chargeFailureDetails = new StringBuilder();
            FileVersionInfo fvi = FileVersionInfo.GetVersionInfo(Assembly.GetExecutingAssembly().Location);

            chargeFailureDetails.AppendLine(ex.Message).AppendLine();
            chargeFailureDetails.AppendLine("------------------------------------------------------------------").AppendLine();
            chargeFailureDetails.AppendLine(string.Format("Subscription type: {0}", Enum.GetName(typeof(SubscriptionType), subscriptionType)));
            chargeFailureDetails.AppendLine(string.Format("Stripe token: {0}", token));
            chargeFailureDetails.AppendLine("------------------------------------------------------------------").AppendLine();

            if (charge != null)
            {
                chargeFailureDetails.AppendLine(string.Format("Charge failure code: {0}", charge.FailureCode));
                chargeFailureDetails.AppendLine(string.Format("Charge failure message: {0}", charge.FailureMessage));
                chargeFailureDetails.AppendLine("------------------------------------------------------------------").AppendLine();
            }

            chargeFailureDetails.AppendLine(string.Format("Version: {0}, User: {1} <{2}>", fvi.FileVersion, user != null ? user.Name : "?", user != null ? user.Email : "?")).AppendLine();
            chargeFailureDetails.AppendLine("------------------------------------------------------------------").AppendLine();
            chargeFailureDetails.AppendLine(ex.StackTrace);

            throw new ChargeException(reason.HasValue ? reason.Value : ChargeException.ChargeFailureReason.InternalError, userId, subscriptionType, user, charge != null ?
                new ChargeException.ChargeInfo(charge.FailureCode, charge.FailureMessage) : null, chargeFailureDetails.ToString());
        }
    }
}
