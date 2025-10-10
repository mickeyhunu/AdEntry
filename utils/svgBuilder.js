export function buildCompositeSvg(lines, options = {}) {
  const {
    defaultFontSize = 24,
    defaultLineHeight = defaultFontSize * 1.4,
    padding = 24,
    background = "#ffffff",
    textColor = "#111111",
    borderRadius = 24,
    borderColor = "#dddddd",
    borderWidth = 1,
    minWidth = 480,
    backgroundType = "plain",
    notepadMarginOffset = 68,
    notepadTextIndent = 16,
    notepadLineSpacing = defaultLineHeight,
    notepadLineColor = "#e2e7ff",
    notepadMarginColor = "#f16b6f",
    notepadMarginWidth = 2,
    notepadHoleRadius = 6,
    notepadHoleSpacing = 110,
    notepadHoleOffsetX = padding / 2,
  } = options;

  const isNotepad = backgroundType === "notepad";
  const textStartX = isNotepad
    ? padding + notepadMarginOffset + notepadTextIndent
    : padding;
  const rightPadding = padding;

  const normalizedLines = (Array.isArray(lines) ? lines : [lines]).map((line) =>
    typeof line === "string" ? { text: line } : { ...line }
  );

  if (!normalizedLines.length) {
    normalizedLines.push({ text: "" });
  }

  let estimatedWidth = Math.max(minWidth, textStartX + rightPadding);
  normalizedLines.forEach((line) => {
    const fontSize = line.fontSize ?? defaultFontSize;
    const contentWidth = Math.ceil((line.text?.length || 0) * (fontSize * 0.65));
    estimatedWidth = Math.max(
      estimatedWidth,
      textStartX + contentWidth + rightPadding
    );
  });

  let totalHeight = padding;
  const metrics = normalizedLines.map((line, index) => {
    const fontSize = line.fontSize ?? defaultFontSize;
    const lineHeight = line.lineHeight ?? defaultLineHeight;
    const gapBefore = index === 0 ? 0 : line.gapBefore ?? 0;
    const dy = index === 0 ? 0 : gapBefore + lineHeight;

    totalHeight += index === 0 ? fontSize : dy;

    return {
      ...line,
      fontSize,
      lineHeight,
      gapBefore,
      dy,
    };
  });
  totalHeight += padding;

  let textY = padding;
  const spans = metrics
    .map((line, index) => {
      const fontWeight = line.fontWeight ?? "normal";
      const content = escapeXml(line.text ?? "");

      if (index === 0) {
        textY += line.fontSize;
        return `<tspan x="${textStartX}" y="${textY}" font-size="${line.fontSize}" font-weight="${fontWeight}">${content}</tspan>`;
      }

      return `<tspan x="${textStartX}" dy="${line.dy}" font-size="${line.fontSize}" font-weight="${fontWeight}">${content}</tspan>`;
    })
    .join("");

  const baseBackground = `<rect x="0" y="0" rx="${borderRadius}" ry="${borderRadius}" width="${estimatedWidth}" height="${totalHeight}" fill="${background}" stroke="${borderColor}" stroke-width="${borderWidth}" />`;

  let decorativeLayers = "";

  if (isNotepad) {
    const horizontalLines = [];
    const startY = padding + defaultLineHeight;
    const maxY = totalHeight - padding;

    for (let y = startY; y <= maxY; y += notepadLineSpacing) {
      horizontalLines.push(
        `<line x1="${padding}" y1="${y}" x2="${estimatedWidth - padding}" y2="${y}" stroke="${notepadLineColor}" stroke-width="1" />`
      );
    }

    const holeElements = [];
    const holeStartY = padding + notepadHoleRadius + 4;
    for (let y = holeStartY; y < totalHeight - padding; y += notepadHoleSpacing) {
      holeElements.push(
        `<circle cx="${notepadHoleOffsetX}" cy="${y}" r="${notepadHoleRadius}" fill="#ffffff" stroke="#d0d0d0" stroke-width="1" />`
      );
    }

    const marginX = padding + notepadMarginOffset;
    const marginLayer =
      notepadMarginWidth > 0
        ? `<line x1="${marginX}" y1="${padding}" x2="${marginX}" y2="${totalHeight - padding}" stroke="${notepadMarginColor}" stroke-width="${notepadMarginWidth}" />`
        : "";

    decorativeLayers = [
      ...horizontalLines,
      marginLayer,
      ...holeElements,
    ]
      .filter(Boolean)
      .join("\n    ");
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${estimatedWidth}" height="${totalHeight}" role="img">
  <defs>
    <style>
      text { font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; fill: ${textColor}; }
    </style>
  </defs>
  ${baseBackground}
  ${decorativeLayers}
  <text x="${textStartX}" y="${padding}" font-size="${defaultFontSize}" xml:space="preserve">
    ${spans}
  </text>
</svg>`;

  return { svg, width: estimatedWidth, height: totalHeight };
}

function escapeXml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

