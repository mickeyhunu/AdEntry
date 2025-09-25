import { pool } from "../config/db.js";

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
  let text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);

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

export async function renderRoomInfo(req, res, next) {
  try {
    const { storeNo } = req.params;

    const [[room]] = await pool.query(
      `SELECT r.storeNo, s.storeName, r.roomInfo, r.waitInfo, r.roomDetail, r.updatedAt
         FROM INFO_ROOM r
         JOIN INFO_STORE s ON s.storeNo = r.storeNo
        WHERE r.storeNo=?`,
      [storeNo]
    );
    if (!room) return res.status(404).send("룸현황 정보가 없습니다.");

    const roomInfoDisplay =
      Number(room.roomInfo) === 999 ? "여유" : (room.roomInfo ?? "N/A");

    const { obj: detailObj, text: detailRaw } = safeParseJSON(room.roomDetail);

    let html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
    html += `<title>${escapeHtml(room.storeName)} 룸현황</title></head><body>`;
    html += `<h1>${escapeHtml(room.storeName)} 룸현황</h1>`;
    html += `<a href="/">← 가게 목록으로</a><br/><br/>`;

    html += `<div>룸 정보: ${escapeHtml(roomInfoDisplay)}</div>`;
    html += `<div>웨이팅 정보: ${escapeHtml(room.waitInfo ?? "N/A")}</div>`;

    html += "<h3>상세 정보</h3>";
    if (detailObj) {
        const lines = flattenDetail(detailObj);
        // 중괄호/따옴표 없이, 줄바꿈만
        html += `<pre>${escapeHtml(lines.join("\n"))}</pre>`;
    } else if (detailRaw) {
        // 파싱 실패한 원본 문자열에서 { } " 제거
        const cleaned = detailRaw.replace(/[{}"]/g, "");
        html += `<pre>${escapeHtml(cleaned)}</pre>`;
    } else {
        html += "<p>상세 정보 없음</p>";
    }

    html += `<div>업데이트: ${new Date(room.updatedAt).toLocaleString("ko-KR")}</div>`;
    html += "</body></html>";

    res.send(html);
  } catch (err) {
    next(err);
  }
}
