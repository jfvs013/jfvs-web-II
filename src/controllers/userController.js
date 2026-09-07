// src/controllers/userController.js

import prisma from "../config/database.js";

export async function getUsers(req, res) {
  try {
    const usuarios = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        foto: true,
        createdAt: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: usuarios,
      total: usuarios.length,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar usuários",
    });
  }
}

export async function getUserById(req, res) {
  try {
    const id = Number(req.params.id);

    // Validação do ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const usuario = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        papel: true,
        foto: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao buscar usuário",
    });
  }
}

export async function createUser(req, res) {
  try {
    const { nome, email, papel, foto } = req.body;

    // Validação dos campos obrigatórios
    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        message: "Nome e email são obrigatórios",
      });
    }

    // Verifica se o email já existe
    const usuarioExistente = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (usuarioExistente) {
      return res.status(409).json({
        success: false,
        message: "Email já cadastrado",
      });
    }

    const usuario = await prisma.user.create({
      data: {
        nome,
        email,
        papel,
        foto,
      },
    });

    return res.status(201).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao criar usuário",
    });
  }
}