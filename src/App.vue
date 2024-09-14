<script setup>
import HelloWorld from "./components/HelloWorld.vue";
import CVPersonal from "./components/CVPersonal.vue"; // Thêm dòng này
</script>

<template>
  <CVPersonal
    name="John Doe"
    title="Software Developer"
    email="john.doe@example.com"
    phone="+1 234 567 890"
    location="New York, USA"
    summary="A software developer with a passion for creating innovative solutions."
  />
  <!-- <HelloWorld msg="Vite + Vue" /> -->
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
