import { Router } from "express";
import { renderHome } from "../controllers/storeController.js";
import { renderStoreEntries, renderStoreEntryImage, } from "../controllers/entryController.js";
import { renderRoomInfo } from "../controllers/roomController.js";

const router = Router();

router.get("/entry", renderHome);
router.get("/store/:storeNo", renderStoreEntries);
router.get("/store/:storeNo/image", renderStoreEntryImage);
router.get("/room/:storeNo", renderRoomInfo);

export default router;