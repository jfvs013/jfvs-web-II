import * as subjectService from "../services/subjectService.js";

const toPositiveInt = (value) => {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }

  return number;
};

const allowedFields = ["nome", "ativa", "professorId"];

const hasAllowedPatchField = (body) => {
  return allowedFields.some((field) => Object.hasOwn(body, field));
};

const hasInvalidFields = (body) => {
  return Object.keys(body).some((field) => !allowedFields.includes(field));
};

export async function getAll(req, res) {
  try {
    const subjects = await subjectService.getAllSubjects();

    return res.status(200).json({
      success: true,
      data: subjects,
      total: subjects.length,
    });
  } catch (error) {
    console.error("Erro ao buscar matérias:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar matérias",
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

    const subject = await subjectService.getSubjectById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matéria não encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Erro ao buscar matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar matéria",
    });
  }
}

export async function create(req, res) {
  try {
    const { nome, professorId, ativa } = req.body;

    if (
      typeof nome !== "string" ||
      nome.trim() === "" ||
      professorId === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Nome e professorId são obrigatórios",
      });
    }

    const professorIdNumber = toPositiveInt(professorId);

    if (!professorIdNumber) {
      return res.status(400).json({
        success: false,
        message: "professorId deve ser um número inteiro positivo",
      });
    }

    if (ativa !== undefined && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ativa deve ser um booleano",
      });
    }

    const result = await subjectService.createSubject({
      nome,
      professorId: professorIdNumber,
      ativa,
    });

    if (!result.ok && result.reason === "PROFESSOR_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Professor não encontrado",
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao criar matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao criar matéria",
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

    const { nome, ativa, professorId } = req.body;

    if (
      nome !== undefined &&
      (typeof nome !== "string" || nome.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "nome deve ser um texto não vazio",
      });
    }

    if (ativa !== undefined && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ativa deve ser um booleano",
      });
    }

    let professorIdNumber;

    if (professorId !== undefined) {
      professorIdNumber = toPositiveInt(professorId);

      if (!professorIdNumber) {
        return res.status(400).json({
          success: false,
          message: "professorId deve ser um número inteiro positivo",
        });
      }
    }

    const result = await subjectService.updateSubject(id, {
      ...(nome !== undefined && { nome }),
      ...(ativa !== undefined && { ativa }),
      ...(professorId !== undefined && {
        professorId: professorIdNumber,
      }),
    });

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Matéria não encontrada",
        });
      }

      if (result.reason === "PROFESSOR_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Professor não encontrado",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao atualizar matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao atualizar matéria",
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

    const result = await subjectService.deleteSubject(id);

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Matéria não encontrada",
        });
      }

      if (result.reason === "SUBJECT_IN_USE") {
        return res.status(409).json({
          success: false,
          message: "Matéria possui questões vinculadas",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao excluir matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao excluir matéria",
    });
  }
}
