import prisma from "../config/database.js";

export async function listarQuestions(req, res) {
  try {
    const questions = await prisma.question.findMany({
      include: {
        subject: {
          select: {
            id: true,
            nome: true,
          },
        },
        author: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
            foto: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

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

export async function buscarQuestionPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const question = await prisma.question.findUnique({
      where: {
        id,
      },
      include: {
        subject: {
          select: {
            id: true,
            nome: true,
          },
        },
        author: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
            foto: true,
          },
        },
      },
    });

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

export async function criarQuestion(req, res) {
  try {
    const {
      enunciado,
      dificuldade,
      respostaCorreta,
      subjectId,
      authorId,
      ativa,
    } = req.body;

    if (!enunciado || !dificuldade || !subjectId || !authorId) {
      return res.status(400).json({
        success: false,
        message:
          "Os campos enunciado, dificuldade, subjectId e authorId são obrigatórios.",
      });
    }

    if (![1, 2, 3].includes(Number(dificuldade))) {
      return res.status(400).json({
        success: false,
        message: "A dificuldade deve ser 1, 2 ou 3.",
      });
    }

    const subject = await prisma.subject.findUnique({
      where: {
        id: Number(subjectId),
      },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matéria não encontrada.",
      });
    }

    const author = await prisma.user.findUnique({
      where: {
        id: Number(authorId),
      },
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Autor não encontrado.",
      });
    }

    const question = await prisma.question.create({
      data: {
        enunciado,
        dificuldade: Number(dificuldade),
        respostaCorreta,
        subjectId: Number(subjectId),
        authorId: Number(authorId),
        ativa: ativa ?? true,
      },
      include: {
        subject: {
          select: {
            id: true,
            nome: true,
          },
        },
        author: {
          select: {
            id: true,
            nome: true,
            email: true,
            papel: true,
            foto: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Erro ao criar questão:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao criar questão",
    });
  }
}