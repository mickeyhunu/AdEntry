import { pool } from "../config/db.js";

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

    // 합계 계산
    const ranked = entries.map(e => ({
      ...e,
      total: (e.mentionCount * 5 || 0) + (e.insertCount || 0),
    }));
    const top5 = [...ranked].sort((a, b) => b.total - a.total).slice(0, 5);

    let html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
    html += `<title>${store.storeName} 엔트리</title></head><body>`;
    html += `<h1>${store.storeName} 엔트리</h1>`;
    html += `<a href="/entry">← 가게 목록으로</a><br/><br/>`;

    html += `<div>총 출근인원: <strong>${totalCount}</strong>명</div><br/>`;

    if (entries.length) {
      html += "<h2>엔트리 목록</h2>";

      let lineCount = 0;
      let buffer = "";
      entries.forEach((e, idx) => {
        buffer += `${e.workerName}`;
        lineCount++;
        if (lineCount < 10 && idx !== entries.length - 1) buffer += " ";
        if (lineCount === 10) {
          buffer += "<br/>";
          lineCount = 0;
        }
      });
      html += `<div>${buffer}</div>`;

      if (top5.length) {
        html += "<br/><h2>추천 아가씨 TOP 5</h2><ol>";
        top5.forEach((e) => {
          html += `<li>${e.workerName} - 합계 ${e.total}</li>`;
        });
        html += "</ol>";
      }
    } else {
      html += "<p>엔트리가 없습니다.</p>";
    }

    html += "</body></html>";
    res.send(html);
  } catch (err) {
    next(err);
  }
}
