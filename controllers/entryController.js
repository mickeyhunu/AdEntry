import { pool } from "../config/db.js";

const COMMUNITY_CHAT_URL = "https://open.kakao.com/o/gALpMlRg";
const COMMUNITY_QR_IMAGE_SRC =
  "https://quickchart.io/qr?size=240&text=https%3A%2F%2Fopen.kakao.com%2Fo%2FgALpMlRg&centerImageUrl=https%3A%2F%2Fquickchart.io%2Fstatic%2Ficons%2Fchat.svg&centerImageSizeRatio=0.22";

const PAGE_STYLES = `
  body {
    margin: 0;
    font-family: "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
    background: #f5f6fb;
    color: #1f2937;
  }

  a {
    color: #2563eb;
  }

  a:hover,
  .community-link a:hover,
  .back-link:hover,
  .qr-link:hover {
    text-decoration: underline;
  }

  .community-link {
    padding: 12px 16px;
    text-align: center;
    background: #111827;
    color: #f9fafb;
    font-size: 14px;
  }

  .community-link a {
    color: #facc15;
    font-weight: 600;
    text-decoration: none;
  }

  .container {
    max-width: 1040px;
    margin: 0 auto;
    padding: 40px 24px 64px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .page-header h1 {
    margin: 0;
    font-size: 32px;
  }

  .back-link {
    font-weight: 500;
    text-decoration: none;
  }

  .summary {
    margin: 0;
    color: #334155;
  }

  .store-section {
    background: #ffffff;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .store-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .store-header h2 {
    margin: 0;
    font-size: 28px;
  }

  .store-content {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: flex-start;
  }

  .entry-section {
    flex: 2 1 320px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .entry-section h2,
  .entry-section h3 {
    margin: 0;
    font-size: 24px;
  }

  .entry-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .entry-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    font-size: 16px;
  }

  .top-section {
    flex: 1 1 240px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    border-radius: 16px;
    border: 1px solid #dbe2ff;
    background: #f3f4ff;
  }

  .top-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .top-card h2,
  .top-card h3 {
    margin: 0;
    font-size: 24px;
  }

  .top-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .top-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
  }

  .top-list .rank {
    font-weight: 700;
    color: #1d4ed8;
    min-width: 20px;
  }

  .top-list .name {
    font-weight: 600;
  }

  .top-list .score {
    margin-left: auto;
    color: #475569;
  }

  .top-qr-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
  }

  .top-qr-card img {
    width: 160px;
    max-width: 100%;
    height: auto;
  }

  .qr-caption {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 600;
  }

  .qr-link {
    font-size: 14px;
    text-decoration: none;
  }

  .empty {
    margin: 0;
    color: #6b7280;
  }

  @media (max-width: 768px) {
    .container {
      padding: 32px 16px 48px;
    }

    .store-content {
      flex-direction: column;
    }

    .top-section {
      width: 100%;
    }
  }
`;

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

async function fetchSingleStoreEntries(storeNo, storeRow = null) {
  let store = storeRow;

  if (!store) {
    const [[foundStore]] = await pool.query(
      `SELECT storeNo, storeName
           FROM INFO_STORE
          WHERE storeNo=?`,
      [storeNo]
    );

    store = foundStore;
  }

  if (!store) {
    return null;
  }

  const [entries] = await pool.query(
    `SELECT workerName, mentionCount, insertCount, createdAt
         FROM ENTRY_TODAY
        WHERE storeNo=?
        ORDER BY createdAt DESC`,
    [store.storeNo]
  );

  const ranked = entries.map((entry) => ({
    ...entry,
    total: (entry.mentionCount * 5 || 0) + (entry.insertCount || 0),
  }));

  const top5 = [...ranked].sort((a, b) => b.total - a.total).slice(0, 5);

  return { store, entries, top5 };
}

