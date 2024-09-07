// ./stores/useGlobalState.js
import { ref, readonly } from 'vue';

const isInitialized = ref(false);

export function useGlobalState() {
  function setInitialized(value) {
    isInitialized.value = value;
  }

  return {
    isInitialized: readonly(isInitialized),
    setInitialized
  };
}
