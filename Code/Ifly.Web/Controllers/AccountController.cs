using DotNetOpenAuth.AspNet;
using Ifly.QueueService;
using Ifly.Storage.Repositories;
using Ifly.Utils;
using Ifly.Web.Models;
using Microsoft.Owin.Security;
using Microsoft.Web.WebPages.OAuth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Web.Security;
using Microsoft.Owin.Host.SystemWeb;
using System.Web;
using Microsoft.AspNet.Identity;
using System.Security.Claims;

namespace Ifly.Web.Controllers
{
    /// <summary>
    /// Represents an account controller.
    /// </summary>
    [Authorize]
    public class AccountController : Controller
    {
        /// <summary>
        /// Represents Google Sign In challenge result.
        /// </summary>
        private class GoogleSignInChallengeResult : HttpUnauthorizedResult
        {
            /// <summary>
            /// Gets or sets the return URL.
            /// </summary>
            public string ReturnUrl { get; set; }

            /// <summary>
            /// Initializes a new instance of an object.
            /// </summary>
            /// <param name="returnUrl">Return URL.</param>
            public GoogleSignInChallengeResult(string returnUrl)
            {
                ReturnUrl = returnUrl;
            }

            /// <summary>
            /// Executes result.
            /// </summary>
            /// <param name="context">Context.</param>
            public override void ExecuteResult(ControllerContext context)
            {
                context.HttpContext.GetOwinContext().Authentication.Challenge(new AuthenticationProperties { RedirectUri = ReturnUrl }, "Google");

                System.Web.HttpContext.Current.Response.SuppressFormsAuthenticationRedirect = true;
            }
        }

        /// <summary>
        /// Gets the return URL.
        /// </summary>
        public string ReturnUrl
        {
            get 
            {
                return new System.Func<string, string>(url => { 
                    return string.IsNullOrEmpty(url) ? null : url; 
                }).Invoke(Request["ReturnUrl"]); 
            }
        }

        /// <summary>
        /// Serves the default content.
        /// </summary>
        /// <returns>View.</returns>
        [AllowAnonymous]
        public ActionResult Login()
        {
            return View();
        }

        /// <summary>
        /// Starts the login procedure.
        /// </summary>
        /// <param name="provider">Provider.</param>
        [AllowAnonymous]
        [HttpPost]
        public ActionResult Login([System.Web.Http.FromBody]string provider)
        {
            ActionResult ret = null;
            string authCallback = string.Empty;

            if (!string.IsNullOrEmpty(Request.Form["LoginWithPassword"]))
                LoginWithPassword(new UserPasswordLoginModel() { Email = Request.Form["LoginWithPassword.Email"], Password = Request.Form["LoginWithPassword.Password"] });
            else if (!string.IsNullOrEmpty(Request.Form["ResetPassword"]))
                ResetPassword(new UserResetPasswordModel() { Email = Request.Form["LoginWithPassword.Email"] });
            else if (!string.IsNullOrEmpty(provider))
            {
                // For demo users we're simply letting them in with demo credentials.
                if (string.Compare(provider, "demo", System.StringComparison.OrdinalIgnoreCase) == 0)
                {
                    System.Web.HttpContext.Current.User = Utils.DemoPrincipal.CreateDemoPrincipal();
                    OnUserAuthenticated(Utils.DemoPrincipal.CreateDemoUser(), provider, System.Web.HttpContext.Current.User.Identity.Name);

                    System.Web.HttpContext.Current.Response.Redirect("/edit");
                }
                else
                {
                    authCallback = string.Format("{0}?ReturnUrl={1}&provider={2}",
                            Url.Action("Authenticated"), Server.UrlEncode(ReturnUrl), Server.UrlEncode(provider));

                    if (string.Compare(provider, "google", true) == 0)
                        ret = new GoogleSignInChallengeResult(authCallback);
                    else
                        OAuthWebSecurity.RequestAuthentication(provider, authCallback);
                }
            }

            return ret;
        }

