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
import {
  ref as storageRefFn,
  getStorage,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import axios from "axios";

// import picker component
import EmojiPicker from "vue3-emoji-picker";
// import css
import "vue3-emoji-picker/css";

import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

const props = defineProps(["isOpen"]);
const emit = defineEmits(["toggle"]);

const message = ref("");
const receivedMessages = ref([]);
let socket = null;
const flagPushMessage = ref(true);

const senderID = ref(null);
const receiverID = "serverDongCV132413244321";
const userNameClient = ref("");
const isInitialized = ref(false);

function setUserNameClient() {
  if (userNameClient.value) {
    // Show dialog with the username
    getOrCreateChatId(senderID.value, receiverID, userNameClient.value);
    alert(`Đặt tên của bạn thành công!`);
  }
}

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

function isValidURL(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  console.log("File selected:", file);
  if (!file) return;

  const storage = getStorage(); // Lấy instance của storage
  const storageRef = storageRefFn(storage, `chat_attachments/${file.name}`);

  const uploadTask = uploadBytesResumable(storageRef, file);

  // Kiểm tra kích thước file (ví dụ: giới hạn 5MB)
  const maxSize = 15 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    alert("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.");
    return;
  }

  toast("Đang tải file...", {
    autoClose: 1000,
    type: "info",
    position: "top-left",
    theme: "auto",
  });

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log("Upload is " + progress + "% done");
    },
    (error) => {
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      // Hiển thị thông báo lỗi cho người dùng
      alert("Có lỗi xảy ra khi tải file. Vui lòng thử lại.");
    },
    async () => {
      // console.log("Upload completed");
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      message.value = "\n" + downloadURL;
      sendMessage();
    }
  );

  toast("Đã tải xong file!", {
    autoClose: 2000,
    type: "success",
    position: "top-left",
    theme: "auto",
    delay: 1000,
  });
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

async function getOrCreateChatId(user1, user2, user3 = null) {
  const chatId = [user1, user2].sort().join("_");
  const chatRef = doc(db, "chats", chatId);
  await setDoc(
    chatRef,
    { participants: [user1, user2, user3 ? user3 : user1] },
    { merge: true }
  );
  return chatId;
}

// Remove createWebSocket function

