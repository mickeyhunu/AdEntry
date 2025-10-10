import { pool } from "../config/db.js";
import { buildCompositeSvg } from "../utils/svgBuilder.js";

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// 중첩 객체/배열을 펼쳐서 "키: 값" 줄 단위로 만들어줌
function flattenDetail(value, prefix = "", lines = [], level = 0) {
  const pad = "  ".repeat(level); // 들여쓰기(원하면 제거 가능)

  if (value === null || value === undefined) {
    lines.push(`${pad}${prefix}: `);
    return lines;
  }

  if (Array.isArray(value)) {
    value.forEach((v, i) => {
      const key = prefix ? `${prefix}.${i}` : String(i);
      flattenDetail(v, key, lines, level);
    });
    return lines;
  }

  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object") {
        flattenDetail(v, key, lines, level); // 한 줄에 경로만 두고, 하위도 같은 규칙으로
      } else {
        lines.push(`${pad}${key}: ${v ?? ""}`);
      }
    }
    return lines;
  }

  // 원시값
  lines.push(`${pad}${prefix}: ${value}`);
  return lines;
}

function safeParseJSON(raw) {
  if (raw == null) return { obj: null, text: null };

  if (typeof raw === "object" && !Buffer.isBuffer(raw)) {
    return { obj: raw, text: null };
  }
  const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);

  try {
    return { obj: JSON.parse(text), text: null };
  } catch {}

  try {
    const fixed = text
      .replace(/\r?\n|\r/g, " ")
      .replace(/([{\s,])(\w+)\s*:/g, '$1"$2":')
      .replace(/'/g, '"');
    return { obj: JSON.parse(fixed), text: null };
  } catch {}

  return { obj: null, text };
}

function extractDetailLines(detailObj, detailRaw) {
  if (detailObj) {
    return flattenDetail(detailObj);
  }

  if (typeof detailRaw === "string") {
    const cleaned = detailRaw.replace(/[{}\"]/g, "");
    return cleaned
      .split(/\r?\n|\r/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

const ROOM_IMAGE_OPTIONS = {
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

async function fetchRoomStatus(storeNo) {
  const [[room]] = await pool.query(
    `SELECT r.storeNo, s.storeName, r.roomInfo, r.waitInfo, r.roomDetail, r.updatedAt
         FROM INFO_ROOM r
         JOIN INFO_STORE s ON s.storeNo = r.storeNo
        WHERE r.storeNo=?`,
      [storeNo]
  );

  if (!room) {
    return null;
  }

  const roomInfoDisplay =
    Number(room.roomInfo) === 999 ? "여유" : (room.roomInfo ?? "N/A");
  const waitInfoDisplay = room.waitInfo ?? "N/A";
  const { obj: detailObj, text: detailRaw } = safeParseJSON(room.roomDetail);

  return {
    storeNo: room.storeNo,
    storeName: room.storeName,
    roomInfo: roomInfoDisplay,
    waitInfo: waitInfoDisplay,
    detailObj,
    detailRaw,
    updatedAt: room.updatedAt,
    updatedAtDisplay: new Date(room.updatedAt).toLocaleString("ko-KR"),
  };
}

export async function renderRoomInfo(req, res, next) {
  try {
    const { storeNo } = req.params;

    const room = await fetchRoomStatus(storeNo);
    if (!room) return res.status(404).send("룸현황 정보가 없습니다.");

    const detailLines = extractDetailLines(room.detailObj, room.detailRaw);

    let html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
    html += `<title>${escapeHtml(room.storeName)} 룸현황</title></head><body>`;
    html += `<h1>${escapeHtml(room.storeName)} 룸현황</h1>`;
    html += `<a href="/entry/home">← 가게 목록으로</a><br/><br/>`;

    html += `<div>룸 정보: ${escapeHtml(room.roomInfo)}</div>`;
    html += `<div>웨이팅 정보: ${escapeHtml(room.waitInfo)}</div>`;

    html += "<h3>상세 정보</h3>";
    if (detailLines.length) {
      html += `<pre>${escapeHtml(detailLines.join("\n"))}</pre>`;
    } else {
      html += "<p>상세 정보 없음</p>";
    }

    html += `<div>업데이트: ${escapeHtml(room.updatedAtDisplay)}</div>`;
    html += "</body></html>";

    res.send(html);
  } catch (err) {
    next(err);
  }
}

function buildRoomImageLines(room) {
  const detailLines = extractDetailLines(room.detailObj, room.detailRaw);

  const lines = [
    { text: `${room.storeName} 룸현황`, fontSize: 44, fontWeight: "700" },
    { text: `룸 정보: ${room.roomInfo}`, fontSize: 28, fontWeight: "600", gapBefore: 20 },
    { text: `웨이팅 정보: ${room.waitInfo}`, fontSize: 24, gapBefore: 12 },
  ];

  if (detailLines.length) {
    lines.push({ text: "상세 정보", fontSize: 30, fontWeight: "700", gapBefore: 28 });
    detailLines.forEach((line, index) => {
      lines.push({
        text: line,
        fontSize: 22,
        lineHeight: 32,
        gapBefore: index === 0 ? 12 : 8,
      });
    });
  } else {
    lines.push({
      text: "상세 정보 없음",
      fontSize: 24,
      lineHeight: 32,
      gapBefore: 28,
    });
  }

  lines.push({
    text: `업데이트: ${room.updatedAtDisplay}`,
    fontSize: 20,
    gapBefore: 24,
  });

  return lines;
}

export async function renderRoomImage(req, res, next) {
  try {
    const { storeNo } = req.params;

    const room = await fetchRoomStatus(storeNo);
    if (!room) return res.status(404).send("룸현황 정보가 없습니다.");

    const lines = buildRoomImageLines(room);
    const { svg } = buildCompositeSvg(lines, ROOM_IMAGE_OPTIONS);

    res.set("Cache-Control", "no-store");
    res.type("image/svg+xml").send(svg);
  } catch (err) {
    next(err);
  }
}