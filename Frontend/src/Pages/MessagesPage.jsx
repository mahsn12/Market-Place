import React, { useState, useEffect, useRef } from "react";
import "../Style/MessagesPage.css";
import { useToast } from "../components/ToastContext";
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  blockUser,
  unblockUser,
  getUnreadCount,
} from "../apis/Messagesapi";

export default function MessagesPage({ user, isLoggedIn }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showSuccess, showError } = useToast();

  // Use refs to track current values without re-running effects
  const selectedConversationRef = useRef(selectedConversation);
  const messagesRef = useRef(messages);

  // Update refs when state changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Poll conversations (independent of selected conversation)
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchConversations();
    fetchUnreadCount();

    const conversationInterval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
    }, 15000);

    return () => clearInterval(conversationInterval);
  }, [isLoggedIn]);

  // Poll messages for the current selected conversation
  useEffect(() => {
    if (!isLoggedIn || !selectedConversation) return;

    // Clear messages when conversation changes
    setMessages([]);
    
    // Initial fetch
    fetchMessages(selectedConversation._id);

    // Set up polling for this specific conversation
    const messageInterval = setInterval(() => {
      fetchMessages(selectedConversation._id);
    }, 10000);

    return () => clearInterval(messageInterval);
  }, [isLoggedIn, selectedConversation?._id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      setConversations(response.result || []);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const response = await getMessages(conversationId);
      setMessages(response.result || []);
      
      // Auto-scroll to bottom after messages load
      setTimeout(() => {
        const messagesContainer = document.querySelector(".messages-list");
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadCount();
      setUnreadCount(response.result?.totalUnread || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    // Messages will be fetched by the useEffect above
    window.scrollTo(0, 0); // Scroll to top
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversationRef.current) return;

    try {
      const messageText = messageInput.trim();
      setMessageInput(""); // Clear input immediately for better UX
      
      const response = await sendMessage(
        selectedConversationRef.current.otherUser._id,
        messageText,
        selectedConversationRef.current._id
      );

      // Use functional update to avoid stale state
      setMessages(prevMessages => [...prevMessages, response.result]);
      
      // Scroll to bottom after new message
      setTimeout(() => {
        const messagesContainer = document.querySelector(".messages-list");
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 0);
    } catch (error) {
      showError(error.message || "Failed to send message");
      setMessageInput(messageText || messageInput); // Restore message on error
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      // Use functional update to avoid stale state
      setMessages(prevMessages => prevMessages.filter((m) => m._id !== messageId));
      showSuccess("Message deleted");
    } catch (error) {
      showError(error.message || "Failed to delete message");
    }
  };

  const handleBlockUser = async () => {
    try {
      await blockUser(
        selectedConversation._id,
        selectedConversation.otherUser._id
      );
      showSuccess("User blocked");
      setConversations(
        conversations.filter((c) => c._id !== selectedConversation._id)
      );
      setSelectedConversation(null);
      setMessages([]);
    } catch (error) {
      showError(error.message || "Failed to block user");
    }
  };

  const handleUnblockUser = async () => {
    try {
      await unblockUser(selectedConversation._id);
      showSuccess("User unblocked");
      await fetchConversations();
    } catch (error) {
      showError(error.message || "Failed to unblock user");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="messages-page">
        <div className="empty-state">
          <h2>📬 Messages</h2>
          <p>Please log in to view your messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Conversations List */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>💬 Messages {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h2>
          </div>

          <div className="conversations-list">
            {loading ? (
              <div className="loading">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`conversation-item ${
                    selectedConversation?._id === conv._id ? "active" : ""
                  }`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="conv-avatar">
                    {conv.otherUser?.profileImage ? (
                      <img
                        src={conv.otherUser.profileImage}
                        alt={conv.otherUser.name}
                      />
                    ) : (
                      <span className="avatar-placeholder">
                        {conv.otherUser?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="conv-info">
                    <div className="conv-header">
                      <h3>{conv.otherUser?.name || "Unknown User"}</h3>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                    <p className="conv-preview">
                      {conv.lastMessage?.content?.substring(0, 50) ||
                        "No messages yet"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {selectedConversation.otherUser?.profileImage ? (
                      <img
                        src={selectedConversation.otherUser.profileImage}
                        alt={selectedConversation.otherUser.name}
                      />
                    ) : (
                      <span className="avatar-placeholder">
                        {selectedConversation.otherUser?.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="user-details">
                    <h3>{selectedConversation.otherUser?.name}</h3>
                    {selectedConversation.postId && (
                      <p className="post-info">
                        About: {selectedConversation.postId.title}
                      </p>
                    )}
                  </div>
                </div>

            {selectedConversation.blockedBy !== user._id && (
                  <div className="blocked-warning">
                    ⚠️ This conversation is blocked
                  </div>
                )}

                <div className="chat-actions">
                  {selectedConversation.blockedBy ? (
                    <button
                      className="btn-unblock"
                      onClick={handleUnblockUser}
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      className="btn-block"
                      onClick={handleBlockUser}
                    >
                      Block
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="messages-list">
                {messagesLoading ? (
                  <div className="loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>📝 No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`message-item ${
                          msg.senderId._id === user.id || msg.senderId._id === user._id ? "sent" : "received"
                        }`}
                      >
                        {/* Sender Avatar for received messages */}
                        {(msg.senderId._id !== user.id && msg.senderId._id !== user._id) && (
                          <div className="message-avatar">
                            {msg.senderId?.profileImage ? (
                              <img 
                                src={msg.senderId.profileImage} 
                                alt={msg.senderId.name}
                                title={msg.senderId.name}
                              />
                            ) : (
                              <span className="avatar-placeholder">
                                {msg.senderId?.name?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="message-content">
                          <p>{msg.content}</p>
                          {(msg.senderId._id === user.id || msg.senderId._id === user._id) && msg.isRead && (
                            <span className="read-indicator">✓ Read</span>
                          )}
                          <span className="timestamp">
                            {new Date(msg.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {/* Sender Avatar for sent messages */}
                        {(msg.senderId._id === user.id || msg.senderId._id === user._id) && (
                          <div className="message-avatar sent">
                            {msg.senderId?.profileImage ? (
                              <img 
                                src={msg.senderId.profileImage} 
                                alt={msg.senderId.name}
                                title={msg.senderId.name}
                              />
                            ) : (
                              <span className="avatar-placeholder">
                                {msg.senderId?.name?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {(msg.senderId._id === user.id || msg.senderId._id === user._id) && (
                          <button
                            className="btn-delete-message"
                            onClick={() => handleDeleteMessage(msg._id)}
                            title="Delete message"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Message Input */}
              {!selectedConversation.blockedBy && (
                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onFocus={() => setTyping(true)}
                    onBlur={() => setTyping(false)}
                  />
                  <button type="submit" className="btn-send">
                    📤 Send
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h2>💬 Messages</h2>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}