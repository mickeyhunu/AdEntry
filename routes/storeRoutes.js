import { Router } from "express";
import { renderHome } from "../controllers/storeController.js";
import { renderStoreEntries, renderStoreEntryImage, } from "../controllers/entryController.js";
import { renderRoomInfo, renderRoomImage } from "../controllers/roomController.js";

const router = Router();

router.get("/", (req, res) => {
  res.redirect("/entry/home");
});

router.get("/home", renderHome);
router.get("/entrymap/:storeNo", renderStoreEntries);
router.get("/entrymap/:storeNo/entryImage", renderStoreEntryImage);
router.get("/roommap/:storeNo", renderRoomInfo);
router.get("/roommap/:storeNo/roomImage", renderRoomImage);

export default router;