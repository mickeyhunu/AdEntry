import { pool } from "../config/db.js";

/** 메인: 가게 목록 */
export async function renderHome(req, res, next) {
  try {
    const [stores] = await pool.query(
      `SELECT storeNo, storeName
         FROM INFO_STORE
        ORDER BY storeNo ASC`
    );

    let html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>가게 목록</title></head><body>";
    html += "<h1>가게 목록</h1><ul>";
    stores.forEach((s) => {
      html += `<li>${s.storeNo} - ${s.storeName}
                 [<a href="/entry/entrymap/${s.storeNo}">엔트리 보러가기</a>]
                 [<a href="/entry/roommap/${s.storeNo}">룸현황 보러가기</a>]
              </li>`;
    });
    html +=
      '</ul><footer class="community-link">강남의 밤 소통방 "<a href="https://open.kakao.com/o/gALpMlRg" target="_blank" rel="noopener noreferrer">강밤</a>"</footer></body></html>';

    res.send(html);
  } catch (err) {
    next(err);
  }
}
