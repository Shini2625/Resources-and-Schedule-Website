import { Router } from "express";
import { healthCtrl } from "../controllers/health.controllers.js";

const router = Router();

router.route("/health").get(healthCtrl);

export default router;