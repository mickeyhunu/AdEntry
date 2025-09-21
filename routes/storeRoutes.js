import { Router } from "express";
import { renderHome } from "../controllers/storeController.js";
import { renderStoreEntries } from "../controllers/entryController.js";
import { renderRoomInfo } from "../controllers/roomController.js";

const router = Router();

router.get("/", renderHome);
router.get("/store/:storeNo", renderStoreEntries);
router.get("/room/:storeNo", renderRoomInfo);

export default router;
