import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// Mirrors the color tokens and fonts already defined in styles.css (:root) so
// Chakra components (Dialog, Menu, Slider, Switch) read as native to the site
// instead of Chakra's default blue theme.
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        paper: { value: "#F6F5F0" },
        paper2: { value: "#EDEBE3" },
        paperTint: { value: "#F1EFE8" },
        card: { value: "#FFFFFF" },
        ink: { value: "#16211C" },
        inkSoft: { value: "#6B7770" },
        inkMuted: { value: "#8A948D" },
        line: { value: "#E3E1D8" },
        lineStrong: { value: "#C9C6BA" },
        signal: { value: "#C8462E" },
        match: { value: "#2F8A63" },
        matchSoft: { value: "#DCF0E4" },
        matchDeep: { value: "#1B5C40" },
      },
      fonts: {
        heading: { value: "'Fraunces', serif" },
        body: { value: "'Epilogue', system-ui, sans-serif" },
        mono: { value: "'JetBrains Mono', ui-monospace, monospace" },
      },
      radii: {
        l2: { value: "10px" },
        l3: { value: "12px" },
        l4: { value: "14px" },
        l5: { value: "16px" },
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
