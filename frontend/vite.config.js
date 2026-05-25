import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
      "/get_staff_list": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/get_attendance_today": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/get_detected_name": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/video_feed": { target: "http://localhost:5000", changeOrigin: true },
      "/add_staff": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
