import { pool } from "../config/database";
import type {
    Project, 
    CreateProjectInput, 
    UpdateProjectInput
} from '../types/project.types';


export async function getAllProjects(): Promise<Project[]>{
    const result = await pool.query<Project>(
        `SELECT id, title, description, url, technologies, images, created_at, updated_at
        From projects
        ORDER BY created_at DESC`,
    );
    return result.rows;
}

export async function getProjectById(
    id: string,
): Promise<Project | null> {
    const result = await pool.query<Project>(
        `SELECT id, title, description, url, technologies, images,
            created_at, updated_at
     FROM projects
     WHERE id = $1`,
    [id],
    );
    return result.rows[0] ?? null;
}

export async function createProject(input: CreateProjectInput,): Promise<Project>{
    const result = await pool.query<Project>(
        `INSERT INTO projects (title, description, url, technologies, images)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, description, url, technologies, images, created_at, updated_at`,
        [
            input.title,
            input.description,
            input.url ?? null,
            input.technologies ?? [],
            input.images ?? [],
        ],
    )
    
        return result.rows[0];
}

export async function updateProject(
    id: string,
    input: UpdateProjectInput,
): Promise<Project | null> {
    const current = await getProjectById(id);
    if (!current) return null;
    const updated = {
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        url: input.url === undefined ? current.url : input.url,
        technologies: input.technologies ?? current.technologies,
        images: input.images ?? current.images,
    };

    const result = await pool.query<Project>(
        `UPDATE projects
        SET title = $1,
        description = $2,
        url = $3,
        technologies = $4,
        images = $5,
        updated_at = NOW()
        WHERE id = $6
        RETURNING id, title, description, url, technologies, images, created_at, updated_at`,
        [
            updated.title,
            updated.description,
            updated.url,
            updated.technologies,
            updated.images,
            id,
        ],
    );

    return result.rows[0] ?? null;
}

export async function deleteProject(id: string): Promise<boolean> {
    console.info("[project.service.deleteProject] deleting project", { projectId: id });
    const result = await pool.query<{ id: string }>(
        `DELETE FROM projects WHERE id = $1 RETURNING id`,
        [id],
    );
    const deleted = result.rows.length > 0;

    console.info("[project.service.deleteProject] delete completed", {
        projectId: id,
        rowsAffected: result.rowCount,
        deleted,
    });

    return deleted;
}