        /// <summary>
        /// Performs a sign-up process.
        /// </summary>
        /// <param name="model">Model.</param>
        /// <returns>User Id.</returns>
        [AllowAnonymous]
        [HttpPost]
        public int SignUp([System.Web.Http.FromBody]UserSignUpModel model)
        {
            int ret = -1;
            User u = null;

            if (model != null && !string.IsNullOrEmpty(model.Email) && !string.IsNullOrEmpty(model.Password))
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    // External Id matches the user's email (otherwise we might select the wrong user).
                    u = repo.SelectByExternalId(model.Email);

                    if (u != null)
                        throw new System.Web.HttpException((int)System.Net.HttpStatusCode.Conflict, "Conflict");
                    else
                    {
                        u = new User();

                        u.Created = System.DateTime.UtcNow;
                        u.Name = model.Name ?? model.Email;
                        u.ExternalId = model.Email;
                        u.Email = model.Email;

                        u.Subscription = Resolver.Resolve<Payments.IPaymentProcessor>().CreateDefaultSubscription(model.SignUpSubscriptionType);

                        u.Password = new UserPasswordDetails();
                        u.Password.Hash = Crypto.GetHash(model.Password);
                        u.Password.ConfirmToken = Crypto.GetHash(Guid.NewGuid().ToString());

                        u = repo.Update(u);
                        ret = u.Id;

                        MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                        {
                            Id = Guid.NewGuid().ToString(),
                            Subject = Ifly.Resources.Frontpage.Email_ValidateEmail_Subject,
                            Body = new GenericMessageBody
                            (
                                new Tuple<string, string>("Recipient", model.Email), 
                                new Tuple<string, string>("Body", string.Format(Ifly.Resources.Frontpage.Email_ValidateEmail_Body, string.Format("{0}://{1}/validate-email?email={2}&token={3}", 
                                    Request.Url.Scheme, Request.Url.Authority, Server.UrlEncode(model.Email), u.Password.ConfirmToken)))
                            ).ToString()
                        }});
                    }
                }
            }
            else
                throw new System.Web.HttpException((int)System.Net.HttpStatusCode.BadRequest, "Bad request");

            return ret;
        }

        /// <summary>
        /// Starts the password-based login procedure.
        /// </summary>
        /// <param name="model">Login model.</param>
        /// <returns>User Id in case the user was logged in successfully.</returns>
        [AllowAnonymous]
        [HttpPost]
        public int LoginWithPassword([System.Web.Http.FromBody]UserPasswordLoginModel model)
        {
            int ret = -1;
            User u = null;

            if (model != null && !string.IsNullOrEmpty(model.Email) && !string.IsNullOrEmpty(model.Password))
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    // External Id matches the user's email (otherwise we might select the wrong user).
                    u = repo.SelectByExternalId(model.Email);

                    if (u != null && u.Password != null && !string.IsNullOrEmpty(u.Password.Hash) && string.IsNullOrEmpty(u.Password.ConfirmToken))
                    {
                        if (string.Compare(u.Password.Hash, Utils.Crypto.GetHash(model.Password), false) == 0)
                            ret = u.Id;
                    }
                }

                if (ret <= 0)
                    throw new System.Web.HttpException((int)System.Net.HttpStatusCode.Unauthorized, "Unauthorized");
            }
            else
                throw new System.Web.HttpException((int)System.Net.HttpStatusCode.BadRequest, "Bad request");

            if (ret > 0)
                OnUserAuthenticated(u, string.Empty);

            return ret;
        }

        /// <summary>
        /// Sends out password reset email.
        /// </summary>
        /// <param name="model">Model.</param>
        /// <returns>User Id.</returns>
        [AllowAnonymous]
        [HttpPost]
        public int ResetPassword([System.Web.Http.FromBody]UserResetPasswordModel model)
        {
            int ret = -1;
            User u = null;
            string resetToken = string.Empty;

            if (model != null && !string.IsNullOrEmpty(model.Email))
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    u = repo.SelectByExternalId(model.Email);

                    if (u != null)
                    {
                        if (u.Password == null)
                            u.Password = new UserPasswordDetails();

                        resetToken = u.Password.ResetToken = Utils.Crypto.GetHash(Guid.NewGuid().ToString());
                        u.Password.ConfirmToken = string.Empty;

                        repo.Update(u);

                        MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                        {
                            Id = Guid.NewGuid().ToString(),
                            Subject = Ifly.Resources.Frontpage.Email_PasswordReset_Subject,
                            Body = new GenericMessageBody
                            (
                                new Tuple<string, string>("Recipient", model.Email), 
                                new Tuple<string, string>("Body", string.Format(Ifly.Resources.Frontpage.Email_PasswordReset_Body, string.Format("{0}://{1}/change-password?email={2}&token={3}", 
                                    Request.Url.Scheme, Request.Url.Authority, Server.UrlEncode(model.Email), resetToken)))
                            ).ToString()
                        }});
                    }
                    else
                        throw new System.Web.HttpException((int)System.Net.HttpStatusCode.NotFound, "Not found");
                }
            }
            else
                throw new System.Web.HttpException((int)System.Net.HttpStatusCode.BadRequest, "Bad request");

            return ret;
        }

        /// <summary>
        /// Changes user password.
        /// </summary>
        /// <param name="email">Email.</param>
        /// <param name="token">Token.</param>
        /// <returns>User Id.</returns>
        [AllowAnonymous]
        public ActionResult ChangePassword(string email, string token)
        {
            User u = null;
            ActionResult ret = null;

            if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(token))
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    u = repo.SelectByExternalId(email);

                    if (u != null && u.Password != null && !string.IsNullOrEmpty(u.Password.ResetToken))
                    {
                        if (string.Compare(u.Password.ResetToken, token, false) == 0)
                        {
                            u.Password.Hash = string.Empty;
                            u.Password.ResetToken = string.Empty;

                            u = repo.Update(u);

                            OnUserAuthenticated(u, string.Empty);
                            ret = Redirect("/account?changepassword=1");
                        }
                    }
                }
            }
            else
                throw new System.Web.HttpException((int)System.Net.HttpStatusCode.BadRequest, "Bad request");

            if (ret == null)
                ret = Redirect(string.Format("/login?info=w:{0}", Server.UrlEncode(Ifly.Resources.Frontpage.Info_ResetTokenExpired)));

            return ret;
        }

        /// <summary>
        /// Validates the token.
        /// </summary>
        /// <param name="email">Email address.</param>
        /// <param name="token">Token.</param>
        /// <returns>Action result.</returns>
        [AllowAnonymous]
        [HttpGet]
        public ActionResult ConfirmEmail(string email, string token)
        {
            User u = null;
            ActionResult ret = null;

            if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(token))
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    u = repo.SelectByExternalId(email);

                    if (u != null && u.Password != null && !string.IsNullOrEmpty(u.Password.ConfirmToken))
                    {
                        if (string.Compare(u.Password.ConfirmToken, token, false) == 0)
                        {
                            u.Password.ConfirmToken = string.Empty;

                            u = repo.Update(u);
                        }
                    }

                    ret = Redirect("/login");
                }

                if (ret == null)
                    throw new System.Web.HttpException((int)System.Net.HttpStatusCode.Unauthorized, "Unauthorized");
            }
            else
                throw new System.Web.HttpException((int)System.Net.HttpStatusCode.BadRequest, "Bad request");

            return ret;
        }

        /// <summary>
        /// Validates the token.
        /// </summary>
        /// <param name="email">Email address.</param>
        /// <param name="token">Token.</param>
        /// <returns>Action result.</returns>
        [HttpGet]
        public ActionResult ConfirmPresentationSharing(string email, string token)
        {
            User u = null;
            ActionResult ret = null;
            PresentationSharing sharing = null;

            if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(token))
            {
                using (var repo = Resolver.Resolve<IPresentationSharingRepository>())
                {
                    u = Ifly.ApplicationContext.Current.User;

                    sharing = repo.Query().Where(s => s.UserInviteEmail == email && s.UserInviteKey == token)
                        .FirstOrDefault();

                    if (sharing != null)
                    {
                        if (u != null && u.Id > 0)
                        {
                            if (u.Subscription != null && u.Subscription.Type == SubscriptionType.Agency)
                            {
                                if (sharing.UserId <= 0)
                                {
                                    sharing.UserId = u.Id;
                                    sharing.UserInviteKey = null;

                                    repo.Update(sharing);

                                    // Eventual consistency my ass...
                                    System.Threading.Thread.Sleep(2000);
                                }

                                ret = Redirect(string.Format("/edit/{0}", sharing.PresentationId));
                            }
                            else
                                ret = Redirect(string.Format("/login?info=w:{0}", Server.UrlEncode(Ifly.Resources.Frontpage.Info_RequiresAgency)));
                        }
                    }
                    else if (u != null && u.Id > 0)
                    {
                        sharing = repo.Query().Where(s => s.UserInviteEmail == email && s.UserId == u.Id)
                            .FirstOrDefault();

                        if (sharing != null)
                            ret = Redirect(string.Format("/edit/{0}", sharing.PresentationId));
                    }
                }

                if (ret == null)
                {
                    ret = Redirect(string.Format("/login?ReturnUrl={0}", Server.UrlEncode(string.Format("/confirm-sharing?email={0}&token={1}",
                        Server.UrlEncode(email), Server.UrlEncode(token)))));
                }
            }
            else
                throw new System.Web.HttpException((int)System.Net.HttpStatusCode.BadRequest, "Bad request");

            return ret;
        }

        /// <summary>
        /// Logs the user out of the system.
        /// </summary>
        /// <returns>Action result.</returns>
        public ActionResult Logout()
        {
            FormsAuthentication.SignOut();
            HttpContext.GetOwinContext().Authentication.SignOut(DefaultAuthenticationTypes.ExternalCookie);

            return RedirectToAction("Index", "Home");
        }

        /// <summary>
        /// Downloads the receipt.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="receiptId">Receipt Id.</param>
        /// <returns>Receipt.</returns>
        [HttpGet]
        public ActionResult Receipt(int userId, int receiptId)
        {
            ActionResult ret = null;
            System.IO.Stream pdf = null;

            if (userId > 0 && receiptId > 0 && userId == ApplicationContext.Current.User.Id)
            {
                pdf = Resolver.Resolve<Payments.IPaymentProcessor>().GetReceiptStream(userId, receiptId);

                if (pdf != null)
                    ret = File(pdf, "application/pdf", string.Format("sprites-receipt-{0}-{1}.pdf", userId, receiptId));
            }

            if (ret == null)
                ret = HttpNotFound();

            return ret;
        }

        /// <summary>
        /// Called by external service when authentication process finishes.
        /// </summary>
        /// <returns></returns>
        [AllowAnonymous]
        public ActionResult Authenticated(string provider)
        {
            User user = null;
            ActionResult ret = null;
            AuthenticationResult result = null;

            Func<string, string> getClaimShortName = (claimName) =>
                {
                    var parts = claimName.Split(new char[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
                    return parts.Length > 0 ? parts[parts.Length - 1] : claimName;
                };

            Action<string, string, IDictionary<string, string>, string> readyToQueryUserAndSignIn = (signedWithProvider, externalUserId, fields, userName) =>
                {
                    user = EnsureUser(string.Format("{0}/{1}", signedWithProvider, externalUserId), fields, userName);

                    if (user != null)
                        OnUserAuthenticated(user, provider);
                };

            if (string.Compare(provider ?? string.Empty, "google", true) != 0)
            {
                result = OAuthWebSecurity.VerifyAuthentication();

                if (result.IsSuccessful)
                    readyToQueryUserAndSignIn(result.Provider, result.ProviderUserId, result.ExtraData, result.UserName);
            }
            else
            {
                var loginInfo = HttpContext.GetOwinContext().Authentication.GetExternalLoginInfo();
                
                if (loginInfo != null)
                {
                    readyToQueryUserAndSignIn(loginInfo.Login.LoginProvider, loginInfo.ExternalIdentity.GetUserId(),
                        loginInfo.ExternalIdentity.Claims.ToDictionary(claim => getClaimShortName(claim.Type.ToLowerInvariant()), claim => claim.Value), loginInfo.DefaultUserName);
                }
            }

            // This is, in fact, has no effect - action is callbed by OAuth provider and redirect URL is handled by it as well.
            ret = ReturnUrl == null ?
                (ActionResult)Redirect("/edit") :
                Redirect(ReturnUrl);

            return ret;
        }

        /// <summary>
        /// Fired when the charge is ready to be made.
        /// </summary>
        /// <returns>Action result.</returns>
        [HttpPost]
        public ActionResult ReadyToCharge()
        {
            Ifly.Payments.PaymentOptions options = null;
            SubscriptionType subscriptionType = SubscriptionType.Basic;
            string stripeToken = string.Empty, errorCode = string.Empty;
            SubscriptionDuration duration = SubscriptionDuration.OneMonth;

            if (Enum.TryParse<SubscriptionType>(Request["SubscriptionType"], out subscriptionType) && !string.IsNullOrEmpty(stripeToken = Request["stripeToken"]))
            {
                Enum.TryParse<SubscriptionDuration>(Request["Duration"], out duration);

                options = new Ifly.Payments.PaymentOptions(subscriptionType, duration);

                try
                {
                    Resolver.Resolve<Payments.IPaymentProcessor>().TryCreateCharge(Ifly.ApplicationContext.Current.User.Id,
                        options, stripeToken, GetChargeDescription(options, null));

                    // Updating subscription type for all user presentations.
                    UpdatePresentationSubscriptionType(Ifly.ApplicationContext.Current.User.Id, subscriptionType);
                }
                catch (Ifly.Payments.ChargeException ex)
                {
                    errorCode = Enum.GetName(typeof(Ifly.Payments.ChargeException.ChargeFailureReason), ex.Reason);

                    Logging.Logger.Current.Write(ex.DiagnosticsData.ToString(), Logging.MessageLevel.Error);

                    MessageQueueManager.Current.GetQueue(MessageQueueType.Email).AddMessages(new Message[] { new Message()
                    {
                        Id = Guid.NewGuid().ToString(),
                        Subject = string.Format("Charge failed ({0})", Guid.NewGuid()),
                        Body = ex.DiagnosticsData.ToString()
                    }});
                }
            }

            return Redirect(string.Concat("/account", !string.IsNullOrEmpty(errorCode) ? 
                string.Format("?payment:error={0}", errorCode) : "?payment:success=1"));
        }

        /// <summary>
        /// Returns user account details.
        /// </summary>
        /// <returns>Action result.</returns>
        public ActionResult Details()
        {
            ActionResult ret = null;

            if (DemoPrincipal.IsDemo(HttpContext.User))
                ret = new HttpStatusCodeResult(System.Net.HttpStatusCode.Unauthorized);
            else
                ret = View(new Models.UserAccountDetailsModel() { User = ApplicationContext.Current.User });

            return ret;
        }

        /// <summary>
        /// Validates user email.
        /// </summary>
        /// <param name="model">Validation model.</param>
        /// <returns>Value indicating whether email is valid.</returns>
        [HttpPost]
        public ActionResult ValidateEmail(UserEmailValidationModel model)
        {
            bool isUnique = false;
            string email = model.Email.ToLowerInvariant();
            int userId = ApplicationContext.Current.User.Id;

            if (model != null && !string.IsNullOrWhiteSpace(model.Email))
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                    isUnique = !repo.Query().Where(u => u.Email == email && u.Id != userId).Any();
            }
            
            return Content(isUnique.ToString().ToLowerInvariant(), "text/plain");
        }


        /// <summary>
        /// Updates user account details.
        /// </summary>
        /// <param name="details">User account details.</param>
        /// <returns>Value indicating whether payment is required.</returns>
        [HttpPost]
        public ActionResult Details(UserAccountUpdateModel details)
        {
            User u = null;
            PaymentInfoSet ret = null;
            Tuple<bool, PaymentInfoSet> paymentInfo = null;

            if (details != null)
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                {
                    u = repo.Select(ApplicationContext.Current.User.Id);

                    if (u != null)
                    {
                        u.Name = details.Name;
                        u.Email = details.Email;
                        u.CompanyName = details.CompanyName;
                        u.CompanyAddress = details.CompanyAddress;

                        if (u.Subscription == null)
                            u.Subscription = new UserSubscription();

                        u.Subscription.RenewedTo = details.SubscriptionType;

                        if (!string.IsNullOrEmpty(details.Password))
                        {
                            if (u.Password == null)
                                u.Password = new UserPasswordDetails();

                            u.Password.Hash = Crypto.GetHash(details.Password);
                            u.Password.ResetToken = string.Empty;
                        }

                        paymentInfo = GetPaymentInformationInternal(u);

                        // This won't allow the user to use the tool before he submits a payment.
                        if (paymentInfo.Item1)
                            u.Subscription.Renewed = DateTime.UtcNow.AddYears(-2);

                        repo.Update(u);

                        if (paymentInfo.Item1)
                            ret = paymentInfo.Item2;

                        // Updating subscription type for all user presentations.
                        UpdatePresentationSubscriptionType(u.Id, u.Subscription.Type);
                    }
                }
            }

            return Json(ret);
        }

        /// <summary>
        /// Returns payment information.
        /// </summary>
        /// <returns>Payment information.</returns>
        [HttpPost]
        public ActionResult GetPaymentInformation()
        {
            return Json(GetPaymentInformationInternal().Item2);
        }

        /// <summary>
        /// Occurs when PayPal payment has been applied.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="subscriptionType">Subscription type.</param>
        /// <param name="amount">Amount.</param>
        /// <returns>Action result.</returns>
        [HttpPost]
        [AllowAnonymous]
        public ActionResult OnPayPalPaymentApplied(int? userId = null,  SubscriptionType? subscriptionType = null, SubscriptionDuration? duration = null, int? amount = null)
        {
            if (userId != null && userId.HasValue && subscriptionType != null && subscriptionType.HasValue && amount != null && amount.HasValue)
            {
                Resolver.Resolve<Payments.IPaymentProcessor>().CreatePaymentHistoryEntry(userId.Value, new Ifly.Payments.PaymentOptions(subscriptionType.Value, duration.Value), amount.Value,
                    Ifly.Resources.Frontpage.Payment_ChargedToPayPal, Request.Form["txn_id"], true);

                // Updating subscription type for all user presentations.
                UpdatePresentationSubscriptionType(userId.Value, subscriptionType.Value);
            }

            return new HttpStatusCodeResult(System.Net.HttpStatusCode.OK);
        }

        /// <summary>
        /// Subscribes to newsletter.
        /// </summary>
        /// <param name="email">Email address.</param>
        /// <returns>Action result.</returns>
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult> SubscribeToNewsletter(string email)
        {
            try
            {
                await new External.MailChimp.MailChimpClient().SubscribeToList(External.MailChimp.MailChimpList.Sprites, email);
            }
            catch { }

            return new HttpStatusCodeResult(System.Net.HttpStatusCode.Created);
        }

        /// <summary>
        /// Updates subscription type on all presentations belonging to the given user.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <param name="subscriptionType">Subscription type.</param>
        private void UpdatePresentationSubscriptionType(int userId, SubscriptionType subscriptionType)
        {
            List<Presentation> presentations = null;

            using (var repo = Resolver.Resolve<IPresentationRepository>())
            {
                presentations = repo.Query().Where(p => p.UserId == userId).ToList();
                
                foreach(var presentation in presentations)
                {
                    presentation.UserSubscriptionType = subscriptionType;

                    repo.Update(presentation);
                }
            }
        }

        /// <summary>
        /// Returns payment information.
        /// </summary>
        /// <param name="user">User.</param>
        /// <returns>Payment information.</returns>
        private Tuple<bool, PaymentInfoSet> GetPaymentInformationInternal(User user = null)
        {
            User u = null;
            int chargeAmount = 0;
            PaymentInfoSet set = null;
            bool requiresPayment = false;
            Payments.IPaymentProcessor processor = null;

            if (user != null)
                u = user;
            else
            {
                using (var repo = Resolver.Resolve<IUserRepository>())
                    u = repo.Select(ApplicationContext.Current.User.Id);
            }

            if (u != null)
            {
                processor = Resolver.Resolve<Payments.IPaymentProcessor>();

                // Requires payment if switching from free to any paid (no payments) or if the current paid plan is expiring.
                requiresPayment = u.Subscription.RenewedTo != SubscriptionType.Basic && processor.IsEnabled() && (u.Subscription.IsExpiring ||
                    !processor.HasValidPayment(u.Id, new Ifly.Payments.PaymentOptions(u.Subscription)));

                if (requiresPayment)
                {
                    set = new PaymentInfoSet();

                    foreach(var duration in Enum.GetValues(typeof(SubscriptionDuration)))
                    {
                        chargeAmount = processor.GetChargeAmount(new Ifly.Payments.PaymentOptions(u.Subscription)
                        {
                            Duration = (SubscriptionDuration)duration
                        });

                        set.Info.Add(new PaymentInfo()
                        {
                            UserId = u.Id,
                            Amount = chargeAmount,
                            RequiresPayment = true,
                            Duration = (SubscriptionDuration)duration,
                            SubscriptionType = u.Subscription.RenewedTo,
                            Description = GetChargeDescription(new Ifly.Payments.PaymentOptions(u.Subscription.RenewedTo, (SubscriptionDuration)duration), chargeAmount),
                        });
                    }
                }
            }

            return new Tuple<bool, PaymentInfoSet>(requiresPayment, set);
        }

        /// <summary>
        /// Returns charge description.
        /// </summary>
        /// <param name="options">Payment type.</param>
        /// <param name="amount">Charge amount.</param>
        /// <returns>Charge description.</returns>
        private string GetChargeDescription(Ifly.Payments.PaymentOptions options, int? amount = null)
        {
            string terminology = Ifly.Resources.Frontpage.ResourceManager.GetString(string.Format(
                "Account_Payment_{0}_{1}", Enum.GetName(typeof(SubscriptionType), options.Subscription), Enum.GetName(typeof(SubscriptionDuration), options.Duration)), Ifly.Resources.Frontpage.Culture);

            return amount.HasValue ? string.Format(terminology, (int)(amount.Value / 100)) : terminology;
        }

        /// <summary>
        /// Resolves the user.
        /// </summary>
        /// <param name="externalId">External Id.</param>
        /// <param name="fields">User fields.</param>
        /// <param name="userName">User name.</param>
        /// <returns>User.</returns>
        private User EnsureUser(string externalId, IDictionary<string, string> fields, string userName)
        {
            User ret = null;
            bool updateUserDetails = false;
            string nameField = string.Empty;
            string emailField = string.Empty;

            using (var repo = Resolver.Resolve<IUserRepository>())
            {
                nameField = fields.ContainsKey("name") ? fields["name"] : 
                            (fields.ContainsKey("firstName") && fields.ContainsKey("lastName") ? 
                                string.Format("{0} {1}", fields["firstName"], fields["lastName"]).Trim() : string.Empty);

                emailField = fields.ContainsKey("email") ? fields["email"] : (fields.ContainsKey("emailaddress") ? fields["emailaddress"] : string.Empty);

                ret = repo.SelectByExternalId(externalId);

                if (ret == null)
                {
                    ret = new User()
                    {
                         ExternalId = externalId,
                         Email = emailField,
                         Subscription =  Resolver.Resolve<Payments.IPaymentProcessor>().CreateDefaultSubscription(),
                         Name = nameField
                    };

                    if (string.IsNullOrEmpty(ret.Name) && !string.IsNullOrEmpty(userName))
                        ret.Name = userName;

                    if (string.IsNullOrEmpty(ret.Name) && fields.ContainsKey("email"))
                        ret.Name = fields["email"];

                    ret = repo.Update(ret);
                }
                else
                {
                    if (string.IsNullOrEmpty(ret.Name) || (!string.IsNullOrEmpty(nameField) && string.Compare(ret.Name, nameField, true) != 0))
                    {
                        updateUserDetails = true;
                        ret.Name = nameField;
                    }

                    if (string.IsNullOrEmpty(ret.Email) || (!string.IsNullOrEmpty(emailField) && string.Compare(ret.Email, emailField, true) != 0))
                    {
                        updateUserDetails = true;
                        ret.Email = emailField;
                    }

                    if (updateUserDetails)
                        ret = repo.Update(ret);
                }
            }

            return ret;
        }

        /// <summary>
        /// Occurs when user is authenticated.
        /// </summary>
        /// <param name="user">User.</param>
        /// <param name="provider">Provider.</param>
        /// <param name="userName">User name (optional).</param>
        private void OnUserAuthenticated(User user, string provider, string userName = null)
        {
            FormsAuthentication.SetAuthCookie(userName ?? user.ExternalId, true);

            if (string.Compare(provider ?? string.Empty, "google", true) == 0)
            {
                HttpContext.GetOwinContext().Authentication.SignIn(new AuthenticationProperties { IsPersistent = false }, new ClaimsIdentity(new List<Claim>()
                {
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.Email, user.Email)
                }, DefaultAuthenticationTypes.ExternalCookie));
            }
            
            ApplicationContext.Current.User = user;
        }
    }
}
