<script setup>
import { ref } from 'vue'
import ChatBubble from './ChatBubble.vue' // Thêm dòng này

const name = ref('Dương Minh Đông')
const title = ref('Kỹ Sư Phần Mềm')
const email = ref('dong20012001@gmail.com')
const phone = ref('+84 348 807 912')
const location = ref('Hanoi, Vietnam')
const summary = ref('Passionate Software Engineer with expertise in web development and a strong foundation in computer science. Skilled in JavaScript, React, and Node.js, with a track record of delivering high-quality software solutions. Committed to continuous learning and staying updated with the latest industry trends.')

const education = ref([
  { degree: 'Bachelor of Science in Computer Science', school: 'FPT University', year: '2020 - 2024' },
])

const experience = ref([
  {
    position: 'Software Engineer',
    company: 'FPT Software',
    period: 'Aug 2023 - Present',
    responsibilities: [
      'Developed and maintained web applications using React and Node.js',
      'Collaborated with cross-functional teams to deliver high-quality software solutions',
      'Implemented responsive designs and ensured cross-browser compatibility',
      'Participated in code reviews and provided constructive feedback to team members',
    ],
  },
  {
    position: 'Web Developer Intern',
    company: 'Techcombank',
    period: 'Jun 2023 - Aug 2023',
    responsibilities: [
      'Assisted in the development of web applications using HTML, CSS, and JavaScript',
      'Gained hands-on experience with React and Node.js',
      'Participated in team meetings and contributed ideas for project improvements',
    ],
  },
])

const skills = ref(['JavaScript', 'React', 'Node.js', 'HTML', 'CSS', 'Git', 'Agile/Scrum'])

const isChatOpen = ref(false)

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value
}

const avatar = ref('https://scontent.fhan3-1.fna.fbcdn.net/v/t39.30808-6/275116749_3154779491446462_9067769380229703783_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFACCOjHcSUuiYUpwUM0tKPT4rNlWra2sdPis2Vatrax00m6Nhkc9VkdiqofQPJtw1uO-RSddIK3L5mwG3n5bI2&_nc_ohc=z5ixYXN0fEsQ7kNvgGNLPP_&_nc_ht=scontent.fhan3-1.fna&cb_e2o_trans=t&oh=00_AYAgFtnybD74kTH8uFDD2_Kp61j88Imat0BR_H98OVxyRg&oe=66DAEC39') // Thêm dòng này

const pdfPath = ref('https://drive.google.com/uc?export=download&id=1n2sqr2Oq-f_T6PGW9vFoI67KnKR3g9bZ') // Thêm đường dẫn đến file PDF của bạn

const showAvatarDialog = ref(false)

const toggleAvatarDialog = () => {
  showAvatarDialog.value = !showAvatarDialog.value
}
</script>

<template>
  <div class="cv-personal">
    <div class="cv-container">
      <a :href="pdfPath" target="_blank" rel="noopener noreferrer" class="print-button">
        <i class="fas fa-print"></i>
      </a>
      <header>
        <img :src="avatar" alt="Avatar" class="avatar" @click="toggleAvatarDialog">
        <h1>{{ name }}</h1>
        <p>
          <strong class="position-label" style="font-weight: 600; opacity: 0.8; font-size: 0.9em;">Vị trí ứng tuyển: </strong>
          <strong class="title">{{ title }}</strong>
        </p>
      </header>
      <section class="contact-info" style="display: flex; flex-wrap: wrap;">
        <div class="contact-item" style="flex: 1 1 auto; min-width: 200px;"><i class="fas fa-envelope"></i> {{ email }}</div>
        <div class="contact-item" style="flex: 1 1 auto; min-width: 200px;"><i class="fas fa-phone"></i> {{ phone }}</div>
        <div class="contact-item" style="flex: 1 1 auto; min-width: 200px;"><i class="fas fa-map-marker-alt"></i> {{ location }}</div>
      </section>
      <section class="summary">
        <h2>Professional Summary</h2>
        <p>{{ summary }}</p>
      </section>
      <section class="education">
        <h2>Education</h2>
        <div v-for="(edu, index) in education" :key="index">
          <h3>{{ edu.degree }}</h3>
          <p>{{ edu.school }}, {{ edu.year }}</p>
        </div>
      </section>
      <section class="experience">
        <h2>Work Experience</h2>
        <div v-for="(job, index) in experience" :key="index">
          <h3>{{ job.position }}</h3>
          <p>{{ job.company }}, {{ job.period }}</p>
          <ul>
            <li v-for="(responsibility, idx) in job.responsibilities" :key="idx">
              {{ responsibility }}
            </li>
          </ul>
        </div>
      </section>
      <section class="skills">
        <h2>Skills</h2>
        <ul>
          <li v-for="(skill, index) in skills" :key="index">{{ skill }}</li>
        </ul>
      </section>
    </div>
    <ChatBubble :is-open="isChatOpen" @toggle="toggleChat" />

    <!-- Avatar Dialog -->
    <div v-if="showAvatarDialog" class="avatar-dialog" @click="toggleAvatarDialog">
      <div class="avatar-dialog-content" @click.stop>
        <div style="position: relative;">
          <img :src="avatar" alt="Avatar" class="avatar-fullscreen" 
               :style="{ width: typeof window !== 'undefined' && window.innerWidth > 1000 ? 'auto' : '100%', 
                         height: typeof window !== 'undefined' && window.innerWidth > 1000 ? '500px' : 'auto',
                         maxHeight: '500px'
                         }">
          <span @click="toggleAvatarDialog" style="position: absolute; top: -20px; right: -10px; font-size: 24px; color: #50409A; cursor: pointer; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;">X</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv-personal {
  font-family: Arial, sans-serif;
  background-color: white;
  color: #333;
  line-height: 1.6;
  position: relative; /* Thêm dòng này */
}

.cv-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 36px;
  margin-bottom: 5px;
}

.title {
  font-size: 18px;
  color: #666;
}

h2 {
  border-bottom: 2px solid #333;
  padding-bottom: 5px;
  margin-top: 30px;
}

.contact-info {
  display: flex;
  justify-content: space-around;
  margin-bottom: 30px;
}

.contact-info p {
  display: flex;
  align-items: center;
}

.contact-info i {
  margin-right: 10px;
}

ul {
  padding-left: 20px;
}

.skills ul {
  list-style-type: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
}

.skills li {
  background-color: #f0f0f0;
  padding: 5px 10px;
  margin: 5px;
  border-radius: 5px;
}

.avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 20px;
  cursor: pointer;
}

.print-button {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.print-button:hover {
  background-color: #e0e0e0;
}

.print-button i {
  font-size: 20px;
  color: #333;
}

.avatar-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.avatar-dialog-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
}

.avatar-large {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
