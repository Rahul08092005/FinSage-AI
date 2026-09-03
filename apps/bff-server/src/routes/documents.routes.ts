import multer from "multer";
import path from "path";
import { Router } from "express";
import {
  confirmDocument,
  getDocument,
  listDocuments,
  uploadDocument,
} from "../controllers/documents.controller";
import { requireAuth } from "../middleware/auth.middleware";

// Save uploaded files to the local uploads/ directory (swappable for S3 later)
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename(_req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const router = Router();

router.use(requireAuth);

router.post("/upload", upload.single("file"), uploadDocument);
router.get("/", listDocuments);
router.get("/:id", getDocument);
router.post("/:id/confirm", confirmDocument);

export default router;
