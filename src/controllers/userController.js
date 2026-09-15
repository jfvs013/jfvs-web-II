import * as userService from "../services/userService.js";

const ALLOWED_FIELDS = ["nome", "email", "papel", "foto"];
const VALID_ROLES = ["PROFESSOR", "ADMIN"];

const toPositiveInt = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

const hasAllowedPatchField = (body) => {
  return ALLOWED_FIELDS.some((field) => Object.hasOwn(body, field));
};

const hasInvalidUserFields = (body) => {
  return Object.keys(body).some((field) => !ALLOWED_FIELDS.includes(field));
};

export const create = async (req, res) => {
  try {
    const { nome, email, papel, foto } = req.body;

    if (
      typeof nome !== "string" ||
      !nome.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Nome e email são obrigatórios.",
      });
    }

    if (papel !== undefined && !VALID_ROLES.includes(papel)) {
      return res.status(400).json({
        success: false,
        message: "Papel inválido.",
      });
    }

    if (foto !== undefined && foto !== null && typeof foto !== "string") {
      return res.status(400).json({
        success: false,
        message: "Foto deve ser um texto ou null.",
      });
    }

    const result = await userService.createUser({
      nome,
      email,
      papel,
      foto,
    });

    if (!result.ok && result.reason === "EMAIL_CONFLICT") {
      return res.status(409).json({
        success: false,
        message: "E-mail já cadastrado.",
      });
    }

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar usuário.",
    });
  }
};

export const getAll = async (req, res) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao buscar usuários.",
    });
  }
};

export const getById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID inválido.",
      });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao buscar usuário.",
    });
  }
};

export const update = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID inválido.",
      });
    }

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Corpo da requisição inválido.",
      });
    }

    if (!hasAllowedPatchField(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Informe ao menos um campo para atualização.",
      });
    }

    if (hasInvalidUserFields(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Campo inválido.",
      });
    }

    const { nome, email, papel, foto } = req.body;

    if (
      Object.hasOwn(req.body, "nome") &&
      (typeof nome !== "string" || !nome.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Nome deve ser um texto não vazio.",
      });
    }

    if (
      Object.hasOwn(req.body, "email") &&
      (typeof email !== "string" || !email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Email deve ser um texto não vazio.",
      });
    }

    if (Object.hasOwn(req.body, "papel") && !VALID_ROLES.includes(papel)) {
      return res.status(400).json({
        success: false,
        message: "Papel inválido.",
      });
    }

    if (
      Object.hasOwn(req.body, "foto") &&
      foto !== null &&
      typeof foto !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Foto deve ser um texto ou null.",
      });
    }

    const result = await userService.updateUser(id, req.body);

    if (!result.ok && result.reason === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    if (!result.ok && result.reason === "EMAIL_CONFLICT") {
      return res.status(409).json({
        success: false,
        message: "E-mail já cadastrado.",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar usuário.",
    });
  }
};

export const remove = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID inválido.",
      });
    }

    const result = await userService.deleteUser(id);

    if (!result.ok && result.reason === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    if (!result.ok && result.reason === "USER_IN_USE") {
      return res.status(409).json({
        success: false,
        message: "Usuário está vinculado a matérias ou questões.",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    return res.status(500).json({
      success: false,
      message: "Erro interno ao excluir usuário.",
    });
  }
};
