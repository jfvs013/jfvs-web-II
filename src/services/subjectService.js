import prisma from "../config/database.js";

const publicProfessorSelect = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  foto: true,
};

export const getAllSubjects = async () => {
  return prisma.subject.findMany({
    include: {
      professor: {
        select: publicProfessorSelect,
      },
    },
    orderBy: { id: "asc" },
  });
};

export const getSubjectById = async (subjectId) => {
  return prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      professor: {
        select: publicProfessorSelect,
      },
    },
  });
};

export const createSubject = async (subjectData) => {
  const professor = await prisma.user.findUnique({
    where: { id: subjectData.professorId },
  });

  if (!professor) {
    return { ok: false, reason: "PROFESSOR_NOT_FOUND" };
  }

  const subject = await prisma.subject.create({
    data: {
      nome: subjectData.nome.trim(),
      professorId: subjectData.professorId,
      ativa: subjectData.ativa ?? true,
    },
  });

  return { ok: true, data: subject };
};

export const updateSubject = async (subjectId, subjectData) => {
  const subjectExists = await prisma.subject.findUnique({
    where: { id: subjectId },
  });

  if (!subjectExists) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const data = {};

  if (Object.hasOwn(subjectData, "nome")) {
    data.nome = subjectData.nome.trim();
  }

  if (Object.hasOwn(subjectData, "ativa")) {
    data.ativa = subjectData.ativa;
  }

  if (Object.hasOwn(subjectData, "professorId")) {
    const professor = await prisma.user.findUnique({
      where: { id: subjectData.professorId },
    });

    if (!professor) {
      return { ok: false, reason: "PROFESSOR_NOT_FOUND" };
    }

    data.professorId = subjectData.professorId;
  }

  const subject = await prisma.subject.update({
    where: { id: subjectId },
    data,
  });

  return { ok: true, data: subject };
};

export const deleteSubject = async (subjectId) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!subject) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  if (subject._count.questions > 0) {
    return { ok: false, reason: "SUBJECT_IN_USE" };
  }

  const deletedSubject = await prisma.subject.delete({
    where: { id: subjectId },
  });

  return { ok: true, data: deletedSubject };
};
