// vite.config.js
import { defineConfig, transformWithEsbuild } from "file:///C:/Users/tomas/OneDrive/Desktop/inmobiliaria%20octavio/RealtorRocket-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/tomas/OneDrive/Desktop/inmobiliaria%20octavio/RealtorRocket-main/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///C:/Users/tomas/OneDrive/Desktop/inmobiliaria%20octavio/RealtorRocket-main/node_modules/tailwindcss/lib/index.js";
var vite_config_default = defineConfig({
  plugins: [
    {
      name: "treat-js-files-as-jsx",
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) return null;
        return transformWithEsbuild(code, id, {
          loader: "jsx",
          jsx: "automatic"
        });
      }
    },
    react(),
    tailwindcss()
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx0b21hc1xcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGlubW9iaWxpYXJpYSBvY3RhdmlvXFxcXFJlYWx0b3JSb2NrZXQtbWFpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdG9tYXNcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxpbm1vYmlsaWFyaWEgb2N0YXZpb1xcXFxSZWFsdG9yUm9ja2V0LW1haW5cXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3RvbWFzL09uZURyaXZlL0Rlc2t0b3AvaW5tb2JpbGlhcmlhJTIwb2N0YXZpby9SZWFsdG9yUm9ja2V0LW1haW4vdml0ZS5jb25maWcuanNcIjtpbXBvcnQge2RlZmluZUNvbmZpZywgdHJhbnNmb3JtV2l0aEVzYnVpbGR9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcInRhaWx3aW5kY3NzXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAge1xuICAgICAgbmFtZTogJ3RyZWF0LWpzLWZpbGVzLWFzLWpzeCcsXG4gICAgICBhc3luYyB0cmFuc2Zvcm0oY29kZSwgaWQpIHtcbiAgICAgICAgaWYgKCFpZC5tYXRjaCgvc3JjXFwvLipcXC5qcyQvKSkgIHJldHVybiBudWxsXG5cbiAgICAgICAgLy8gVXNlIHRoZSBleHBvc2VkIHRyYW5zZm9ybSBmcm9tIHZpdGUsIGluc3RlYWQgb2YgZGlyZWN0bHlcbiAgICAgICAgLy8gdHJhbnNmb3JtaW5nIHdpdGggZXNidWlsZFxuICAgICAgICByZXR1cm4gdHJhbnNmb3JtV2l0aEVzYnVpbGQoY29kZSwgaWQsIHtcbiAgICAgICAgICBsb2FkZXI6ICdqc3gnLFxuICAgICAgICAgIGpzeDogJ2F1dG9tYXRpYycsXG4gICAgICAgIH0pXG4gICAgICB9LFxuICAgIH0sXG4gICAgICByZWFjdCgpLFxuICAgIHRhaWx3aW5kY3NzKCldLFxuXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICBsb2FkZXI6IHtcbiAgICAgICAgJy5qcyc6ICdqc3gnLFxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVosU0FBUSxjQUFjLDRCQUEyQjtBQUN4YyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFHeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1A7QUFBQSxNQUNFLE1BQU07QUFBQSxNQUNOLE1BQU0sVUFBVSxNQUFNLElBQUk7QUFDeEIsWUFBSSxDQUFDLEdBQUcsTUFBTSxjQUFjLEVBQUksUUFBTztBQUl2QyxlQUFPLHFCQUFxQixNQUFNLElBQUk7QUFBQSxVQUNwQyxRQUFRO0FBQUEsVUFDUixLQUFLO0FBQUEsUUFDUCxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNSLFlBQVk7QUFBQSxFQUFDO0FBQUEsRUFFZixjQUFjO0FBQUEsSUFDWixnQkFBZ0I7QUFBQSxNQUNkLFFBQVE7QUFBQSxRQUNOLE9BQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
