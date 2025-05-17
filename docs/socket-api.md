# Socket.IO API Documentation

This document describes how to connect to the Socket.IO server, register a user, and handle messaging and typing events in the Pigen Server backend.

---

## 1. Connecting to the Socket.IO Server

Use the official Socket.IO client library to connect to the server. After connecting, you must register your userId.

**Example (JavaScript/TypeScript):**

```js
import { io } from 'socket.io-client';

const socket = io('http://YOUR_SERVER_URL'); // Replace with your server URL

socket.on('connect', () => {
  console.log('Connected with socket id:', socket.id);

  // Register userId after connecting
  socket.emit('register', { userId: 'USER_ID_HERE' });
});
```

---

## 2. Registering the User

- **Event:** `register`
- **Direction:** Client → Server
- **Payload:**
  ```json
  {
    "userId": "string"
  }
  ```
- **Description:**
  After connecting, emit the `register` event with the user's unique ID. This allows the server to associate the socket connection with the user.

---

## 3. Sending a Message

- **Event:** `send_message`
- **Direction:** Client → Server
- **Payload:**
  ```json
  {
    "userId": "string",
    "conversationId": "string",
    "message": "string"
  }
  ```
- **Description:**
  Emit this event to send a new message in a conversation. The server will process and broadcast the message to the relevant users.

---

## 4. Receiving a Message

- **Event:** `receive_message`
- **Direction:** Server → Client
- **Payload:**
  The payload will contain the message object, typically including fields like `conversationId`, `content`, `sender`, `createdAt`, etc.

  **Example:**

  ```json
  {
    "conversationId": "string",
    "content": "string",
    "sender": "string",
    "createdAt": "ISODateString"
  }
  ```

- **Description:**
  Listen for this event to receive new messages in real time.

  **Example:**

  ```js
  socket.on('receive_message', message => {
    console.log('New message received:', message);
  });
  ```

---

## 5. Typing Events

### a. Typing Notification

- **Event:** `typing`
- **Direction:** Server → Client
- **Payload:**
  ```json
  {
    "conversationId": "string",
    "isTyping": true,
    "message": "string (optional, e.g. 'Typing...', 'Thinking...', or reasoning text)"
  }
  ```
- **Description:**
  Indicates that a user (or the AI) is currently typing in a conversation. The optional `message` field can be used by the frontend to display a custom typing indicator, such as "Typing...", "Thinking...", or a more descriptive status.

### b. Typing Stop Notification

- **Event:** `typing_stop`
- **Direction:** Server → Client
- **Payload:**
  ```json
  {
    "conversationId": "string",
    "isTyping": false,
    "message": "string (optional, usually empty or omitted)"
  }
  ```
- **Description:**
  Indicates that a user (or the AI) has stopped typing. The `message` field is optional and typically empty or omitted.

  **Example:**

  ```js
  socket.on('typing', data => {
    if (data.isTyping) {
      // Show typing indicator for data.conversationId
      // Optionally display data.message if present
    }
  });

  socket.on('typing_stop', data => {
    if (!data.isTyping) {
      // Hide typing indicator for data.conversationId
    }
  });
  ```

---

## 6. Disconnecting

When a client disconnects, the server will automatically clear the user's socket ID from the database.

---

## 7. Error Handling

If an error occurs (e.g., failed to send a message), the server may emit an `error` event:

**Example:**

```js
socket.on('error', err => {
  console.error('Socket error:', err.message);
});
```

---

## Event Summary Table

| Event Name        | Direction       | Purpose                           | Payload Example                                                         |
| ----------------- | --------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `register`        | Client → Server | Register userId with socket       | `{ "userId": "string" }`                                                |
| `send_message`    | Client → Server | Send a message in a conversation  | `{ "userId": "...", "conversationId": "...", "message": "..." }`        |
| `receive_message` | Server → Client | Receive a new message             | `{ "conversationId": "...", ... }`                                      |
| `typing`          | Server → Client | Notify that a user is typing      | `{ "conversationId": "...", "isTyping": true, "message": "Typing..." }` |
| `typing_stop`     | Server → Client | Notify that a user stopped typing | `{ "conversationId": "...", "isTyping": false, "message": "" }`         |
| `error`           | Server → Client | Error notification                | `{ "message": "..." }`                                                  |

---

## Best Practices

- Always emit `register` with the correct `userId` after connecting.
- Listen for `receive_message`, `typing`, and `typing_stop` to update your UI in real time.
- Handle the `error` event for better user experience.
- Use the official [Socket.IO client library](https://socket.io/docs/v4/client-api/) for full compatibility.
