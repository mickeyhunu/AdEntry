import { createQrSvgDataUri } from "./qrWatermark.js";

const WATERMARK_LINK = "https://open.kakao.com/o/gALpMlRg";
const WATERMARK_PHONE = "010-8031-9616";

const QR_DATA_URI = createQrSvgDataUri(WATERMARK_LINK, {
  margin: 2,
  darkColor: "#111111",
  lightColor: "#ffffff",
});

const BASE_WATERMARK = {
  phone: WATERMARK_PHONE,
  linkUrl: WATERMARK_LINK,
  linkLabel: "카카오톡 오픈채팅 바로가기",
  caption: "예약/상담 문의 환영합니다",
  overlayText: "open.kakao.com/o/gALpMlRg",
  overlayOpacity: 0.08,
  qrSize: 180,
  padding: 28,
  gap: 22,
  phoneFontSize: 54,
  linkFontSize: 28,
  captionFontSize: 24,
  linkColor: "#1155cc",
  phoneColor: "#111111",
  captionColor: "#333333",
  backgroundColor: "#f5f7ff",
  backgroundOpacity: 0.95,
};

export function getWatermarkOptions() {
  return {
    ...BASE_WATERMARK,
    qrDataUri: QR_DATA_URI,
  };
}

