/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 requires its Tailwind preset so RN-specific utilities resolve.
  presets: [require("nativewind/preset")],
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Gradient background stops.
        bgStart: "#E8EAF6",
        bgEnd: "#E0FFF9",

        // Primary indigo.
        primary: "#3F51B5",
        primaryDeep: "#12102A",

        // Accent pink (Save Plan).
        accentPink: "#F15BB5",

        // Teal wash used on Save Trip Plan header.
        tealWash: "#E4F5F8",

        // Text.
        textPrimary: "#3F487B",
        textSecondary: "#6C757D",
        textMuted: "#9CA3AF",

        // Neumorphic shadow sources.
        shadowDark: "#C5C7D1",
        shadowLight: "#FFFFFF",
      },
      fontFamily: {
        regular: ["Outfit_400Regular"],
        medium: ["Outfit_500Medium"],
        semibold: ["Outfit_600SemiBold"],
        bold: ["Outfit_700Bold"],
      },
      boxShadow: {
        neu: "-8px -8px 16px rgba(255, 255, 255, 1), 8px 8px 16px rgba(197, 199, 209, 1)",
        neuPressed:
          "inset -4px -4px 8px rgba(255, 255, 255, 1), inset 4px 4px 8px rgba(197, 199, 209, 1)",
      },
    },
  },
  plugins: [],
};
