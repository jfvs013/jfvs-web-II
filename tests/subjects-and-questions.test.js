import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/database.js";

const createdUserIds = [];
const createdSubjectIds = [];
const createdQuestionIds = [];

function uniqueEmail(label) {
  return `aula05-${label}-${Date.now()}-${Math.random()}@example.com`;
}

async function createUser(overrides = {}) {
  const response = await request(app)
    .post("/users")
    .send({
      nome: "Prof. Teste",
      email: uniqueEmail("user"),
      ...overrides,
    });

  if (response.status === 201) {
    createdUserIds.push(response.body.data.id);
  }

  return response;
}

async function createSubject(professorId, overrides = {}) {
  const response = await request(app)
    .post("/subjects")
    .send({
      nome: "Matéria de Teste",
      professorId,
      ...overrides,
    });

  if (response.status === 201) {
    createdSubjectIds.push(response.body.data.id);
  }

  return response;
}

async function createQuestion(subjectId, authorId, overrides = {}) {
  const response = await request(app)
    .post("/questions")
    .send({
      enunciado: "Questão de teste",
      dificuldade: 2,
      subjectId,
      authorId,
      ...overrides,
    });

  if (response.status === 201) {
    createdQuestionIds.push(response.body.data.id);
  }

  return response;
}

afterEach(async () => {
  if (createdQuestionIds.length > 0) {
    await prisma.question.deleteMany({
      where: {
        id: {
          in: createdQuestionIds.splice(0),
        },
      },
    });
  }

  if (createdSubjectIds.length > 0) {
    await prisma.subject.deleteMany({
      where: {
        id: {
          in: createdSubjectIds.splice(0),
        },
      },
    });
  }

  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: createdUserIds.splice(0),
        },
      },
    });
  }
});

describe("Subject API", () => {
  it("cria uma matéria", async () => {
    const professor = await createUser();

    const response = await createSubject(professor.body.data.id);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.nome).toBe("Matéria de Teste");
    expect(response.body.data.professorId).toBe(professor.body.data.id);
  });

  it("lista matérias", async () => {
    const professor = await createUser();

    await createSubject(professor.body.data.id);

    const response = await request(app).get("/subjects");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.total).toBe(response.body.data.length);
  });

  it("busca uma matéria por ID", async () => {
    const professor = await createUser();

    const created = await createSubject(professor.body.data.id);
    const subjectId = created.body.data.id;

    const response = await request(app).get(`/subjects/${subjectId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(subjectId);
  });

  it("valida ID de matéria", async () => {
    const invalid = await request(app).get("/subjects/abc");
    const invalidNumber = await request(app).get("/subjects/0");
    const missing = await request(app).get("/subjects/999999999");

    expect(invalid.status).toBe(400);
    expect(invalidNumber.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it("atualiza parcialmente uma matéria", async () => {
    const professor = await createUser();

    const created = await createSubject(professor.body.data.id, {
      nome: "Nome Original",
      ativa: true,
    });

    const subjectId = created.body.data.id;

    const response = await request(app).patch(`/subjects/${subjectId}`).send({
      nome: "Nome Atualizado",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.nome).toBe("Nome Atualizado");
    expect(response.body.data.ativa).toBe(true);
    expect(response.body.data.professorId).toBe(professor.body.data.id);
  });

  it("atualiza professor e status da matéria", async () => {
    const professor1 = await createUser();
    const professor2 = await createUser();

    const created = await createSubject(professor1.body.data.id);

    const response = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({
        professorId: professor2.body.data.id,
        ativa: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.professorId).toBe(professor2.body.data.id);
    expect(response.body.data.ativa).toBe(false);
  });

  it("rejeita PATCH de matéria vazio ou com campo inválido", async () => {
    const professor = await createUser();
    const created = await createSubject(professor.body.data.id);

    const empty = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({});

    const invalid = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({
        campoInexistente: "teste",
      });

    expect(empty.status).toBe(400);
    expect(invalid.status).toBe(400);
  });

  it("valida dados do PATCH de matéria", async () => {
    const professor = await createUser();
    const created = await createSubject(professor.body.data.id);

    const invalidName = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({
        nome: "   ",
      });

    const invalidActive = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({
        ativa: "false",
      });

    const invalidProfessor = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({
        professorId: 0,
      });

    expect(invalidName.status).toBe(400);
    expect(invalidActive.status).toBe(400);
    expect(invalidProfessor.status).toBe(400);
  });

  it("retorna 404 ao usar professor inexistente", async () => {
    const response = await request(app).post("/subjects").send({
      nome: "Matéria Teste",
      professorId: 999999999,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("retorna 404 ao atualizar para professor inexistente", async () => {
    const professor = await createUser();
    const created = await createSubject(professor.body.data.id);

    const response = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({
        professorId: 999999999,
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("exclui uma matéria sem questões vinculadas", async () => {
    const professor = await createUser();

    const created = await createSubject(professor.body.data.id);
    const subjectId = created.body.data.id;

    const response = await request(app).delete(`/subjects/${subjectId}`);

    const found = await request(app).get(`/subjects/${subjectId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(subjectId);
    expect(found.status).toBe(404);

    createdSubjectIds.splice(createdSubjectIds.indexOf(subjectId), 1);
  });

  it("impede excluir matéria com questões vinculadas", async () => {
    const professor = await createUser();

    const subject = await createSubject(professor.body.data.id);

    await createQuestion(subject.body.data.id, professor.body.data.id);

    const response = await request(app).delete(
      `/subjects/${subject.body.data.id}`,
    );

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });
});

