import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import storeRoutes from "./routes/storeRoutes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", storeRoutes);

app.get("/health", (_, res) => res.send("ok"));

/* 404 */
app.use((req, res) => {
  res.status(404).render("404", { message: "페이지를 찾을 수 없습니다." });
});

/* 에러 핸들러 - 반드시 마지막 */
app.use((err, req, res, next) => {
  console.error(err);
  // 만약 500.ejs가 또 실패하면 텍스트로라도 응답
  try {
    res.status(500).render("500", { message: err.message });
  } catch (e) {
    res.status(500).type("text").send(`Server error: ${err.message}`);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
