import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This mocks the process.env.API_KEY used in your services
    'process.env.API_KEY': JSON.stringify('AIzaSyBY0Sopc-0j8LjCZLUXAma38lzX7jKt_vg')
  }
});