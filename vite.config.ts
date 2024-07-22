import { defineConfig } from "vite"

export default defineConfig(({command}) => ({
    base: command === 'serve' ? '/' : 'https://maheshbansod.github.io/free-key/'
}));