using System.Linq;
using Microsoft.AspNet.SignalR;
using System.Collections.Concurrent;
using Ifly.Web.Editor.Models;
using System.Collections.Generic;

namespace Ifly.Web.Editor.Api.Hubs
{
    /// <summary>
    /// Represents collaborative edits hub.
    /// </summary>
    public class CollaborativeEditsHub : Hub
    {
        /// <summary>
        /// Gets or sets the teams.
        /// </summary>
        private static readonly ConcurrentDictionary<string, ConcurrentDictionary<int, Collaborator>> _teams =
            new ConcurrentDictionary<string, ConcurrentDictionary<int, Collaborator>>();

        /// <summary>
        /// Joins the team.
        /// </summary>
        /// <param name="team">Team name.</param>
        /// <param name="participant">Participant.</param>
        public void Join(string team, Collaborator participant)
        {
            ConcurrentDictionary<int, Collaborator> teamMembers = null;

            Groups.Add(Context.ConnectionId, team);

            // 1. Adding or updating the team.
            teamMembers = _teams.AddOrUpdate(team, new ConcurrentDictionary<int, Collaborator>(), (k, e) => e);

            // 2. Adding or updating team member.
            teamMembers.AddOrUpdate(participant.Id, participant, (k, e) => participant);

            Clients.Group(team).onParticipantJoined(participant, teamMembers.Values.ToArray());
        }

        /// <summary>
        /// Leaves the team.
        /// </summary>
        /// <param name="team">Team name.</param>
        /// <param name="participant">Participant.</param>
        public void Leave(string team, Collaborator participant)
        {
            Collaborator removedParticipant = null;
            ConcurrentDictionary<int, Collaborator> teamMembers = null;

            Groups.Remove(Context.ConnectionId, team);

            if (_teams.TryGetValue(team, out teamMembers))
            {
                // 1. Removing from the team.
                teamMembers.TryRemove(participant.Id, out removedParticipant);

                if (teamMembers.Count == 0)
                {
                    // 2. Removing the team.
                    _teams.TryRemove(team, out teamMembers);
                }
            }

            Clients.Group(team).onParticipantLeft(participant, teamMembers.Values.ToArray());
        }

        /// <summary>
        /// Occurs when presentation settings are updated.
        /// </summary>
        /// <param name="team">Team name.</param>
        /// <param name="userId">Id of the owner of the edit.</param>
        /// <param name="slides">Settings.</param>
        public void OnSettingsUpdated(string team, int userId, PresentationSettingsModel settings)
        {
            Clients.Group(team).onSettingsUpdated(userId, settings, GetCollaborators(team));
        }

        /// <summary>
        /// Occurs when slides are created.
        /// </summary>
        /// <param name="team">Team name.</param>
        /// <param name="userId">Id of the owner of the edit.</param>
        /// <param name="slides">Slides.</param>
        public void OnSlidesCreated(string team, int userId, Slide[] slides)
        {
            Clients.Group(team).onSlidesCreated(userId, slides, GetCollaborators(team));
        }

        /// <summary>
        /// Occurs when slides are updated.
        /// </summary>
        /// <param name="team">Team name.</param>
        /// <param name="userId">Id of the owner of the edit.</param>
        /// <param name="slides">Slides.</param>
        public void OnSlidesUpdated(string team, int userId, Slide[] slides)
        {
            Clients.Group(team).onSlidesUpdated(userId, slides, GetCollaborators(team));
        }

        /// <summary>
        /// Occurs when slides are reordered.
        /// </summary>
        /// <param name="team">Team name.</param>
        /// <param name="userId">Id of the owner of the edit.</param>
        /// <param name="slides">Slides.</param>
        public void OnSlidesReordered(string team, int userId, Slide[] slides)
        {
            Clients.Group(team).onSlidesReordered(userId, slides, GetCollaborators(team));
        }

        /// <summary>
        /// Occurs when slides are deleted.
        /// </summary>
        /// <param name="team">Team name.</param>
        /// <param name="userId">Id of the owner of the edit.</param>
        /// <param name="slides">Slides.</param>
        public void OnSlidesDeleted(string team, int userId, Slide[] slides)
        {
            Clients.Group(team).onSlidesDeleted(userId, slides, GetCollaborators(team));
        }

        /// <summary>
        /// Occurs when elements are created.
        /// </summary>
        /// <param name="team">team name.</param>
        /// <param name="userId">Id of the owner of this edit.</param>
        /// <param name="elements">Elements.</param>
        public void OnElementsCreated(string team, int userId, Element[] elements)
        {
            Clients.Group(team).onElementsCreated(userId, elements, GetCollaborators(team));
        }

        /// <summary>
        /// Occurs when elements are updated.
        /// </summary>
        /// <param name="team">team name.</param>
        /// <param name="userId">Id of the owner of this edit.</param>
        /// <param name="elements">Elements.</param>
        public void OnElementsUpdated(string team, int userId, Element[] elements)
        {
            Clients.Group(team).onElementsUpdated(userId, elements, GetCollaborators(team));
        }

        /// <summary>
        /// Occurs when elements are deleted.
        /// </summary>
        /// <param name="team">team name.</param>
        /// <param name="userId">Id of the owner of this edit.</param>
        /// <param name="elements">Elements.</param>
        public void OnElementsDeleted(string team, int userId, Element[] elements)
        {
            Clients.Group(team).onElementsDeleted(userId, elements, GetCollaborators(team));
        }

        /// <summary>
        /// Returns team collaborators.
        /// </summary>
        /// <param name="team">Team.</param>
        /// <returns>Collaborators.</returns>
        private IList<Collaborator> GetCollaborators(string team)
        {
            List<Collaborator> ret = new List<Collaborator>();
            ConcurrentDictionary<int, Collaborator> teamMembers = null;

            if (_teams.TryGetValue(team, out teamMembers))
                ret.AddRange(teamMembers.Values);

            return ret;
        }
    }
}