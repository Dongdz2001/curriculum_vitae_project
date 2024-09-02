<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps(['isOpen'])
const emit = defineEmits(['toggle'])

const toggleChat = () => {
  emit('toggle')
}
</script>

<template>
  <div class="chat-bubble">
    <button @click="toggleChat" class="chat-button">
      <i class="fas fa-comments"></i>
    </button>
    <div v-if="isOpen" class="chat-window">
      <div class="chat-header">
        <h3>Chat</h3>
        <button @click="toggleChat" class="close-button">&times;</button>
      </div>
      <div class="chat-messages">
        <!-- Thêm nội dung chat ở đây -->
      </div>
      <div class="chat-input">
        <input type="text" placeholder="Type a message..." />
        <button>Send</button>
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
