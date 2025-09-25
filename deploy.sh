# === AdEntry 업데이트 & 재배포 ===
APP_DIR=/apps/AdEntry
APP_NAME=adentry

cd "$APP_DIR" || { echo "❌ $APP_DIR 없음"; exit 1; }

# 1) 원격 갱신
git fetch --all --prune

# 2) 현재 브랜치 기준 fast-forward 업데이트 (로컬 변경 안 덮어씀)
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ -z "$BRANCH" ] && BRANCH="$(git symbolic-ref --short refs/remotes/origin/HEAD | cut -d/ -f2)"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

# 3) 의존성 설치
npm ci || npm install

# 4) build 스크립트가 있으면 실행(없으면 건너뜀)
grep -q '"build"' package.json && npm run build || true

# 5) PM2 무중단 재시작(처음이면 start)
pm2 describe "$APP_NAME" >/dev/null 2>&1 \
  && pm2 reload "$APP_NAME" --update-env \
  || pm2 start app.js --name "$APP_NAME" --update-env

pm2 save

# 6) 상태/로그(선택)
pm2 status "$APP_NAME"
pm2 logs "$APP_NAME" --lines 50 --timestamp


# chmod +x ~/apps/AdEntry/deploy.sh --- sh준비
# ~/apps/AdEntry/deploy.sh --- sh실행
# sudo nginx -t && sudo systemctl reload nginx --- 적용
# pm2 restart adentry --- 재실행