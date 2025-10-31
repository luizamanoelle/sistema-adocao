import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import daisyui from "daisyui"; // 1. Importe o daisyui

export default defineConfig({
  plugins: [
    react(),
    // 2. Passe a configuração diretamente aqui
    tailwindcss({
      config: {
        // Define quais arquivos o Tailwind deve "ler"
        content: [
          "./index.html",
          "./src/**/*.{js,ts,jsx,tsx}",
        ],
        theme: {
          extend: {},
        },
        // 3. Adicione o daisyui aos plugins do Tailwind
        plugins: [
          daisyui
        ],
        // 4. Adicione a configuração de temas do daisyui
        daisyui: {
          themes: [
          ],
        },
      }
    }),
  ],
});