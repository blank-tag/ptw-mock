/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0c0f14",
        surface: "#151921",
        surface2: "#1c2230",
        "c-border": "#2a3142",
        txt: "#e2e6ee",
        muted: "#8a92a6",
        accent: "#6c8cff",
        cgreen: "#6cffa8",
        corange: "#ffc46c",
        cred: "#ff6c8c",
        cpurple: "#c46cff",
      },
    },
  },
  plugins: [],
};

