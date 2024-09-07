<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { defineProps, defineEmits } from "vue";
import { db } from "../../src/firebase.js";
import { getDocs } from "firebase/firestore";

import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import Pusher from "pusher-js";
import axios from "axios";

const props = defineProps(["isOpen"]);
const emit = defineEmits(["toggle"]);

const message = ref("");
const receivedMessages = ref([]);
let socket = null;

const senderID = ref("");
const receiverID = "serverDongCV132413244321";

const isInitialized = ref(false);

// Function to generate a GUID
function generateGUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Initialize senderID
onMounted(async () => {
  let clientId = localStorage.getItem("clientId");
  if (!clientId) {
    clientId = generateGUID();
    localStorage.setItem("clientId", clientId);
  }
  senderID.value = clientId;

  // Initialize Pusher
  const pusher = new Pusher("7953e97c7e460e39b9d4", {
    cluster: "ap1",
  });
  const channel = pusher.subscribe("my-channel");

  // Initialize chat
  const unsubscribe = await initializeChat();

  // Optionally, you can return a cleanup function
  return () => {
    if (unsubscribe) unsubscribe();
    channel.unbind("chat-event");
  };
});

const toggleChat = () => {
  emit("toggle");
};

// Remove the WebSocket-related code and add Pusher initialization
const pusher = new Pusher("7953e97c7e460e39b9d4", {
  cluster: "ap1",
});

const channel = pusher.subscribe("my-channel");

onMounted(() => {
  channel.bind("chat-event", async (data) => {
    if (data.username === "dong") {
      receivedMessages.value.push({
        SenderID: data.username,
        MessageContent: data.message,
        timestamp: new Date(),
      });

      // Scroll to bottom after adding the new message
      scrollToBottom();

      // Add the message to Firestore
      const chatId = await getOrCreateChatId(senderID.value, receiverID);
      await addDoc(collection(db, "chats", chatId, "messages"), {
        SenderID: data.username,
        MessageContent: data.message,
        timestamp: new Date(),
      });
    }
  });
});

async function getOrCreateChatId(user1, user2) {
  const chatId = [user1, user2].sort().join("_");
  const chatRef = doc(db, "chats", chatId);
  await setDoc(chatRef, { participants: [user1, user2] }, { merge: true });
  return chatId;
}

// Remove createWebSocket function

async function sendMessage() {
  if (!senderID.value || !message.value) {
    console.error("Please fill in all fields before sending the message.");
    return;
  }

  receivedMessages.value.push({
    SenderID: senderID.value,
    MessageContent: message.value,
    timestamp: new Date(),
  });

  message.value = "";

  // Scroll to bottom after adding the new message
  scrollToBottom();

  const messageObject = {
    username: senderID.value,
    message: message.value,
    chanelId: "my-channel",
  };

  try {
    // Send message to the endpoint using axios
    const response = await axios.post(
      "https://e20a-3-84-210-56.ngrok-free.app/api/messages/",
      messageObject
    );

    // If the message is sent successfully, add it to Firestore
    const chatId = await getOrCreateChatId(senderID.value, receiverID);
    await addDoc(collection(db, "chats", chatId, "messages"), {
      SenderID: senderID.value,
      MessageContent: message.value,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

const chatMessagesRef = ref(null);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight - 1;
    }
  });
};

let lastProcessedMessageTime = null;

async function initializeChat() {
  if (!isInitialized.value) {
    const chatId = await getOrCreateChatId(senderID.value, receiverID);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    // Sử dụng getDocs để lấy dữ liệu một lần
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const newMsg = {
        id: doc.id,
        ...doc.data(),
      };

      receivedMessages.value.push(newMsg);
    });

    scrollToBottom();

    isInitialized.value = true;
    // Không cần trả về unsubscribe function vì không có subscription nào được thiết lập
  }
}
</script>

<template>
  <div class="chat-bubble">
    <button @click="toggleChat" class="chat-button">
      <i class="fas fa-comments"></i>
    </button>
    <div v-if="isOpen" class="chat-window">
      <div class="chat-header" style="height: 35px">
        <h3>Chat</h3>
        <button @click="toggleChat" class="close-button">&times;</button>
      </div>
      <div class="chat-messages" ref="chatMessagesRef">
        <ul>
          <li v-for="msg in receivedMessages" :key="msg.id">
            {{ msg.SenderID === senderID ? "You" : "Đông" }}:
            {{ msg.MessageContent }}
          </li>
        </ul>
      </div>
      <div class="chat-input">
        <input v-model="message" type="text" placeholder="Type a message..." />
        <button @click="sendMessage">Send</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-bubble {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chat-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 24px;
}

.chat-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 300px;
  height: 400px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-header {
  background-color: #007bff;
  color: white;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

.chat-messages {
  flex-grow: 1;
  padding: 10px;
  overflow-y: auto;
}

.chat-messages ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.chat-messages li {
  margin-bottom: 5px;
}

.chat-input {
  display: flex;
  padding: 10px;
}

.chat-input input {
  flex-grow: 1;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.chat-input button {
  margin-left: 5px;
  padding: 5px 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
</style>
