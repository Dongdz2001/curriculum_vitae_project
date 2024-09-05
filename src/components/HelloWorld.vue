<script setup>
import { ref, onMounted } from 'vue'
// import { db } from 'C:/Users/dong2/OneDrive/Máy tính/CV-vue-project/curriculum_vitae_project/src/firebase.js'
import { collection, addDoc, onSnapshot, query, where, getDocs, doc, setDoc } from 'firebase/firestore'

// Biến để chứa tin nhắn, userID, và danh sách tin nhắn đã nhận
const message = ref('')
const userID = ref('') // ID người gửi (người dùng hiện tại)
const receiverID = ref('') // ID của người nhận
const receivedMessages = ref([])

// Biến socket
let socket = null

// Hàm tạo kết nối WebSocket
function createWebSocket() {
  if (!userID.value) {
    console.error('UserID is required to establish a WebSocket connection.')
    return
  }

  // Thêm userID vào URL query string
  socket = new WebSocket(`ws://localhost:5057/?userID=${userID.value}`)

  socket.onopen = () => {
    console.log('WebSocket connection established')
  }

  socket.onmessage = async (event) => {
    const receivedData = JSON.parse(event.data)

    // Khi nhận được tin nhắn, thêm tin nhắn đó vào Firestore
    try {
      await addDoc(collection(db, 'messages'), {
        SenderID: receivedData.SenderID,
        ReceiverID: receivedData.ReceiverID,
        MessageContent: receivedData.MessageContent,
        timestamp: new Date(),
      })
    } catch (e) {
      console.error('Error adding message to Firestore: ', e)
    }
  }

  socket.onclose = () => {
    console.log('WebSocket closed, attempting to reconnect...')
    setTimeout(createWebSocket, 1000) // Thử kết nối lại sau 1 giây
  }

  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

// Hàm để tạo hoặc lấy ID cuộc trò chuyện
async function getOrCreateChatId(user1, user2) {
  const chatId = [user1, user2].sort().join('_')
  const chatRef = doc(db, 'chats', chatId)
  await setDoc(chatRef, { participants: [user1, user2] }, { merge: true })
  return chatId
}

// Hàm gửi tin nhắn
async function sendMessage() {
  if (!userID.value || !receiverID.value || !message.value) {
    console.error('Please fill in all fields before sending the message.')
    return
  }

  if (!socket) {
    createWebSocket()
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    const messageObject = {
      SenderID: userID.value,
      ReceiverID: receiverID.value,
      MessageContent: message.value,
    }

    socket.send(JSON.stringify(messageObject))

    // Lưu tin nhắn vào subcollection 'messages' của document chat tương ứng
    try {
      const chatId = await getOrCreateChatId(userID.value, receiverID.value)
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        SenderID: userID.value,
        MessageContent: message.value,
        timestamp: new Date(),
      })
    } catch (e) {
      console.error('Error adding message to Firestore: ', e)
    }

    message.value = ''
  } else {
    console.error('WebSocket is not open. Current state:', socket ? socket.readyState : 'socket not initialized')
  }
}

// Lấy tin nhắn từ Firestore và theo dõi sự thay đổi
onMounted(async () => {
  if (!userID.value || !receiverID.value) return

  const chatId = await getOrCreateChatId(userID.value, receiverID.value)
  const messagesRef = collection(db, 'chats', chatId, 'messages')

  onSnapshot(messagesRef, (snapshot) => {
    receivedMessages.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  })
})

</script>

<template>
  <div>
    <input v-model="userID" placeholder="Your UserID" />
    <input v-model="receiverID" placeholder="Receiver UserID" />
    <input v-model="message" placeholder="Enter your message" />
    <button @click="sendMessage">Send Message</button>

    <ul>
      <li v-for="msg in receivedMessages" :key="msg.id">
        {{ msg.SenderID }} to {{ msg.ReceiverID }}: {{ msg.MessageContent }}
      </li>
    </ul>
  </div>
</template>



<style scoped>
.read-the-docs {
  color: #888;
}

.message-box {
  margin-top: 20px;
}

.message-box input {
  margin-right: 10px;
}

.received-messages {
  margin-top: 20px;
  text-align: left;
}

.received-messages ul {
  list-style-type: none;
  padding: 0;
}

.received-messages li {
  margin-bottom: 5px;
}
</style>
