import { pool } from "../config/db.js";
import { buildCompositeSvg } from "../utils/svgBuilder.js";

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
        const total = entry.total ?? 0;
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
        const total = entry.total ?? 0;
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

export async function renderTodayImage(req, res, next) {
  try {
    const now = new Date();
    const fullDateText = new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "full",
    }).format(now);
    const isoDate = now.toISOString().slice(0, 10).replace(/-/g, ".");
    const timeText = new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);

    const lines = [
      { text: "오늘의 날짜", fontSize: 44, fontWeight: "700" },
      { text: fullDateText, fontSize: 32, fontWeight: "600", gapBefore: 24 },
      { text: `${isoDate} ${timeText}`, fontSize: 26, gapBefore: 16 },
    ];

    const { svg } = buildCompositeSvg(lines, STORE_IMAGE_OPTIONS);

    res.set("Cache-Control", "no-store");
    res.type("image/svg+xml").send(svg);
  } catch (err) {
    next(err);
  }
}