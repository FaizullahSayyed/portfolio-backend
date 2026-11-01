"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProjects = getAllProjects;
exports.getProjectById = getProjectById;
exports.createProject = createProject;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
const database_1 = require("../config/database");
async function getAllProjects() {
    const result = await database_1.pool.query(`SELECT id, title, description, url, github_url AS "githubUrl",
            docker_url AS "dockerUrl", technologies, images, created_at, updated_at
        From projects
        ORDER BY created_at DESC`);
    return result.rows;
}
async function getProjectById(id) {
    const result = await database_1.pool.query(`SELECT id, title, description, url, github_url AS "githubUrl",
            docker_url AS "dockerUrl", technologies, images,
            created_at, updated_at
     FROM projects
     WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
}
async function createProject(input) {
    const result = await database_1.pool.query(`INSERT INTO projects
            (title, description, url, github_url, docker_url, technologies, images)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, description, url, github_url AS "githubUrl",
            docker_url AS "dockerUrl", technologies, images, created_at, updated_at`, [
        input.title,
        input.description,
        input.url ?? null,
        input.githubUrl ?? null,
        input.dockerUrl ?? null,
        input.technologies ?? [],
        input.images ?? [],
    ]);
    return result.rows[0];
}
async function updateProject(id, input) {
    console.info("[project.service.updateProject] updating project", {
        projectId: id,
        fields: Object.keys(input),
        githubUrlProvided: input.githubUrl !== undefined,
        dockerUrlProvided: input.dockerUrl !== undefined,
    });
    const current = await getProjectById(id);
    if (!current) {
        console.warn("[project.service.updateProject] project not found", { projectId: id });
        return null;
    }
    const updated = {
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        url: input.url === undefined ? current.url : input.url,
        githubUrl: input.githubUrl === undefined ? current.githubUrl : input.githubUrl,
        dockerUrl: input.dockerUrl === undefined ? current.dockerUrl : input.dockerUrl,
        technologies: input.technologies ?? current.technologies,
        images: input.images ?? current.images,
    };
    const result = await database_1.pool.query(`UPDATE projects
        SET title = $1,
        description = $2,
        url = $3,
        github_url = $4,
        docker_url = $5,
        technologies = $6,
        images = $7,
        updated_at = NOW()
        WHERE id = $8
        RETURNING id, title, description, url, github_url AS "githubUrl",
            docker_url AS "dockerUrl", technologies, images, created_at, updated_at`, [
        updated.title,
        updated.description,
        updated.url,
        updated.githubUrl,
        updated.dockerUrl,
        updated.technologies,
        updated.images,
        id,
    ]);
    const project = result.rows[0] ?? null;
    console.info("[project.service.updateProject] database update completed", {
        projectId: id,
        rowsAffected: result.rowCount,
        returnedProject: project !== null,
        githubUrl: project?.githubUrl === null ? "null" : project?.githubUrl ? "set" : "missing",
        dockerUrl: project?.dockerUrl === null ? "null" : project?.dockerUrl ? "set" : "missing",
    });
    return project;
}
async function deleteProject(id) {
    console.info("[project.service.deleteProject] deleting project", { projectId: id });
    const result = await database_1.pool.query(`DELETE FROM projects WHERE id = $1 RETURNING id`, [id]);
    const deleted = result.rows.length > 0;
    console.info("[project.service.deleteProject] delete completed", {
        projectId: id,
        rowsAffected: result.rowCount,
        deleted,
    });
    return deleted;
}
