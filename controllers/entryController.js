import { pool } from "../config/db.js";

function escapeXml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCompositeSvg(lines, options = {}) {
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
  const rightPadding = isNotepad ? textStartX + 30 : padding;

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

function buildTodaySvg(text) {
  const width = 800;
  const height = 400;
  const safeText = escapeXml(text);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-labelledby="title">
  <title>오늘 날짜</title>
  <rect width="100%" height="100%" fill="#ffffff" />
  <text x="50%" y="50%" font-family="'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif" font-size="96" font-weight="700" fill="#111111" text-anchor="middle" dominant-baseline="middle">${safeText}</text>
</svg>`;
}

async function fetchStoreEntries(storeNo) {
  const [[store]] = await pool.query(
    `SELECT storeNo, storeName
         FROM INFO_STORE
        WHERE storeNo=?`,
      [storeNo]
  );

  if (!store) {
    return null;
  }

  const [entries] = await pool.query(
    `SELECT workerName, mentionCount, insertCount, createdAt
         FROM ENTRY_TODAY
        WHERE storeNo=?
        ORDER BY createdAt DESC`,
    [storeNo]
  );

  const ranked = entries.map((entry) => ({
    ...entry,
    total: (entry.mentionCount * 5 || 0) + (entry.insertCount || 0),
  }));

  const top5 = [...ranked].sort((a, b) => b.total - a.total).slice(0, 5);

  return { store, entries, top5 };
}

function chunkArray(items, size) {
  const chunks = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

function buildStoreEntryLines(store, entries, top5) {
  const totalCount = entries.length;

  const lines = [
    { text: `${store.storeName} 엔트리`, fontSize: 44, fontWeight: "700" },
    {
      text: `총 출근인원: ${totalCount}명`,
      fontSize: 28,
      fontWeight: "600",
      gapBefore: 16,
    },
  ];

  if (entries.length) {
    lines.push({ text: "엔트리 목록", fontSize: 30, fontWeight: "700", gapBefore: 28 });

    const entryRows = chunkArray(entries, 10);
    entryRows.forEach((row, index) => {
      const chunkText = row
        .map((entry) => entry.workerName ?? "")
        .join(" ");

      lines.push({
        text: chunkText,
        fontSize: 24,
        lineHeight: 34,
        gapBefore: index === 0 ? 12 : 8,
      });
    });

    if (top5.length) {
      lines.push({ text: "추천 아가씨 TOP 5", fontSize: 30, fontWeight: "700", gapBefore: 32 });

      top5.forEach((entry, index) => {
        const name = entry.workerName ?? "";
        const total = entry.total - 6 ?? 0;
        lines.push({
          text: `${index + 1}. ${name} - 합계 ${total}`,
          fontSize: 24,
          lineHeight: 34,
          gapBefore: index === 0 ? 12 : 8,
        });
      });
    }
  } else {
    lines.push({
      text: "엔트리가 없습니다.",
      fontSize: 24,
      lineHeight: 34,
      gapBefore: 24,
    });
  }

  return lines;
}

const STORE_IMAGE_OPTIONS = {
  defaultFontSize: 24,
  defaultLineHeight: 36,
  padding: 48,
  backgroundType: "notepad",
  background: "#fffdf5",
  borderColor: "#d7cbc1",
  borderRadius: 28,
  minWidth: 600,
  notepadMarginOffset: 70,
  notepadTextIndent: 20,
  notepadLineSpacing: 38,
  notepadLineColor: "#e2e9ff",
  notepadMarginColor: "#ff7b7d",
  notepadMarginWidth: 0,
  notepadHoleRadius: 7,
  notepadHoleSpacing: 120,
  notepadHoleOffsetX: 28,
};

/** 가게별 엔트리 목록 */
export async function renderStoreEntries(req, res, next) {
  try {
    const { storeNo } = req.params;

    const data = await fetchStoreEntries(storeNo);
    if (!data) return res.status(404).send("가게를 찾을 수 없습니다.");

    const { store, entries, top5 } = data;
    const totalCount = entries.length;

    const entryRows = chunkArray(entries, 10);
    const entryItems = entryRows
      .map((row) => {
        const names = row
          .map((entry) => `<span class="entry-name">${escapeHtml(entry.workerName ?? "")}</span>`)
          .join(" ");
        return `<li class="entry-row">${names}</li>`;
      })
      .join("  ");

    const topRankings = top5
      .map((entry, index) => {
        const name = escapeHtml(entry.workerName ?? "");
        const total = entry.total - 6 ?? 0;
        return `<li><span class="rank">${index + 1}.</span><span class="name"> ${name}</span><span class="score"> - 합계 ${total}</span></li>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(store.storeName)} 엔트리</title>
 
  </head>
  <body>
    <div class="container">
      <header class="page-header">
        <h1>${escapeHtml(store.storeName)} 엔트리</h1>
        <a class="back-link" href="/entry/home">← 가게 목록으로</a>
      </header>
      <p class="summary">총 출근인원: <strong>${totalCount}</strong>명</p>
      <section>
        <h2>엔트리 목록</h2>
        ${
          entries.length
            ? `<li class="entry-list">${entryItems}</li>`
            : `<p class="empty">엔트리가 없습니다.</p>`
        }
      </section>
      <section>
        <h2>추천 아가씨 TOP 5</h2>
        ${
          top5.length
            ? `<li class="top-list">${topRankings}</li>`
            : `<p class="empty">추천 데이터가 없습니다.</p>`
        }
      </section>
    </div>
  </body>
</html>`;

    res.send(html);
  } catch (err) {
    next(err);
  }
}

export async function renderStoreEntryImage(req, res, next) {
  try {
    const { storeNo } = req.params;

    const data = await fetchStoreEntries(storeNo);
    if (!data) return res.status(404).send("가게를 찾을 수 없습니다.");

    const lines = buildStoreEntryLines(data.store, data.entries, data.top5);
    const { svg } = buildCompositeSvg(lines, STORE_IMAGE_OPTIONS);

    res.set("Cache-Control", "no-store");
    res.type("image/svg+xml").send(svg);
  } catch (err) {
    next(err);
  }
}

export function renderTodayImage(_, res) {
  const now = new Date();
  const todayText = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(now);

  const svg = buildTodaySvg(todayText);

  res.set("Cache-Control", "no-store");
  res.type("image/svg+xml").send(svg);
}