describe("Question API", () => {
  it("cria uma questão", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const response = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
      {
        respostaCorreta: "Resposta correta",
      },
    );

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.enunciado).toBe("Questão de teste");
    expect(response.body.data.dificuldade).toBe(2);
    expect(response.body.data.respostaCorreta).toBe("Resposta correta");
  });

  it("lista questões", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    await createQuestion(subject.body.data.id, author.body.data.id);

    const response = await request(app).get("/questions");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.total).toBe(response.body.data.length);
  });

  it("busca uma questão por ID", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
    );

    const questionId = created.body.data.id;

    const response = await request(app).get(`/questions/${questionId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(questionId);
  });

  it("valida ID de questão", async () => {
    const invalid = await request(app).get("/questions/abc");
    const invalidNumber = await request(app).get("/questions/0");
    const missing = await request(app).get("/questions/999999999");

    expect(invalid.status).toBe(400);
    expect(invalidNumber.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it("atualiza parcialmente uma questão", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
      {
        enunciado: "Enunciado original",
        dificuldade: 1,
        ativa: true,
      },
    );

    const questionId = created.body.data.id;

    const response = await request(app).patch(`/questions/${questionId}`).send({
      enunciado: "Enunciado atualizado",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.enunciado).toBe("Enunciado atualizado");
    expect(response.body.data.dificuldade).toBe(1);
    expect(response.body.data.ativa).toBe(true);
    expect(response.body.data.subjectId).toBe(subject.body.data.id);
    expect(response.body.data.authorId).toBe(author.body.data.id);
  });

  it("atualiza dificuldade, resposta e status da questão", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
    );

    const response = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        dificuldade: 3,
        respostaCorreta: "Nova resposta",
        ativa: false,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.dificuldade).toBe(3);
    expect(response.body.data.respostaCorreta).toBe("Nova resposta");
    expect(response.body.data.ativa).toBe(false);
  });

  it("permite definir respostaCorreta como null", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
      {
        respostaCorreta: "Resposta inicial",
      },
    );

    const response = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        respostaCorreta: null,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.respostaCorreta).toBeNull();
  });

  it("rejeita PATCH de questão vazio ou com campo inválido", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
    );

    const empty = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({});

    const invalid = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        campoInexistente: "teste",
      });

    expect(empty.status).toBe(400);
    expect(invalid.status).toBe(400);
  });

  it("valida os campos do PATCH de questão", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
    );

    const invalidText = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        enunciado: "   ",
      });

    const invalidDifficulty = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        dificuldade: 4,
      });

    const invalidActive = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        ativa: "false",
      });

    const invalidAnswer = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        respostaCorreta: 123,
      });

    expect(invalidText.status).toBe(400);
    expect(invalidDifficulty.status).toBe(400);
    expect(invalidActive.status).toBe(400);
    expect(invalidAnswer.status).toBe(400);
  });

  it("retorna 404 para matéria inexistente ao criar questão", async () => {
    const author = await createUser();

    const response = await request(app).post("/questions").send({
      enunciado: "Questão teste",
      dificuldade: 2,
      subjectId: 999999999,
      authorId: author.body.data.id,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("retorna 404 para autor inexistente ao criar questão", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const response = await request(app).post("/questions").send({
      enunciado: "Questão teste",
      dificuldade: 2,
      subjectId: subject.body.data.id,
      authorId: 999999999,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("retorna 404 ao atualizar uma questão inexistente", async () => {
    const response = await request(app).patch("/questions/999999999").send({
      enunciado: "Teste",
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("retorna 404 ao atualizar para matéria inexistente", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
    );

    const response = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        subjectId: 999999999,
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("retorna 404 ao atualizar para autor inexistente", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
    );

    const response = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({
        authorId: 999999999,
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("exclui uma questão e retorna 404 depois", async () => {
    const author = await createUser();
    const subject = await createSubject(author.body.data.id);

    const created = await createQuestion(
      subject.body.data.id,
      author.body.data.id,
    );

    const questionId = created.body.data.id;

    const response = await request(app).delete(`/questions/${questionId}`);

    const found = await request(app).get(`/questions/${questionId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(questionId);
    expect(found.status).toBe(404);

    createdQuestionIds.splice(createdQuestionIds.indexOf(questionId), 1);
  });
});