async function fetchAllStoreEntries() {
  const [stores] = await pool.query(
    `SELECT storeNo, storeName
         FROM INFO_STORE
        ORDER BY storeNo ASC`
  );

  const results = [];

  for (const store of stores) {
    const data = await fetchSingleStoreEntries(store.storeNo, store);
    if (data) {
      results.push(data);
    }
  }

  return results;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

function buildEntryRowsHtml(entries) {
  const entryRows = chunkArray(entries, 10);
  return entryRows
    .map((row) => {
      const names = row
        .map((entry) => `<span class="entry-name">${escapeHtml(entry.workerName ?? "")}</span>`)
        .join(" ");
      return `<li class="entry-row">${names}</li>`;
    })
    .join("");
}

function buildTop5Html(top5) {
  return top5
    .map((entry, index) => {
      const name = escapeHtml(entry.workerName ?? "");
      const total = entry.total - 6 ?? 0;
      return `<li><span class="rank">${index + 1}.</span><span class="name"> ${name}</span><span class="score"> - 합계 ${total}</span></li>`;
    })
    .join("");
}

function buildCommunityQrCard() {
  return `<div class="top-qr-card">
    <img src="${COMMUNITY_QR_IMAGE_SRC}" alt="강밤 오픈채팅 QR 코드" loading="lazy" />
    <p class="qr-caption">강밤 오픈채팅</p>
    <a class="qr-link" href="${COMMUNITY_CHAT_URL}" target="_blank" rel="noopener noreferrer">${COMMUNITY_CHAT_URL}</a>
  </div>`;
}

function buildTopSection(top5, options = {}) {
  const { headingTag = "h3", containerTag = "div" } = options;
  const normalizedHeading = headingTag === "h2" ? "h2" : "h3";
  const normalizedContainer = containerTag === "section" ? "section" : "div";
  const hasTop5 = Array.isArray(top5) && top5.length > 0;
  const listMarkup = hasTop5
    ? `<ol class="top-list">${buildTop5Html(top5)}</ol>`
    : `<p class="empty">추천 데이터가 없습니다.</p>`;

  return `<${normalizedContainer} class="top-section">
    <div class="top-card">
      <${normalizedHeading}>추천 아가씨 TOP 5</${normalizedHeading}>
      ${listMarkup}
    </div>
    ${buildCommunityQrCard()}
  </${normalizedContainer}>`;
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

function buildAllStoreEntryLines(storeDataList) {
  const totalCount = storeDataList.reduce(
    (sum, data) => sum + data.entries.length,
    0
  );

  const lines = [
    { text: "전체 가게 엔트리", fontSize: 44, fontWeight: "700" },
    {
      text: `총 출근인원: ${totalCount}명 (가게 수: ${storeDataList.length}곳)`,
      fontSize: 28,
      fontWeight: "600",
      gapBefore: 16,
    },
  ];

  storeDataList.forEach((data) => {
    lines.push({
      text: data.store.storeName,
      fontSize: 34,
      fontWeight: "700",
      gapBefore: 32,
    });

    if (data.entries.length) {
      const entryRows = chunkArray(data.entries, 10);
      entryRows.forEach((row, index) => {
        lines.push({
          text: row.map((entry) => entry.workerName ?? "").join(" "),
          fontSize: 24,
          lineHeight: 34,
          gapBefore: index === 0 ? 12 : 8,
        });
      });

      if (data.top5.length) {
        lines.push({
          text: "추천 아가씨 TOP 5",
          fontSize: 28,
          fontWeight: "600",
          gapBefore: 20,
        });

        data.top5.forEach((entry, index) => {
          const total = entry.total - 6 ?? 0;
          lines.push({
            text: `${index + 1}. ${entry.workerName ?? ""} - 합계 ${total}`,
            fontSize: 24,
            lineHeight: 34,
            gapBefore: index === 0 ? 10 : 6,
          });
        });
      } else {
        lines.push({
          text: "추천 데이터가 없습니다.",
          fontSize: 24,
          lineHeight: 34,
          gapBefore: 16,
        });
      }
    } else {
      lines.push({
        text: "엔트리가 없습니다.",
        fontSize: 24,
        lineHeight: 34,
        gapBefore: 12,
      });
    }
  });

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
    const storeId = Number(storeNo);

    if (storeId === 0) {
      const storeDataList = await fetchAllStoreEntries();
      if (!storeDataList.length) return res.status(404).send("가게를 찾을 수 없습니다.");

      const totalEntries = storeDataList.reduce(
        (sum, data) => sum + data.entries.length,
        0
      );

      const sections = storeDataList
        .map(({ store, entries, top5 }) => {
          const entryListMarkup = entries.length
            ? `<ul class="entry-list">${buildEntryRowsHtml(entries)}</ul>`
            : `<p class="empty">엔트리가 없습니다.</p>`;
          const topSectionMarkup = buildTopSection(top5, {
            headingTag: "h3",
            containerTag: "div",
          });

          return `<section class="store-section">
            <header class="store-header">
              <h2>${escapeHtml(store.storeName)}</h2>
              <p class="summary">총 출근인원: <strong>${entries.length}</strong>명</p>
            </header>
            <div class="store-content">
              <div class="entry-section">
                <h3>엔트리 목록</h3>
                ${entryListMarkup}
              </div>
              ${topSectionMarkup}
            </div>
          </section>`;
        })
        .join("");

      const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>전체 가게 엔트리</title>
    <style>${PAGE_STYLES}</style>
  </head>
  <body>
      <header class="community-link">강남의 밤 소통방 "강밤" : "<a href="${COMMUNITY_CHAT_URL}" target="_blank" rel="noopener noreferrer">${COMMUNITY_CHAT_URL}</a>"</header>
      <div class="container">
        <header class="page-header">
          <h1>전체 가게 엔트리</h1>
          <a class="back-link" href="/entry/home">← 가게 목록으로</a>
        </header>
        <p class="summary">총 출근인원: <strong>${totalEntries}</strong>명 / 가게 수: <strong>${storeDataList.length}</strong>곳</p>
        ${sections}
      </div>
    </body>
  </html>`;

      res.send(html);
      return;
    }

    const data = await fetchSingleStoreEntries(storeNo);
    if (!data) return res.status(404).send("가게를 찾을 수 없습니다.");

    const { store, entries, top5 } = data;
    const totalCount = entries.length;

    const entryListMarkup = entries.length
      ? `<ul class="entry-list">${buildEntryRowsHtml(entries)}</ul>`
      : `<p class="empty">엔트리가 없습니다.</p>`;
    const entrySectionMarkup = `<section class="entry-section">
        <h2>엔트리 목록</h2>
        ${entryListMarkup}
      </section>`;
    const topSectionMarkup = buildTopSection(top5, {
      headingTag: "h2",
      containerTag: "section",
    });

    const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(store.storeName)} 엔트리</title>
    <style>${PAGE_STYLES}</style>
  </head>
  <body>
      <header class="community-link">강남의 밤 소통방 "강밤" : "<a href="${COMMUNITY_CHAT_URL}" target="_blank" rel="noopener noreferrer">${COMMUNITY_CHAT_URL}</a>"</header>
      <div class="container">
        <header class="page-header">
          <h1>${escapeHtml(store.storeName)} 엔트리</h1>
          <a class="back-link" href="/entry/home">← 가게 목록으로</a>
        </header>
        <p class="summary">총 출근인원: <strong>${totalCount}</strong>명</p>
        <div class="store-section single-store">
          <div class="store-content single">
            ${entrySectionMarkup}
            ${topSectionMarkup}
          </div>
        </div>
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

    const storeId = Number(storeNo);

    if (storeId === 0) {
      const storeDataList = await fetchAllStoreEntries();
      if (!storeDataList.length)
        return res.status(404).send("가게를 찾을 수 없습니다.");

      const lines = buildAllStoreEntryLines(storeDataList);
      const { svg } = buildCompositeSvg(lines, STORE_IMAGE_OPTIONS);

      res.set("Cache-Control", "no-store");
      res.type("image/svg+xml").send(svg);
      return;
    }

    const data = await fetchSingleStoreEntries(storeNo);
    if (!data) return res.status(404).send("가게를 찾을 수 없습니다.");

    const lines = buildStoreEntryLines(data.store, data.entries, data.top5);
    const { svg } = buildCompositeSvg(lines, STORE_IMAGE_OPTIONS);

    res.set("Cache-Control", "no-store");
    res.type("image/svg+xml").send(svg);
  } catch (err) {
    next(err);
  }
}

function getAdjustedSeoulDate(now = new Date()) {
  const timeZone = "Asia/Seoul";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  })
    .formatToParts(now)
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = Number(part.value);
      }
      return acc;
    }, {});

  let { year, month, day, hour } = parts;

  if (hour === 24) {
    hour = 0;
  }

  if (hour < 15) {
    const previousDay = new Date(Date.UTC(year, month - 1, day));
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);

    year = previousDay.getUTCFullYear();
    month = previousDay.getUTCMonth() + 1;
    day = previousDay.getUTCDate();
  }

  return new Date(Date.UTC(year, month - 1, day));
}

export function renderTodayImage(_, res) {
  const adjustedDate = getAdjustedSeoulDate();
  const todayText = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(adjustedDate);

  const svg = buildTodaySvg(todayText);

  res.set("Cache-Control", "no-store");
  res.type("image/svg+xml").send(svg);
}