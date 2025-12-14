# 💬 Messaging System - Complete Implementation

## Features Implemented

✅ **Direct Buyer-Seller Conversations**
- Start conversation from post details page
- Automatic conversation creation
- Link conversations to specific posts

✅ **Message History & Persistence**
- All messages stored in MongoDB
- Pagination support (30 messages per load)
- Conversation sorting by most recent

✅ **Typing Indicators & Read Receipts**
- Messages marked as read when viewed
- "Read" indicator shows on sent messages
- Timestamp on every message

✅ **Notifications for New Messages**
- Unread message counter in navigation
- Real-time unread count updates (5-second polling)
- Badge shows on Messages button

✅ **Block User Functionality**
- Block users from conversation
- Blocked users cannot see conversation
- Unblock option available
- Blocked conversations hidden from list

## Backend Architecture

### Models
- **Conversation** (`BackEnd/Model/Conversation.js`)
  - Participants array (2 users)
  - Last message reference
  - Unread counts per user
  - Block tracking
  - Post reference

- **Message** (`BackEnd/Model/Message.js`)
  - Sender & receiver references
  - Content & timestamps
  - Read status with read time
  - Soft delete support
  - Conversation reference

### Controller
- **MessageController** (`BackEnd/Controller/MessageController.js`)
  - `getConversations()` - List user's conversations
  - `getMessages()` - Fetch messages with auto-read
  - `sendMessage()` - Create new message
  - `deleteMessage()` - Soft delete message
  - `blockUser()` - Block conversation
  - `unblockUser()` - Unblock conversation
  - `startConversation()` - Create from post
  - `getUnreadCount()` - Total unread messages

### Routes
- **MessageRouter** (`BackEnd/Routes/MessageRouter.js`)
  - All routes protected with authMiddleware
  - REST API endpoints for all operations

## Frontend Architecture

### API Layer
- **Messagesapi.js** - API wrapper functions
  - `getConversations()` - Fetch all conversations
  - `getMessages(conversationId)` - Fetch messages
  - `sendMessage(receiverId, content, conversationId, postId)`
  - `deleteMessage(messageId)`
  - `blockUser(conversationId, blockUserId)`
  - `unblockUser(conversationId)`
  - `getUnreadCount()` - Get unread message count

### Components

**MessagesPage** (`Frontend/src/Pages/MessagesPage.jsx`)
- Two-column layout: Conversations + Chat
- Real-time polling (3-second interval)
- Message input with form submission
- Delete message on own messages
- Block/Unblock user buttons
- Responsive design for mobile

**Features**:
- Conversation list with avatars
- Unread badges and counts
- Message search preview
- Timestamp on messages
- Read receipts with indicator
- User information in chat header
- Post title context in header

### Styling
- **MessagesPage.css** - Modern, responsive design
  - Gradient headers and buttons
  - Smooth animations and transitions
  - Mobile responsive (sidebar as overlay)
  - Dark mode compatible
  - Professional color scheme (purple/gradient)

## Integration Points

### PostDetailsPage
- **Message Seller Button** triggers `startConversation()`
- Creates conversation linked to specific post
- Navigates to MessagesPage after starting

### TopNav
- **Messages Button** with unread badge
- Polls unread count every 5 seconds
- Red badge shows unread message count
- Available only when logged in

### App.jsx
- MessagesPage integrated as protected route
- Navigation handler: `onNavigate("messages")`

## Database Indexes

For optimal performance:
```javascript
// Conversation
- participants: 1, lastMessageAt: -1

// Message
- conversationId: 1, createdAt: -1
- senderId: 1, createdAt: -1
- receiverId: 1, isRead: 1
```

## Real-Time Features

### Polling Strategy
1. **Message Polling** - Every 3 seconds when chat open
2. **Unread Count Polling** - Every 5 seconds
3. **Conversation List** - Every 3 seconds

### Auto-Read
- Messages automatically marked as read when conversation opened
- Read timestamp recorded
- Unread count updated

## Security Features

✅ **Authentication**
- All routes require authMiddleware
- User ID from JWT token

✅ **Authorization**
- Can only delete own messages
- Can only view own conversations
- Block/Unblock only in own conversations

✅ **Soft Deletes**
- Messages not deleted, just hidden
- Maintains message integrity
- Restore capability preserved

## Usage Examples

### Start Conversation from Post
```javascript
import { startConversation } from "../apis/Messagesapi";

const handleMessage = async () => {
  const response = await startConversation(sellerId, postId);
  navigate("messages");
};
```

### Send Message
```javascript
const response = await sendMessage(
  receiverId,
  "Your message here",
  conversationId,
  postId // optional
);
```

### Check Unread
```javascript
const { result } = await getUnreadCount();
console.log(result.totalUnread); // Total unread messages
```

## Future Enhancements

- WebSocket for real-time messages
- Message attachments (images/files)
- Conversation search
- Message search within conversation
- Typing indicators (real-time)
- Voice message support
- Video call integration
- Message reactions/emojis
- Message forwarding
- Conversation archive
- Bulk message actions

## Testing the Feature

1. **Create Account** - Register as user A and B
2. **Create Post** - User A creates a listing
3. **Start Conversation** - User B clicks "Message" on post
4. **Send Messages** - Both users can send/receive messages
5. **Block User** - Block/unblock functionality
6. **Check Unread** - Verify unread count in navigation
7. **Read Receipts** - See "Read" indicator on sent messages
8. **Delete Message** - Delete own messages from conversation

## API Endpoints

```
GET  /api/messages/conversations          - Get all conversations
GET  /api/messages/messages/:conversationId - Get messages in conversation
POST /api/messages/send                    - Send new message
POST /api/messages/start-conversation      - Create conversation from post
DELETE /api/messages/messages/:messageId   - Delete message
POST /api/messages/block                   - Block user
POST /api/messages/unblock                 - Unblock user
GET  /api/messages/unread-count            - Get total unread count
```

All endpoints require Bearer token authentication.
