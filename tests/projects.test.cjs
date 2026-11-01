const assert = require("node:assert/strict");
const { once } = require("node:events");
const { test } = require("node:test");
const { hash } = require("bcryptjs");
const { default: app } = require("../src/app.ts");
const { pool } = require("../src/config/database.ts");

test("project API supports optional GitHub and Docker URLs", async () => {
  const originalQuery = pool.query;
  const projects = [
    {
      id: 1,
      title: "Existing project",
      description: "Created before URL fields existed",
      url: null,
      githubUrl: null,
      dockerUrl: null,
      technologies: [],
      images: [],
      created_at: new Date("2026-01-01T00:00:00.000Z"),
      updated_at: new Date("2026-01-01T00:00:00.000Z"),
    },
  ];
  let failUpdates = false;

  pool.query = async (query, values = []) => {
    const statement = query.trimStart();
    if (statement.startsWith("SELECT") && statement.includes("WHERE id = $1")) {
      return { rows: projects.filter((project) => project.id === Number(values[0])) };
    }

    if (statement.startsWith("SELECT")) {
      return { rows: [...projects].reverse() };
    }

    if (statement.startsWith("INSERT")) {
      const [title, description, url, githubUrl, dockerUrl, technologies, images] = values;
      const project = {
        id: projects.reduce((max, item) => Math.max(max, item.id), 0) + 1,
        title,
        description,
        url,
        githubUrl,
        dockerUrl,
        technologies,
        images,
        created_at: new Date(),
        updated_at: new Date(),
      };
      projects.push(project);
      return { rows: [project] };
    }

    if (statement.startsWith("UPDATE")) {
      if (failUpdates) {
        const error = new Error("Simulated database write failure");
        error.code = "TEST_WRITE_FAILURE";
        throw error;
      }

      const [title, description, url, githubUrl, dockerUrl, technologies, images, id] = values;
      const project = projects.find((item) => item.id === Number(id));
      if (!project) return { rows: [] };
      Object.assign(project, {
        title,
        description,
        url,
        githubUrl,
        dockerUrl,
        technologies,
        images,
        updated_at: new Date(),
      });
      return { rows: [project] };
    }

    if (statement.startsWith("DELETE")) {
      const index = projects.findIndex((item) => item.id === Number(values[0]));
      if (index < 0) return { rows: [], rowCount: 0 };
      const [project] = projects.splice(index, 1);
      return { rows: [{ id: project.id }], rowCount: 1 };
    }

    throw new Error(`Unexpected SQL in test: ${query}`);
  };

  process.env.HASHED_MASTER_PASSWORD = await hash("test-only-password", 4);
  const server = app.listen(0);

  try {
    await once(server, "listening");
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}/api/projects`;
    const authorizedHeaders = {
      "Content-Type": "application/json",
      "X-Master-Password": "test-only-password",
    };

    const listResponse = await fetch(baseUrl);
    assert.equal(listResponse.status, 200);
    const listed = await listResponse.json();
    assert.equal(listed.data[0].githubUrl, null);
    assert.equal(listed.data[0].dockerUrl, null);

    const unauthorizedCreate = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unauthorized", description: "Must not create" }),
    });
    assert.equal(unauthorizedCreate.status, 401);

    const createResponse = await fetch(baseUrl, {
      method: "POST",
      headers: authorizedHeaders,
      body: JSON.stringify({
        title: "New project",
        description: "Has repository and image links",
        githubUrl: "https://github.com/example/project",
        dockerUrl: "https://hub.docker.com/r/example/project",
      }),
    });
    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()).data;
    assert.equal(created.githubUrl, "https://github.com/example/project");
    assert.equal(created.dockerUrl, "https://hub.docker.com/r/example/project");

    const emptyUrlCreate = await fetch(baseUrl, {
      method: "POST",
      headers: authorizedHeaders,
      body: JSON.stringify({
        title: "Empty optional URLs",
        description: "Empty and null links are normalized",
        githubUrl: "",
        dockerUrl: null,
      }),
    });
    assert.equal(emptyUrlCreate.status, 201);
    const emptyUrlProject = (await emptyUrlCreate.json()).data;
    assert.equal(emptyUrlProject.githubUrl, null);
    assert.equal(emptyUrlProject.dockerUrl, null);

    const updateResponse = await fetch(`${baseUrl}/${created.id}`, {
      method: "PUT",
      headers: authorizedHeaders,
      body: JSON.stringify({
        title: "Updated project",
        description: "Updated description",
        url: "https://example.com/updated",
        githubUrl: "https://github.com/example/updated",
        dockerUrl: "https://hub.docker.com/r/example/updated",
        technologies: ["TypeScript"],
        images: ["https://example.com/updated.png"],
      }),
    });
    assert.equal(updateResponse.status, 200);
    const updateBody = await updateResponse.json();
    assert.deepEqual(Object.keys(updateBody), ["data"]);
    const updated = updateBody.data;
    assert.equal(updated.title, "Updated project");
    assert.equal(updated.description, "Updated description");
    assert.equal(updated.url, "https://example.com/updated");
    assert.equal(updated.githubUrl, "https://github.com/example/updated");
    assert.equal(updated.dockerUrl, "https://hub.docker.com/r/example/updated");
    assert.deepEqual(updated.technologies, ["TypeScript"]);
    assert.deepEqual(updated.images, ["https://example.com/updated.png"]);

    const getAfterUpdateResponse = await fetch(baseUrl);
    assert.equal(getAfterUpdateResponse.status, 200);
    const getAfterUpdate = (await getAfterUpdateResponse.json()).data;
    const persisted = getAfterUpdate.find((project) => project.id === created.id);
    assert.ok(persisted);
    assert.equal(persisted.title, "Updated project");
    assert.equal(persisted.githubUrl, "https://github.com/example/updated");
    assert.equal(persisted.dockerUrl, "https://hub.docker.com/r/example/updated");
    assert.deepEqual(persisted.technologies, ["TypeScript"]);

    const clearGitHubResponse = await fetch(`${baseUrl}/${created.id}`, {
      method: "PUT",
      headers: authorizedHeaders,
      body: JSON.stringify({ githubUrl: "" }),
    });
    assert.equal(clearGitHubResponse.status, 200);
    assert.equal((await clearGitHubResponse.json()).data.githubUrl, null);

    const clearDockerResponse = await fetch(`${baseUrl}/${created.id}`, {
      method: "PUT",
      headers: authorizedHeaders,
      body: JSON.stringify({ dockerUrl: null }),
    });
    assert.equal(clearDockerResponse.status, 200);
    assert.equal((await clearDockerResponse.json()).data.dockerUrl, null);

    const getAfterClearResponse = await fetch(baseUrl);
    assert.equal(getAfterClearResponse.status, 200);
    const afterClear = (await getAfterClearResponse.json()).data.find(
      (project) => project.id === created.id,
    );
    assert.equal(afterClear.githubUrl, null);
    assert.equal(afterClear.dockerUrl, null);

    const invalidCreate = await fetch(baseUrl, {
      method: "POST",
      headers: authorizedHeaders,
      body: JSON.stringify({
        title: "Invalid URL",
        description: "Must be rejected",
        githubUrl: "javascript:alert(1)",
      }),
    });
    assert.equal(invalidCreate.status, 400);
    assert.equal((await invalidCreate.json()).message, "Invalid project details");

    const invalidUpdate = await fetch(`${baseUrl}/${created.id}`, {
      method: "PUT",
      headers: authorizedHeaders,
      body: JSON.stringify({ dockerUrl: "ftp://example.com/image" }),
    });
    assert.equal(invalidUpdate.status, 400);

    const missingProjectUpdate = await fetch(`${baseUrl}/999999`, {
      method: "PUT",
      headers: authorizedHeaders,
      body: JSON.stringify({ title: "Missing project" }),
    });
    assert.equal(missingProjectUpdate.status, 404);

    const invalidProjectIdUpdate = await fetch(`${baseUrl}/not-an-id`, {
      method: "PUT",
      headers: authorizedHeaders,
      body: JSON.stringify({ title: "Invalid project ID" }),
    });
    assert.equal(invalidProjectIdUpdate.status, 400);

    const unauthorizedUpdate = await fetch(`${baseUrl}/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubUrl: null }),
    });
    assert.equal(unauthorizedUpdate.status, 401);

    failUpdates = true;
    const failedPersistenceUpdate = await fetch(`${baseUrl}/${created.id}`, {
      method: "PUT",
      headers: authorizedHeaders,
      body: JSON.stringify({ title: "Must not report success" }),
    });
    assert.equal(failedPersistenceUpdate.status, 500);
    failUpdates = false;

    const unauthorizedDelete = await fetch(`${baseUrl}/${created.id}`, {
      method: "DELETE",
    });
    assert.equal(unauthorizedDelete.status, 401);

    const deleteResponse = await fetch(`${baseUrl}/${created.id}`, {
      method: "DELETE",
      headers: authorizedHeaders,
    });
    assert.equal(deleteResponse.status, 200);
    assert.deepEqual(await deleteResponse.json(), { message: "Project deleted." });
  } finally {
    server.close();
    pool.query = originalQuery;
  }
});
