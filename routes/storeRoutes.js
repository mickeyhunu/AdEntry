import { Router } from "express";
import { renderHome } from "../controllers/storeController.js";
import {
  renderStoreEntries,
  renderStoreEntryImage,
  renderTodayImage,
} from "../controllers/entryController.js";
import { renderRoomInfo, renderRoomImage } from "../controllers/roomController.js";

const router = Router();

router.get("/", (req, res) => {
  res.redirect("/entry/home");
});

router.get("/home", renderHome);
router.get("/today", renderTodayImage);
router.get("/entrymap/:storeNo", renderStoreEntries);
router.get("/entrymap/:storeNo/entryImage", renderStoreEntryImage);
router.get("/roommap/:storeNo", renderRoomInfo);
router.get("/roommap/:storeNo/roomImage", renderRoomImage);
router.get("/roommap/:storeNo/roomimage", renderRoomImage);

export default router;
