import fs from "fs"
import os from "os"
import { defineConfig } from "vite"

let devserver = {}
if (process.env.DEV_SERVER) {
    devserver = {
        server: {
            open: true,
            host: "localhost",
            port: 5040,
        }
    }
}

export default defineConfig({
    base: "/",
    build: { sourceMap: true },
    ...devserver
})