using Microsoft.AspNet.SignalR;

namespace Ifly.Web.Editor.Api.Hubs
{
    /// <summary>
    /// Represents chat hub.
    /// </summary>
    public class ChatHub : Hub
    {
        /// <summary>
        /// Joins the room.
        /// </summary>
        /// <param name="room">Room name.</param>
        /// <param name="name">Participant name.</param>
        public void Join(string room, string name)
        {
            Groups.Add(Context.ConnectionId, room);
            Clients.Group(room).onParticipantJoined(name);
        }

        /// <summary>
        /// Leaves the room.
        /// </summary>
        /// <param name="room">Room name.</param>
        /// <param name="name">Participant name.</param>
        public void Leave(string room, string name)
        {
            Groups.Remove(Context.ConnectionId, room);
            Clients.Group(room).onParticipantLeft(name);
        }

        /// <summary>
        /// Sends a message.
        /// </summary>
        /// <param name="room">Room name.</param>
        /// <param name="name">Participant name.</param>
        /// <param name="message">Message.</param>
        /// <param name="recipient">Recipient.</param>
        public void Send(string room, string name, string message, string recipient)
        {
            Clients.Group(room).onMessageReceived(name, message, recipient);
        }
    }
}