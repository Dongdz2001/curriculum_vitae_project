<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { defineProps, defineEmits } from "vue";
import { db } from "../../src/firebase.js";
import {
  getDocs,
  collection,
  addDoc,
  doc,
  setDoc,
  query,
  orderBy,
  onSnapshot, // Thêm onSnapshot vào đây
} from "firebase/firestore";
import axios from "axios";

// import picker component
import EmojiPicker from "vue3-emoji-picker";

// import css
import "vue3-emoji-picker/css";

const props = defineProps(["isOpen"]);
const emit = defineEmits(["toggle"]);

const message = ref("");
const receivedMessages = ref([]);
let socket = null;
const flagPushMessage = ref(true);

const senderID = ref(null);
const receiverID = "serverDongCV132413244321";

const isInitialized = ref(false);

// Function to generate a GUID
function generateGUID() {
  return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0;
    return r.toString(16);
  });
}

function generateGUIDAndSaveToLocalStorage() {
  const guid = generateGUID();
  localStorage.setItem("clientId", guid);
  return guid;
}

// Initialize senderID
onMounted(async () => {
  // Initialize Pusher
  // const pusher = new Pusher("7953e97c7e460e39b9d4", {
  //   cluster: "ap1",
  // });
  senderID.value = localStorage.getItem("clientId");
  if (senderID.value) {
    // Initialize chat
    await initializeChat();
  }
  // Optionally, you can return a cleanup function
  // return () => {
  //   channel.unbind("chat-event");
  //   pusher.unsubscribe(senderID.value);
  // };
});

const toggleChat = () => {
  emit("toggle");
};

// Remove the WebSocket-related code and add Pusher initialization
// const pusher = new Pusher("7953e97c7e460e39b9d4", {
//   cluster: "ap1",
// });

// const channel = pusher.subscribe(senderID.value);

// onMounted(() => {
//   channel.bind("chat-event", async (data) => {
//     if (data.username === "dong") {
//       receivedMessages.value.push({
//         SenderID: data.username,
//         MessageContent: data.message,
//         timestamp: new Date(),
//       });

//       // Scroll to bottom after adding the new message
//       scrollToBottom();

//       // Add the message to Firestore
//       const chatId = await getOrCreateChatId(senderID.value, receiverID);
//       await addDoc(collection(db, "chats", chatId, "messages"), {
//         SenderID: data.username,
//         MessageContent: data.message,
//         timestamp: new Date(),
//       });
//     }
//   });
// });

async function getOrCreateChatId(user1, user2) {
  const chatId = [user1, user2].sort().join("_");
  const chatRef = doc(db, "chats", chatId);
  await setDoc(
    chatRef,
    { participants: [user1, user2, user1] },
    { merge: true }
  );
  return chatId;
}

// Remove createWebSocket function

async function sendMessage() {
  if (!senderID.value && message.value) {
    senderID.value = generateGUIDAndSaveToLocalStorage();
    await initializeChat();
  }

  if (!senderID.value || !message.value) {
    console.error("Please fill in all fields before sending the message.");
    return;
  }

  const currentMessage = message.value.trim(); // Store the current message before clearing it

  receivedMessages.value.push({
    SenderID: senderID.value,
    MessageContent: currentMessage,
    timestamp: new Date(),
  });

  message.value = ""; // Clear the message input
  flagPushMessage.value = false;

  // Scroll to bottom after adding the new message
  scrollToBottom();

  try {
    // // Send message to the endpoint using axios
    // const response = await axios.post(
    //   "http://localhost:5000/api/messages/",
    //   messageObject
    // );

    // If the message is sent successfully, add it to Firestore
    const chatId = senderID.value + "_" + receiverID;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      SenderID: senderID.value,
      MessageContent: currentMessage, // Use the stored message
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

async function initializeChat() {
  receivedMessages.value = [];

  // Lấy chatId dựa trên senderID và receiverID
  const chatId = await getOrCreateChatId(senderID.value, receiverID);

  // Tham chiếu đến collection messages trong Firestore
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  try {
    // Lấy tất cả message hiện có từ Firestore và in ra
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const messageData = {
        id: doc.id,
        ...doc.data(),
      };
      console.log("Message: ", messageData); // In ra console
      receivedMessages.value.push(messageData); // Thêm vào danh sách tin nhắn
    });

    // Sau khi lấy hết tin nhắn hiện tại, thiết lập listener theo thời gian thực
    setRealTimeListener(messagesRef);
  } catch (error) {
    console.error("Error initializing chat:", error);
  }
}

function setRealTimeListener() {
  // Lấy chatId dựa trên senderID và receiverID
  const chatId = senderID.value + "_" + receiverID;
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  // Lắng nghe những thay đổi theo thời gian thực trong Firestore
  onSnapshot(q, (querySnapshot) => {
    querySnapshot.docChanges().forEach((messageChange) => {
      if (messageChange.type === "added") {
        const newMsg = {
          id: messageChange.doc.id,
          ...messageChange.doc.data(),
        };

        console.log("New message added: ", newMsg); // In ra console message mới

        if (flagPushMessage.value) {
          receivedMessages.value.push(newMsg); // Thêm tin nhắn mới vào danh sách
        }
        flagPushMessage.value = true;

        // Cuộn xuống cuối cùng sau khi thêm tin nhắn mới
        scrollToBottom();
      }
    });
  });
}

const showEmojiPicker = ref(false);

function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value;
}

function onSelectEmoji(emoji) {
  message.value += emoji.i;
  // showEmojiPicker.value = false;
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
        <input
          v-model="message"
          type="text"
          placeholder="Type a message..."
          style="height: 25px; font-size: 14px"
          @keyup.enter.prevent="sendMessage"
          @click="toggleEmojiPicker"
        />
        <div
          @click="toggleEmojiPicker"
          class="emoji-button"
          style="
            width: 20px;
            height: auto;
            background: none;
            text-align: center;
            margin-left: 5px;
          "
        >
          😊
        </div>
        <button @click="sendMessage">Send</button>
      </div>
      <EmojiPicker
        v-if="showEmojiPicker"
        :native="false"
        @select="onSelectEmoji"
        class="emoji-picker"
      />
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
  align-items: center;
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

.emoji-button {
  background-color: #f0f0f0;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 16px;
}

.emoji-picker {
  position: absolute;
  bottom: 70px;
  right: 10px;
  z-index: 1001;
}
</style>
