# ~/apps/AdEntry/deploy.sh
set -euo pipefail
BRANCH="${1:-main}"

echo ">>> Git update"
cd ~/apps/AdEntry
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH" || { echo "git pull 실패 → git reset --hard origin/$BRANCH"; git reset --hard "origin/$BRANCH"; }

npm ci || npm install
grep -q '"build"' package.json && npm run build || true

pm2 reload adentry
|| pm2 start app.js --name adentry --update-env
pm2 save


echo "DONE"

# ssh -i .\adPlusKey.pem ubuntu@13.125.253.91 --- cmd에서 우분투 접속

# sudo nano /etc/nginx/sites-available/adplus --- cmd에서 nginx 우회수정


# chmod +x ~/apps/AdEntry/deploy.sh --- sh준비
# ~/apps/AdEntry/deploy.sh --- sh실행
# sudo nginx -t && sudo systemctl reload nginx --- 적용
# pm2 restart adentry --- 재실행