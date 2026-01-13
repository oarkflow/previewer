import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isLib = mode === "lib";

    return {
        plugins: [
            react(),
            mode === "development" && componentTagger(),
            isLib && dts({
                insertTypesEntry: true,
                exclude: [
                    "eslint.config.js",
                    "vite.config.ts",
                    "tailwind.config.ts",
                    "postcss.config.js",
                ],
            }),
        ].filter(Boolean),
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        define: {
            global: "globalThis",
            process: {
                env: {},
            },
        },
        build: {
            lib: isLib
                ? {
                    entry: path.resolve(__dirname, "src/index.ts"),
                    name: "UniversalFileViewer",
                    formats: ["es", "umd"],
                    fileName: (format) => `universal-file-viewer.${format}.js`,
                }
                : undefined,
            sourcemap: true,
            // Keep app assets when running the lib pass
            emptyOutDir: !isLib,
            outDir: "dist",
        },
    };
});
