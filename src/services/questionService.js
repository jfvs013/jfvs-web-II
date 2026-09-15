import prisma from "../config/database.js";

const publicSubjectSelect = {
  id: true,
  nome: true,
};

const publicAuthorSelect = {
  id: true,
  nome: true,
  email: true,
  papel: true,
  foto: true,
};

export const getAllQuestions = async () => {
  return prisma.question.findMany({
    include: {
      subject: {
        select: publicSubjectSelect,
      },
      author: {
        select: publicAuthorSelect,
      },
    },
    orderBy: { id: "asc" },
  });
};

export const getQuestionById = async (questionId) => {
  return prisma.question.findUnique({
    where: { id: questionId },
    include: {
      subject: {
        select: publicSubjectSelect,
      },
      author: {
        select: publicAuthorSelect,
      },
    },
  });
};

export const createQuestion = async (questionData) => {
  const subject = await prisma.subject.findUnique({
    where: { id: questionData.subjectId },
  });

  if (!subject) {
    return { ok: false, reason: "SUBJECT_NOT_FOUND" };
  }

  const author = await prisma.user.findUnique({
    where: { id: questionData.authorId },
  });

  if (!author) {
    return { ok: false, reason: "AUTHOR_NOT_FOUND" };
  }

  const question = await prisma.question.create({
    data: {
      enunciado: questionData.enunciado.trim(),
      dificuldade: questionData.dificuldade,
      respostaCorreta: questionData.respostaCorreta ?? null,
      subjectId: questionData.subjectId,
      authorId: questionData.authorId,
      ativa: questionData.ativa ?? true,
    },
  });

  return { ok: true, data: question };
};

export const updateQuestion = async (questionId, questionData) => {
  const questionExists = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!questionExists) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const data = {};

  if (Object.hasOwn(questionData, "enunciado")) {
    data.enunciado = questionData.enunciado.trim();
  }

  if (Object.hasOwn(questionData, "dificuldade")) {
    data.dificuldade = questionData.dificuldade;
  }

  if (Object.hasOwn(questionData, "respostaCorreta")) {
    data.respostaCorreta = questionData.respostaCorreta;
  }

  if (Object.hasOwn(questionData, "ativa")) {
    data.ativa = questionData.ativa;
  }

  if (Object.hasOwn(questionData, "subjectId")) {
    const subject = await prisma.subject.findUnique({
      where: { id: questionData.subjectId },
    });

    if (!subject) {
      return { ok: false, reason: "SUBJECT_NOT_FOUND" };
    }

    data.subjectId = questionData.subjectId;
  }

  if (Object.hasOwn(questionData, "authorId")) {
    const author = await prisma.user.findUnique({
      where: { id: questionData.authorId },
    });

    if (!author) {
      return { ok: false, reason: "AUTHOR_NOT_FOUND" };
    }

    data.authorId = questionData.authorId;
  }

  const question = await prisma.question.update({
    where: { id: questionId },
    data,
  });

  return { ok: true, data: question };
};

export const deleteQuestion = async (questionId) => {
  const questionExists = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!questionExists) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const deletedQuestion = await prisma.question.delete({
    where: { id: questionId },
  });

  return { ok: true, data: deletedQuestion };
};
