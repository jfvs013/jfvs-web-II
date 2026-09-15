import prisma from "../config/database.js";

const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  foto: true,
  createdAt: true,
  updatedAt: true,
};

const normalizeEmail = (email) => email.trim().toLowerCase();

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { createdAt: "desc" },
  });
};

export const getUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
};

export const createUser = async (userData) => {
  const email = normalizeEmail(userData.email);

  const emailOwner = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (emailOwner) {
    return { ok: false, reason: "EMAIL_CONFLICT" };
  }

  try {
    const usuario = await prisma.user.create({
      data: {
        nome: userData.nome.trim(),
        email,
        papel: userData.papel ?? "PROFESSOR",
        foto: userData.foto?.trim() || null,
      },
      select: publicUserSelect,
    });

    return { ok: true, data: usuario };
  } catch (error) {
    if (error.code === "P2002") {
      return { ok: false, reason: "EMAIL_CONFLICT" };
    }

    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  const usuarioExistente = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!usuarioExistente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const data = {};

  if (Object.hasOwn(userData, "nome")) {
    data.nome = userData.nome.trim();
  }

  if (Object.hasOwn(userData, "email")) {
    const email = normalizeEmail(userData.email);

    const emailOwner = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailOwner && emailOwner.id !== userId) {
      return { ok: false, reason: "EMAIL_CONFLICT" };
    }

    data.email = email;
  }

  if (Object.hasOwn(userData, "papel")) {
    data.papel = userData.papel;
  }

  if (Object.hasOwn(userData, "foto")) {
    data.foto = userData.foto?.trim() || null;
  }

  try {
    const usuario = await prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    });

    return { ok: true, data: usuario };
  } catch (error) {
    if (error.code === "P2002") {
      return { ok: false, reason: "EMAIL_CONFLICT" };
    }

    throw error;
  }
};

export const deleteUser = async (userId) => {
  const usuarioExistente = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...publicUserSelect,
      _count: {
        select: {
          subjects: true,
          questions: true,
        },
      },
    },
  });

  if (!usuarioExistente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (
    usuarioExistente._count.subjects > 0 ||
    usuarioExistente._count.questions > 0
  ) {
    return { ok: false, reason: "USER_IN_USE" };
  }

  try {
    const usuario = await prisma.user.delete({
      where: { id: userId },
      select: publicUserSelect,
    });

    return { ok: true, data: usuario };
  } catch (error) {
    if (error.code === "P2003" || error.code === "P2014") {
      return { ok: false, reason: "USER_IN_USE" };
    }

    throw error;
  }
};
