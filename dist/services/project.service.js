"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProjects = getAllProjects;
exports.getProjectById = getProjectById;
exports.createProject = createProject;
exports.updateProject = updateProject;
exports.deleteProject = deleteProject;
const database_1 = require("../config/database");
async function getAllProjects() {
    const result = await database_1.pool.query(`SELECT id, title, description, url, technologies, images, created_at, updated_at
        From projects
        ORDER BY created_at DESC`);
    return result.rows;
}
async function getProjectById(id) {
    const result = await database_1.pool.query(`SELECT id, title, description, url, technologies, images,
            created_at, updated_at
     FROM projects
     WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
}
async function createProject(input) {
    const result = await database_1.pool.query(`INSERT INTO projects (title, description, url, technologies, images)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, description, url, technologies, images, created_at, updated_at`, [
        input.title,
        input.description,
        input.url ?? null,
        input.technologies ?? [],
        input.images ?? [],
    ]);
    return result.rows[0];
}
async function updateProject(id, input) {
    const current = await getProjectById(id);
    if (!current)
        return null;
    const updated = {
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        url: input.url === undefined ? current.url : input.url,
        technologies: input.technologies ?? current.technologies,
        images: input.images ?? current.images,
    };
    const result = await database_1.pool.query(`UPDATE projects
        SET title = $1,
        description = $2,
        url = $3,
        technologies = $4,
        images = $5,
        updated_at = NOW()
        WHERE id = $6
        RETURNING id, title, description, url, technologies, images, created_at, updated_at`, [
        updated.title,
        updated.description,
        updated.url,
        updated.technologies,
        updated.images,
        id,
    ]);
    return result.rows[0] ?? null;
}
async function deleteProject(id) {
    const result = await database_1.pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
}
