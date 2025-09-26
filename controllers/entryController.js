import { pool } from "../config/db.js";

function escapeXml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createCompositeImage(lines, options = {}) {
  const {
    defaultFontSize = 24,
    defaultLineHeight = defaultFontSize * 1.4,
    padding = 24,
    background = "#ffffff",
    textColor = "#111111",
    borderRadius = 24,
    borderColor = "#dddddd",
    borderWidth = 1,
    alt = "text image",
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

  const base64 = Buffer.from(svg).toString("base64");
  return `<img src="data:image/svg+xml;base64,${base64}" alt="${escapeXml(alt)}" style="max-width:100%;height:auto;display:block;"/>`;
}

/** 가게별 엔트리 목록 */
export async function renderStoreEntries(req, res, next) {
  try {
    const { storeNo } = req.params;

    const [[store]] = await pool.query(
      `SELECT storeNo, storeName
         FROM INFO_STORE
        WHERE storeNo=?`,
      [storeNo]
    );
    if (!store) return res.status(404).send("가게를 찾을 수 없습니다.");

    const [entries] = await pool.query(
      `SELECT workerName, mentionCount, insertCount, createdAt
         FROM ENTRY_TODAY
        WHERE storeNo=?
        ORDER BY createdAt DESC`,
      [storeNo]
    );

    // 총 출근인원
    const totalCount = entries.length;

    const ranked = entries.map((entry) => ({
      ...entry,
      total: (entry.mentionCount * 5 || 0) + (entry.insertCount || 0),
    }));
    const top5 = [...ranked].sort((a, b) => b.total - a.total).slice(0, 5);

    let html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
    html += `<title>${store.storeName} 엔트리</title></head><body>`;
    html += `<h1>${store.storeName} 엔트리</h1>`;
    html += `<a href="/entry/entry">← 가게 목록으로</a><br/><br/>`;

    html += `<div>총 출근인원: <strong>${totalCount}</strong>명</div><br/>`;

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
      html += "<h2>엔트리 목록</h2>";

      let lineCount = 0;
      let buffer = "";

      lines.push({ text: "엔트리 목록", fontSize: 30, fontWeight: "700", gapBefore: 28 });

      const groupedEntries = [];
      let buffer2 = [];
      entries.forEach((entry, idx) => {
        buffer += `${entry.workerName}`;
        buffer2.push(entry.workerName);
        if (buffer2.length === 6) {
          groupedEntries.push(buffer2.join("  |  "));
          buffer2 = [];
        }

        lineCount++;
        if (lineCount < 10 && idx !== entries.length - 1) buffer += " ";
        if (lineCount === 10) {
          buffer += "<br/>";
          lineCount = 0;
        }
      });

      html += `<div>${buffer}</div>`;

      if (buffer2.length) groupedEntries.push(buffer2.join("  |  "));

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
        html += "<br/><h2>추천 아가씨 TOP 5</h2><ol>";

        lines.push({ text: "추천 아가씨 TOP 5", fontSize: 30, fontWeight: "700", gapBefore: 32 });

        let isFirstRank = true;
        top5.forEach((entry, index) => {
          html += `<li>${entry.workerName} - 합계 ${entry.total}</li>`;

          lines.push({
            text: `${index + 1}. ${entry.workerName}  |  합계 ${entry.total}`,
            fontSize: 24,
            lineHeight: 34,
            gapBefore: isFirstRank ? 12 : 8,
          });
          isFirstRank = false;
        });
        html += "</ol>";
      }
    } else {
      html += "<p>엔트리가 없습니다.</p>";

      lines.push({
        text: "엔트리가 없습니다.",
        fontSize: 24,
        lineHeight: 34,
        gapBefore: 24,
      });
    }

    html += "</body></html>";
    
    const image = createCompositeImage(lines, {
      defaultFontSize: 24,
      defaultLineHeight: 34,
      padding: 40,
      background: "#ffffff",
      borderColor: "#d0d0d0",
      alt: `${store.storeName} 엔트리 정보`,
      minWidth: 560,
    });
/*
    const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'><title>${store.storeName} 엔트리</title>
    <style>
      body { background:#f5f5f5; font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif; margin:0; padding:32px; display:flex; align-items:center; justify-content:center; }
    </style>
    </head><body>${image}</body></html>`;*/

    res.send(html);
  } catch (err) {
    next(err);
  }
}