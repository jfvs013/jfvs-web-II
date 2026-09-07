import prisma from "../config/database.js";

export async function listarSubjects(req, res) {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        professor: {
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

export async function buscarSubjectPorId(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
      });
    }

    const subject = await prisma.subject.findUnique({
      where: {
        id,
      },
      include: {
        professor: {
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

export async function criarSubject(req, res) {
  try {
    const { nome, professorId, ativa } = req.body;

    if (!nome || !professorId) {
      return res.status(400).json({
        success: false,
        message: "Nome e professorId são obrigatórios",
      });
    }

    const professor = await prisma.user.findUnique({
      where: {
        id: Number(professorId),
      },
    });

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: "Professor não encontrado",
      });
    }

    const subject = await prisma.subject.create({
      data: {
        nome,
        professorId: Number(professorId),
        ativa: ativa ?? true,
      },
      include: {
        professor: {
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
      data: subject,
    });
  } catch (error) {
    console.error("Erro ao criar matéria:", error);

    return res.status(500).json({
      success: false,
      message: "Erro ao criar matéria",
    });
  }
}