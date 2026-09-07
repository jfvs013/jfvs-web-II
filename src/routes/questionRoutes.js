import { Router } from "express";

import {
  listarQuestions,
  buscarQuestionPorId,
  criarQuestion,
} from "../controllers/questionController.js";

const router = Router();

router.get("/", listarQuestions);
router.get("/:id", buscarQuestionPorId);
router.post("/", criarQuestion);

export default router;