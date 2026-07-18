import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// Mirrors the color tokens and fonts already defined in styles.css (:root) so
// Chakra components (Dialog, Menu, Slider, Switch) read as native to the site
// instead of Chakra's default blue theme.
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        paper: { value: "#f3f2ec" },
        paper2: { value: "#eae8df" },
        card: { value: "#fbfaf6" },
        ink: { value: "#1c2530" },
        inkSoft: { value: "#5a6570" },
        line: { value: "#dad8ce" },
        signal: { value: "#c8462e" },
        match: { value: "#1f6e5b" },
        matchSoft: { value: "#e4ede8" },
      },
      fonts: {
        heading: { value: "'Fraunces', serif" },
        body: { value: "'Epilogue', system-ui, sans-serif" },
        mono: { value: "'JetBrains Mono', ui-monospace, monospace" },
      },
      radii: {
        l2: { value: "10px" },
        l3: { value: "12px" },
      },
    },
    semanticTokens: {
      colors: {
        "chakra-body-bg": { value: "{colors.paper}" },
        "chakra-body-text": { value: "{colors.ink}" },
        "chakra-border-color": { value: "{colors.line}" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
