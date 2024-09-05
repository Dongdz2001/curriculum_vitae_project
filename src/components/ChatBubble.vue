<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { defineProps, defineEmits } from 'vue'
import { db } from '../firebase.js'
import { collection, addDoc, onSnapshot, doc, setDoc, query, orderBy } from 'firebase/firestore'

const props = defineProps(['isOpen'])
const emit = defineEmits(['toggle'])

const message = ref('')
const receivedMessages = ref([])
let socket = null

const senderID = ref('')
const receiverID = 'serverDongCV132413244321'

// Function to generate a GUID
function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize senderID
onMounted(() => {
  let clientId = localStorage.getItem('clientId')
  if (!clientId) {
    clientId = generateGUID()
    localStorage.setItem('clientId', clientId)
  }
  senderID.value = clientId
})

const toggleChat = () => {
  emit('toggle')
}

function createWebSocket() {
  if (!senderID.value) {
    console.error('SenderID is required to establish a WebSocket connection.')
    return
  }

  socket = new WebSocket(`wss:919b-3-84-210-56.ngrok-free.app/?userID=${senderID.value}`)

  socket.onopen = () => {
    console.log('WebSocket connection established')
  }

  socket.onmessage = async (event) => {
    const receivedData = JSON.parse(event.data)
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
    setTimeout(createWebSocket, 1000)
  }

  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

async function getOrCreateChatId(user1, user2) {
  const chatId = [user1, user2].sort().join('_')
  const chatRef = doc(db, 'chats', chatId)
  await setDoc(chatRef, { participants: [user1, user2] }, { merge: true })
  return chatId
}

async function sendMessage() {
  if (!senderID.value || !message.value) {
    console.error('Please fill in all fields before sending the message.')
    return
  }

  if (!socket) {
    createWebSocket()
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    const messageObject = {
      SenderID: senderID.value,
      ReceiverID: receiverID,
      MessageContent: message.value,
    }

    socket.send(JSON.stringify(messageObject))

    try {
      const chatId = await getOrCreateChatId(senderID.value, receiverID)
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        SenderID: senderID.value,
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

const chatMessagesRef = ref(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

onMounted(async () => {
  const chatId = await getOrCreateChatId(senderID.value, receiverID)
  const messagesRef = collection(db, 'chats', chatId, 'messages')
  const q = query(messagesRef, orderBy('timestamp', 'asc'))

  onSnapshot(q, (snapshot) => {
    receivedMessages.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    scrollToBottom()
  })

  createWebSocket()
})

</script>

<template>
  <div class="chat-bubble">
    <button @click="toggleChat" class="chat-button">
      <i class="fas fa-comments"></i>
    </button>
    <div v-if="isOpen" class="chat-window">
      <div class="chat-header" style="height: 35px;">
        <h3 >Chat</h3>
        <button @click="toggleChat" class="close-button" >&times;</button>
      </div>
      <div class="chat-messages" ref="chatMessagesRef">
        <ul>
          <li v-for="msg in receivedMessages" :key="msg.id">
            {{ msg.SenderID === senderID ? 'You' : 'Đông' }}: {{ msg.MessageContent }}
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
