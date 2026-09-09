// Minecraft Java Formatting Codes to Hex Colors
export const MINECRAFT_COLORS: Record<string, string> = {
  '0': '#000000', // Black
  '1': '#0000AA', // Dark Blue
  '2': '#00AA00', // Dark Green
  '3': '#00AAAA', // Dark Aqua
  '4': '#AA0000', // Dark Red
  '5': '#AA00AA', // Dark Purple
  '6': '#FFAA00', // Gold
  '7': '#AAAAAA', // Gray
  '8': '#555555', // Dark Gray
  '9': '#5555FF', // Blue
  a: '#55FF55', // Green
  b: '#55FFFF', // Aqua
  c: '#FF5555', // Red
  d: '#FF55FF', // Light Purple
  e: '#FFFF55', // Yellow
  f: '#FFFFFF', // White
  black: '#000000',
  dark_blue: '#0000AA',
  dark_green: '#00AA00',
  dark_aqua: '#00AAAA',
  dark_red: '#AA0000',
  dark_purple: '#AA00AA',
  gold: '#FFAA00',
  gray: '#AAAAAA',
  dark_gray: '#555555',
  blue: '#5555FF',
  green: '#55FF55',
  aqua: '#55FFFF',
  red: '#FF5555',
  light_purple: '#FF55FF',
  yellow: '#FFFF55',
  white: '#FFFFFF',
};

export interface FormattedSpan {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
}

// Convert JSON or Legacy MOTD to FormattedSpan array
export function parseMinecraftMOTD(description: any): FormattedSpan[] {
  if (!description) {
    return [{ text: 'A Minecraft Server', color: '#AAAAAA' }];
  }

  // If description is a plain string
  if (typeof description === 'string') {
    return parseLegacyFormatting(description);
  }

  // If description is a JSON object (Modern 1.21.4 text component)
  const spans: FormattedSpan[] = [];

  function processComponent(comp: any, inheritedColor?: string, inheritedBold?: boolean, inheritedItalic?: boolean) {
    if (!comp) return;

    if (typeof comp === 'string') {
      spans.push(...parseLegacyFormatting(comp));
      return;
    }

    const text = comp.text || '';
    const color = comp.color
      ? MINECRAFT_COLORS[comp.color.toLowerCase()] || comp.color
      : inheritedColor || '#FFFFFF';
    const bold = comp.bold ?? inheritedBold ?? false;
    const italic = comp.italic ?? inheritedItalic ?? false;
    const underlined = comp.underlined ?? false;
    const strikethrough = comp.strikethrough ?? false;

    if (text) {
      // The text itself might also contain legacy § codes
      if (text.includes('§')) {
        const sub = parseLegacyFormatting(text);
        for (const s of sub) {
          spans.push({
            text: s.text,
            color: s.color || color,
            bold: s.bold || bold,
            italic: s.italic || italic,
            underlined,
            strikethrough,
          });
        }
      } else {
        spans.push({
          text,
          color,
          bold,
          italic,
          underlined,
          strikethrough,
        });
      }
    }

    if (Array.isArray(comp.extra)) {
      for (const extra of comp.extra) {
        processComponent(extra, color, bold, italic);
      }
    }
  }

  processComponent(description);
  return spans.length > 0 ? spans : [{ text: 'A Minecraft Server', color: '#AAAAAA' }];
}

// Parse legacy § codes
export function parseLegacyFormatting(text: string): FormattedSpan[] {
  if (!text) return [];

  const spans: FormattedSpan[] = [];
  let currentColor = '#FFFFFF';
  let bold = false;
  let italic = false;
  let underlined = false;
  let strikethrough = false;

  let currentText = '';

  const pushCurrent = () => {
    if (currentText.length > 0) {
      spans.push({
        text: currentText,
        color: currentColor,
        bold,
        italic,
        underlined,
        strikethrough,
      });
      currentText = '';
    }
  };

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '§' && i + 1 < text.length) {
      const code = text[i + 1].toLowerCase();
      i++; // Skip code character

      pushCurrent();

      if (MINECRAFT_COLORS[code]) {
        currentColor = MINECRAFT_COLORS[code];
        bold = false;
        italic = false;
        underlined = false;
        strikethrough = false;
      } else if (code === 'l') {
        bold = true;
      } else if (code === 'o') {
        italic = true;
      } else if (code === 'n') {
        underlined = true;
      } else if (code === 'm') {
        strikethrough = true;
      } else if (code === 'r') {
        currentColor = '#FFFFFF';
        bold = false;
        italic = false;
        underlined = false;
        strikethrough = false;
      }
    } else {
      currentText += text[i];
    }
  }

  pushCurrent();
  return spans;
}
