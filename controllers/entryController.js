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
  } = options;

  const normalizedLines = (Array.isArray(lines) ? lines : [lines]).map((line) =>
    typeof line === "string" ? { text: line } : { ...line }
  );

  if (!normalizedLines.length) {
    normalizedLines.push({ text: "" });
  }

  let estimatedWidth = minWidth;
  normalizedLines.forEach((line) => {
    const fontSize = line.fontSize ?? defaultFontSize;
    const contentWidth = Math.ceil((line.text?.length || 0) * (fontSize * 0.65));
    estimatedWidth = Math.max(estimatedWidth, padding * 2 + contentWidth);
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
        return `<tspan x="${padding}" y="${textY}" font-size="${line.fontSize}" font-weight="${fontWeight}">${content}</tspan>`;
      }

      return `<tspan x="${padding}" dy="${line.dy}" font-size="${line.fontSize}" font-weight="${fontWeight}">${content}</tspan>`;
    })
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${estimatedWidth}" height="${totalHeight}" role="img">
  <defs>
    <style>
      text { font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; fill: ${textColor}; }
    </style>
  </defs>
  <rect x="0" y="0" rx="${borderRadius}" ry="${borderRadius}" width="${estimatedWidth}" height="${totalHeight}" fill="${background}" stroke="${borderColor}" stroke-width="${borderWidth}" />
  <text x="${padding}" y="${padding}" font-size="${defaultFontSize}" xml:space="preserve">
    ${spans}
  </text>
</svg>`;

  return { svg, width: estimatedWidth, height: totalHeight };
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

    const groupedEntries = [];
    let buffer = [];
    entries.forEach((entry) => {
      buffer.push(entry.workerName);
      if (buffer.length === 6) {
        groupedEntries.push(buffer.join("  |  "));
        buffer = [];
      }
    });
    if (buffer.length) groupedEntries.push(buffer.join("  |  "));

    let isFirstGroup = true;
    groupedEntries.forEach((line) => {
      lines.push({
        text: line,
        fontSize: 24,
        lineHeight: 34,
        gapBefore: isFirstGroup ? 12 : 8,
      });
      isFirstGroup = false;
    });

    if (top5.length) {
      lines.push({ text: "추천 아가씨 TOP 5", fontSize: 30, fontWeight: "700", gapBefore: 32 });

      let isFirstRank = true;
      top5.forEach((entry, index) => {
        lines.push({
          text: `${index + 1}. ${entry.workerName}  |  합계 ${entry.total}`,
          fontSize: 24,
          lineHeight: 34,
          gapBefore: isFirstRank ? 12 : 8,
        });
        isFirstRank = false;
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
  defaultLineHeight: 34,
  padding: 40,
  background: "#ffffff",
  borderColor: "#d0d0d0",
  minWidth: 560,
};

/** 가게별 엔트리 목록 */
export async function renderStoreEntries(req, res, next) {
  try {
    const { storeNo } = req.params;

    const data = await fetchStoreEntries(storeNo);
    if (!data) return res.status(404).send("가게를 찾을 수 없습니다.");

    const { store, entries, top5 } = data;
    const totalCount = entries.length;

    const entryItems = entries
      .map((entry) => {
        const name = escapeHtml(entry.workerName);
        const mention = entry.mentionCount ?? 0;
        const insert = entry.insertCount ?? 0;
        return `<li><span class="name">${name}</span><span class="counts">멘션 ${mention} · 입력 ${insert}</span></li>`;
      })
      .join("");

    const topRankings = top5
      .map((entry, index) => {
        const name = escapeHtml(entry.workerName);
        const total = entry.total ?? 0;
        return `<li><span class="rank">${index + 1}</span><span class="name">${name}</span><span class="score">합계 ${total}</span></li>`;
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
      <h1>${escapeHtml(store.storeName)} 엔트리</h1>
      <p class="summary">총 출근인원: <strong>${totalCount}</strong>명</p>
      <section>
        <h2>엔트리 목록</h2>
        ${entries.length ? `<div class="entry-list">${entryItems} </div>` : '<div class="empty">엔트리가 없습니다.</div>'}
      </section>
      <section>
        <h2>추천 아가씨 TOP 5</h2>
        ${top5.length ? `<div class="top-list">${topRankings}</div>` : '<div class="empty">추천 데이터가 없습니다.</div>'}
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