async function sendMessage() {
  if (!senderID.value && message.value) {
    senderID.value = generateGUIDAndSaveToLocalStorage();
    await getOrCreateChatId(senderID.value, receiverID);
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

async function setClientUserNameInitialize() {
  const userRef = collection(db, "chats");
  try {
    const userDocs = await getDocs(userRef);
    const userNames = userDocs.docs.map((doc) => doc.data()); // Filter by senderId
    const userSelectFilter = userNames.find((x) =>
      x.participants.includes(senderID.value)
    );

    console.log("userSelectFilter: ", userSelectFilter.participants[2]);

    if (
      userSelectFilter &&
      userSelectFilter.participants.length > 2 &&
      userSelectFilter.participants[2] !== senderID.value
    ) {
      userNameClient.value = userSelectFilter.participants[2];
    }
  } catch (error) {
    console.error("Error fetching user names:", error);
  }
}

async function initializeChat() {
  receivedMessages.value = [];

  // Lấy chatId dựa trên senderID và receiverID
  const chatId = senderID.value + "_" + receiverID;
  await setClientUserNameInitialize(chatId);
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
    setRealTimeListener();
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

function toggleEmojiPickeOff() {
  showEmojiPicker.value = false;
}

function onSelectEmoji(emoji) {
  message.value += emoji.i;
  // showEmojiPicker.value = false;
}

function openLink(link) {
  // Tạo phần tử anchor tạm thời
  const a = document.createElement("a");
  a.href = link;

  // Kiểm tra nếu liên kết thuộc Firebase Storage
  const isFirebaseStorage = link.startsWith(
    "https://firebasestorage.googleapis.com/"
  );

  // Lấy phần mở rộng của file từ URL
  const fileExtension = link.split(".").pop().toLowerCase();

  // Các loại file cần tải xuống
  const downloadableExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp", // Hình ảnh
    "pdf", // PDF
    "txt",
    "json", // Tệp văn bản và JSON
    "xls",
    "xlsx", // Excel
    "ppt",
    "pptx", // PowerPoint
    "doc",
    "docx", // Word
  ];

  // Nếu link thuộc Firebase Storage và có phần mở rộng phù hợp, cho phép tải xuống
  if (isFirebaseStorage && downloadableExtensions.includes(fileExtension)) {
    a.download = ""; // Sử dụng tên gốc của file để tải xuống
  }

  // Thêm vào DOM để thực hiện hành động
  document.body.appendChild(a);

  try {
    // Thử tải xuống
    a.click();

    // Xóa phần tử tạm thời sau khi click
    document.body.removeChild(a);

    // Đặt thời gian chờ để kiểm tra xem việc tải xuống có bắt đầu hay không
    setTimeout(() => {
      // Nếu không thành công, mở link trong tab mới
      if (!a.download) {
        throw new Error(
          "Tải xuống không thành công, mở liên kết trong tab mới"
        );
      }
    }, 1000); // Chờ 1 giây trước khi kiểm tra
  } catch (error) {
    console.error(error.message);
    // Nếu có lỗi, mở link trong tab mới
    window.open(link, "_blank");
  }
}
</script>

<template>
  <div class="chat-bubble">
    <button @click="toggleChat" class="chat-button">
      <i class="fas fa-comments"></i>
    </button>
    <div v-if="isOpen" class="chat-window">
      <div class="chat-header" style="height: 55px">
        <div style="display: flex; flex-direction: column">
          <div style="font-size: 14px; font-weight: bold">Chat</div>
          <div style="display: flex; align-items: center; gap: 5px">
            <button class="btn-set-name" @click="setUserNameClient">Set</button>
            <input
              v-model="userNameClient"
              type="text"
              placeholder="Nhập tên của bạn"
              style="
                height: 25px; /*
            Increased height for better touch target */
                font-size: 14px; /*
            Increased font size for better readability */
                padding: 0 10px; /*
            Added padding for better spacing */
                border: 1px solid #ccc; /* Added
            border for better visibility */
                border-radius: 5px; /* Added border
            radius for a smoother look */
                outline: none; /* Removed outline for
            a cleaner look */
                transition: border-color 0.3s; /* Added transition
            for focus effect */
              "
            />
          </div>
        </div>
        <button @click="toggleChat" class="close-button">&times;</button>
      </div>
      <div class="chat-messages" ref="chatMessagesRef">
        <ul>
          <li v-for="msg in receivedMessages" :key="msg.id">
            {{ msg.SenderID === senderID ? "You" : "Đông" }}:

            <!-- Kiểm tra nếu tin nhắn là URL -->
            <span v-if="isValidURL(msg.MessageContent)">
              <div
                @click="openLink(msg.MessageContent)"
                style="cursor: pointer; color: blue"
              >
                {{ msg.MessageContent }}
              </div>
            </span>

            <!-- Nếu không phải URL, hiển thị tin nhắn thông thường -->
            <span v-else>
              {{ msg.MessageContent }}
            </span>
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
          @click="toggleEmojiPickeOff"
        />
        <label
          for="file-upload"
          class="file-upload-label"
          style="margin-left: 5px"
        >
          <input
            id="file-upload"
            type="file"
            @change="handleFileUpload"
            style="display: none"
          />
          <i class="fas fa-paperclip"></i>
          <!-- Icon for file upload -->
        </label>
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

.btn-set-name {
  background-color: #00bcd4;
  border-radius: 5px;
  border: none;
  height: 25px;
  padding: 0 10px;
  font-size: 12px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-set-name:hover {
  background-color: rgb(23, 99, 240);
  color: white; /* Adding this to ensure text is visible on yellow background */
}
.btn-set-name:active {
  background-color: rgb(3, 72, 199); /* Darker yellow */
  transform: scale(0.95); /* Slight scale down effect */
}
</style>
