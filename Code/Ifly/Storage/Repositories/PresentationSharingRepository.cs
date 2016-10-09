using System.Collections.Generic;
using System.Linq;

namespace Ifly.Storage.Repositories
{
    /// <summary>
    /// Represents presentation sharing repository.
    /// </summary>
    public class PresentationSharingRepository : RavenRepository<PresentationSharing>, IPresentationSharingRepository
    {
        /// <summary>
        /// Returns a mapping between each user presentation and the sharing status of it.
        /// </summary>
        /// <param name="userId">User Id. If omitted, the Id of the current user will be used.</param>
        /// <returns>Sharing status.</returns>
        public IDictionary<int, PresentationSharingStatus> GetSharingStatusByUser(int? userId = null)
        {
            IEnumerable<PresentationSharing> sharings = null;
            IList<PresentationRecordDescriptor> presentations = null;
            var ret = new Dictionary<int, PresentationSharingStatus>();

            userId = EnsureUserId(userId);

            if (userId.HasValue)
            {
                // Getting all presentations by the given user.
                using (var repo = Resolver.Resolve<IPresentationRepository>())
                    presentations = repo.GetPresentationsByUser(userId.Value);

                if (presentations != null && presentations.Any())
                {
                    foreach(var presentation in presentations)
                    {
                        // For each presentation, getting all the shares.
                        sharings = this.Query().Where(s => s.PresentationId == presentation.Id).ToList();
                        
                        if (sharings.Any())
                        {
                            // This presentation has been shared - it's part of the result.
                            ret.Add(presentation.Id, new PresentationSharingStatus()
                            {
                                PresentationId = presentation.Id,
                                Users = sharings.Select(s => new PresentationUserSharingStatus()
                                {
                                    UserId = s.UserId,
                                    UserInviteEmail = s.UserInviteEmail
                                })
                            });
                        }
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Returns a list of all presentations that are shared with the given user.
        /// </summary>
        /// <param name="userId">User Id. If omitted, the Id of the current user will be used.</param>
        /// <returns>A list of all presentations that are shared with the given (current) user.</returns>
        public IEnumerable<PresentationRecordDescriptor> GetPresentationsSharedWithUser(int? userId = null)
        {
            Presentation p = null;
            var presentationIds = new List<int>();
            var ret = new List<PresentationRecordDescriptor>();
            var loaded = new List<PresentationRecordDescriptor>();

            userId = EnsureUserId(userId);

            if (userId.HasValue)
            {
                presentationIds.AddRange(this.Query().Where(s => s.UserId == userId.Value)
                    .Select(s => s.PresentationId)
                    .Distinct());

                if (presentationIds.Any())
                {
                    using (var repo = Resolver.Resolve<IPresentationRepository>())
                    {
                        foreach (int presentationId in presentationIds)
                        {
                            p = repo.Select(presentationId);
   
                            if (p != null)
                            {
                                loaded.Add(new PresentationRecordDescriptor()
                                {
                                    Id = p.Id,
                                    Created = p.Created,
                                    IsArchived = p.IsArchived,
                                    Name = p.Title
                                });
                            }
                        }

                        ret.AddRange(loaded.OrderByDescending(presentation => presentation.Created));
                    }
                }
            }

            return ret;
        }

        /// <summary>
        /// Returns value indicating whether the given presentation is shared with the given (current) user.
        /// </summary>
        /// <param name="presentationId">Presentation Id.</param>
        /// <param name="userId">User Id. If omitted, the Id of the current user will be used.</param>
        /// <returns>Value indicating whether the given presentation is shared with the given (current) user.</returns>
        public bool IsSharedWithUser(int presentationId, int? userId = null)
        {
            bool ret = false;

            userId = EnsureUserId(userId);

            if (userId.HasValue)
            {
                ret = GetPresentationsSharedWithUser(userId)
                    .Any(s => s.Id == presentationId);
            }

            return ret;
        }

        /// <summary>
        /// Updates sharing status.
        /// </summary>
        /// <param name="status">Status.</param>
        /// <returns>Update result.</returns>
        public PresentationSharingUpdateResult UpdateSharingStatus(PresentationSharingStatus status)
        {
            PresentationSharing[] allSharings = null;
            List<string> allSharingEmails = new List<string>();
            List<PresentationSharing> added = new List<PresentationSharing>();
            List<PresentationSharing> removed = new List<PresentationSharing>();
            List<PresentationSharing> sharingsToRemove = new List<PresentationSharing>();

            if (status != null && status.PresentationId > 0)
            {
                allSharings = this.Query().Where(s => s.PresentationId == status.PresentationId).ToArray();
                allSharingEmails.AddRange(allSharings.Select(s => s.UserInviteEmail).Distinct());

                if (status.Users == null || !status.Users.Any())
                {
                    foreach (PresentationSharing sharing in allSharings)
                        removed.Add(this.Delete(sharing));
                }
                else
                {
                    // Adding new users.
                    foreach (var user in status.Users.Where(u => !string.IsNullOrEmpty(u.UserInviteEmail) &&
                        !allSharingEmails.Contains(u.UserInviteEmail.Trim())))
                    {
                        added.Add(this.Update(new PresentationSharing()
                        {
                            PresentationId = status.PresentationId,
                            UserInviteEmail = user.UserInviteEmail.Trim(),
                            UserInviteKey = System.Guid.NewGuid().ToString()
                        }));
                    }

                    // Removing users (find).
                    foreach (PresentationSharing sharing in allSharings)
                    {
                        if (!status.Users.Where(u => string.Compare((u.UserInviteEmail ?? string.Empty).Trim(), 
                            (sharing.UserInviteEmail ?? string.Empty).Trim(), true) == 0).Any())
                        {
                            sharingsToRemove.Add(sharing);
                        }
                    }

                    // Removing users (remove).
                    foreach (PresentationSharing sharing in sharingsToRemove)
                        removed.Add(this.Delete(sharing));
                }
            }

            return new PresentationSharingUpdateResult()
            {
                Added = added,
                Removed = removed
            };
        }

        /// <summary>
        /// Ensures user Id.
        /// </summary>
        /// <param name="userId">User Id.</param>
        /// <returns>Id.</returns>
        private int? EnsureUserId(int? userId = null)
        {
            int id = 0;
            User u = null;
            int? ret = null;
            UserSubscription subscription = null;

            if (!userId.HasValue)
            {
                u = Ifly.ApplicationContext.Current.User;

                if (u != null)
                {
                    id = u.Id;
                    subscription = u.Subscription;
                }
            }
            else
                id = userId.Value;

            if (id > 0)
            {
                if (subscription == null)
                {
                    using (var repo = Resolver.Resolve<IUserRepository>())
                        u = repo.Select(id);

                    if (u != null)
                        subscription = u.Subscription;
                }

                if (subscription != null)
                    ret = subscription.Type == SubscriptionType.Agency ? (int?)id : null;
            }

            return ret;
        }
    }
}
