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
router.get("/entrymap/:storeNo", renderStoreEntries);
router.get("/entrymap/:storeNo/entryImagee", renderStoreEntryImage);
router.get("/roommap/:storeNo", renderRoomInfo);
router.get("/roommap/:storeNo/roomImagee", renderRoomImage);
router.get("/today", renderTodayImage);

export default router;