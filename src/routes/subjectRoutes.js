//src/routes/subjectRoutes.js
import { Router } from "express";

import {
  listarSubjects,
  buscarSubjectPorId,
  criarSubject,
} from "../controllers/subjectController.js";

const router = Router();

router.get("/", listarSubjects);

router.get("/:id", buscarSubjectPorId);

router.post("/", criarSubject);

export default router;