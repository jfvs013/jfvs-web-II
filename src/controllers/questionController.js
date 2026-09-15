import * as questionService from "../services/questionService.js";

const allowedFields = [
  "enunciado",
  "dificuldade",
  "respostaCorreta",
  "subjectId",
  "authorId",
  "ativa",
];

const toPositiveInt = (value) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
};

const hasAllowedPatchField = (body) => {
  return allowedFields.some((field) => Object.hasOwn(body, field));
};

const hasInvalidFields = (body) => {
  return Object.keys(body).some((field) => !allowedFields.includes(field));
};

export async function getAll(req, res) {
  try {
    const questions = await questionService.getAllQuestions();

    return res.status(200).json({
      success: true,
      data: questions,
      total: questions.length,
    });
  } catch (error) {
    console.error("Erro ao buscar questões:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar questões",
    });
  }
}

export async function getById(req, res) {
  try {
    const id = toPositiveInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const question = await questionService.getQuestionById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Questão não encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Erro ao buscar questão:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar questão",
    });
  }
}

export async function create(req, res) {
  try {
    const {
      enunciado,
      dificuldade,
      respostaCorreta,
      subjectId,
      authorId,
      ativa,
    } = req.body;

    if (
      typeof enunciado !== "string" ||
      enunciado.trim() === "" ||
      dificuldade === undefined ||
      subjectId === undefined ||
      authorId === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Os campos enunciado, dificuldade, subjectId e authorId são obrigatórios",
      });
    }

    const dificuldadeNumber = Number(dificuldade);

    if (
      !Number.isInteger(dificuldadeNumber) ||
      dificuldadeNumber < 1 ||
      dificuldadeNumber > 3
    ) {
      return res.status(400).json({
        success: false,
        message: "A dificuldade deve ser um número inteiro entre 1 e 3",
      });
    }

    const subjectIdNumber = toPositiveInt(subjectId);

    if (!subjectIdNumber) {
      return res.status(400).json({
        success: false,
        message: "subjectId deve ser um número inteiro positivo",
      });
    }

    const authorIdNumber = toPositiveInt(authorId);

    if (!authorIdNumber) {
      return res.status(400).json({
        success: false,
        message: "authorId deve ser um número inteiro positivo",
      });
    }

    if (
      respostaCorreta !== undefined &&
      respostaCorreta !== null &&
      typeof respostaCorreta !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "respostaCorreta deve ser um texto ou null",
      });
    }

    if (ativa !== undefined && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ativa deve ser um booleano",
      });
    }

    const result = await questionService.createQuestion({
      enunciado,
      dificuldade: dificuldadeNumber,
      respostaCorreta,
      subjectId: subjectIdNumber,
      authorId: authorIdNumber,
      ativa,
    });

    if (!result.ok) {
      if (result.reason === "SUBJECT_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Matéria não encontrada",
        });
      }

      if (result.reason === "AUTHOR_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Autor não encontrado",
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao criar questão:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao criar questão",
    });
  }
}

export async function update(req, res) {
  try {
    const id = toPositiveInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    if (
      !req.body ||
      Object.keys(req.body).length === 0 ||
      !hasAllowedPatchField(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Informe pelo menos um campo válido para atualização",
      });
    }

    if (hasInvalidFields(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Campo inválido para atualização",
      });
    }

    const {
      enunciado,
      dificuldade,
      respostaCorreta,
      subjectId,
      authorId,
      ativa,
    } = req.body;

    if (
      enunciado !== undefined &&
      (typeof enunciado !== "string" || enunciado.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "enunciado deve ser um texto não vazio",
      });
    }

    let dificuldadeNumber;

    if (dificuldade !== undefined) {
      dificuldadeNumber = Number(dificuldade);

      if (
        !Number.isInteger(dificuldadeNumber) ||
        dificuldadeNumber < 1 ||
        dificuldadeNumber > 3
      ) {
        return res.status(400).json({
          success: false,
          message: "A dificuldade deve ser um número inteiro entre 1 e 3",
        });
      }
    }

    if (
      respostaCorreta !== undefined &&
      respostaCorreta !== null &&
      typeof respostaCorreta !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "respostaCorreta deve ser um texto ou null",
      });
    }

    if (ativa !== undefined && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ativa deve ser um booleano",
      });
    }

    let subjectIdNumber;

    if (subjectId !== undefined) {
      subjectIdNumber = toPositiveInt(subjectId);

      if (!subjectIdNumber) {
        return res.status(400).json({
          success: false,
          message: "subjectId deve ser um número inteiro positivo",
        });
      }
    }

    let authorIdNumber;

    if (authorId !== undefined) {
      authorIdNumber = toPositiveInt(authorId);

      if (!authorIdNumber) {
        return res.status(400).json({
          success: false,
          message: "authorId deve ser um número inteiro positivo",
        });
      }
    }

    const result = await questionService.updateQuestion(id, {
      ...(enunciado !== undefined && { enunciado }),
      ...(dificuldade !== undefined && {
        dificuldade: dificuldadeNumber,
      }),
      ...(respostaCorreta !== undefined && { respostaCorreta }),
      ...(subjectId !== undefined && {
        subjectId: subjectIdNumber,
      }),
      ...(authorId !== undefined && {
        authorId: authorIdNumber,
      }),
      ...(ativa !== undefined && { ativa }),
    });

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Questão não encontrada",
        });
      }

      if (result.reason === "SUBJECT_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Matéria não encontrada",
        });
      }

      if (result.reason === "AUTHOR_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Autor não encontrado",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao atualizar questão:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar questão",
    });
  }
}

export async function remove(req, res) {
  try {
    const id = toPositiveInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const result = await questionService.deleteQuestion(id);

    if (!result.ok && result.reason === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Questão não encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao excluir questão:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao excluir questão",
    });
  }
}
