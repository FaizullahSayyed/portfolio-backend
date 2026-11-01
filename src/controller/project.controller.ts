import type {RequestHandler} from "express";
import * as projectService from "../services/project.service";
import { createProjectSchema, updateProjectSchema } from "../validators/project.validatos"; 

const summarizeUrlInput = (value: unknown) => {
    if (value === undefined) return { state: "omitted" };
    if (value === null) return { state: "null" };
    if (typeof value !== "string") return { state: "invalid-type", type: typeof value };

    const trimmed = value.trim();
    if (trimmed.length === 0) return { state: "empty" };

    try {
        const url = new URL(trimmed);
        return {
            state: url.protocol === "http:" || url.protocol === "https:" ? "set" : "invalid",
            protocol: url.protocol,
            host: url.host,
        };
    } catch {
        return { state: "invalid-url", length: trimmed.length };
    }
};

export const getProjects: RequestHandler = async (req, res, next) => {
    try {
        const projects = await projectService.getAllProjects();
        res.status(200).json({data: projects});
    } catch (error) {
        next(error);
    }
};

export const getProject : RequestHandler =  async (req, res, next) => {
    try{
        const project = await projectService.getProjectById(req.params.id as string);

        if(!project){
            res.status(404).json({message: 'Project not found.'});
            return;
        }

        res.status(200).json({data: project});
    } catch(error){
        next(error)
    }
}

export const createProject: RequestHandler = async (req, res, next) => {
    try{
        const parsed = createProjectSchema.safeParse(req.body);

        if(!parsed.success){
            res.status(400).json({
                message: 'Invalid project details',
                errors: parsed.error.flatten(),
            });
            return;
        }

        const project = await projectService.createProject(parsed.data)
        res.status(201).json({message:'Project created.', data: project
        })
    }catch(error){
        next(error)
    }
}

export const updateProject: RequestHandler = async (req, res, next) => {
    const projectId = req.params.id;
    const bodyKeys =
        typeof req.body === "object" && req.body !== null
            ? Object.keys(req.body)
            : [];
    console.info("[project.controller.updateProject] request received", {
        method: req.method,
        path: req.originalUrl,
        projectId,
        contentType: req.get("Content-Type"),
        contentLength: req.get("Content-Length"),
        bodyKeys,
        githubUrl: summarizeUrlInput(req.body?.githubUrl),
        dockerUrl: summarizeUrlInput(req.body?.dockerUrl),
    });

    if (
        typeof projectId !== "string" ||
        !/^\d+$/.test(projectId) ||
        !Number.isSafeInteger(Number(projectId)) ||
        Number(projectId) < 1
    ) {
        res.status(400).json({ message: "Project ID must be a positive integer." });
        return;
    }

    try{
        const parsed = updateProjectSchema.safeParse(req.body);

        if(!parsed.success){
            console.warn("[project.controller.updateProject] validation failed", {
                projectId,
                statusCode: 400,
                issues: parsed.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    code: issue.code,
                })),
            });
            res.status(400).json({
                message: 'Invalid project details',
                errors: parsed.error.flatten(),
            });
            return;
        }

        const project = await projectService.updateProject(projectId, parsed.data);

        if(!project){
            console.warn("[project.controller.updateProject] project not found", {
                projectId,
                statusCode: 404,
            });
            res.status(404).json({message: 'Project not found.'});
            return;
        }

        console.info("[project.controller.updateProject] update succeeded", {
            projectId,
            statusCode: 200,
            githubUrl: project.githubUrl === null ? "null" : "set",
            dockerUrl: project.dockerUrl === null ? "null" : "set",
        });
        res.status(200).json({ data: project });
    } catch (error) {
        const databaseErrorCode =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            typeof error.code === "string"
                ? error.code
                : undefined;
        console.error("[project.controller.updateProject] update failed", {
            projectId,
            statusCode: 500,
            databaseErrorCode,
        });
        next(error);
    }
};

export const deleteProject: RequestHandler = async (req, res, next) => {
    const projectId = req.params.id;
    console.info("[project.controller.deleteProject] request received", { projectId });

    if (
        typeof projectId !== "string" ||
        !/^\d+$/.test(projectId) ||
        !Number.isSafeInteger(Number(projectId)) ||
        Number(projectId) < 1
    ) {
        console.warn("[project.controller.deleteProject] invalid project id", { projectId });
        res.status(400).json({ message: "Project ID must be a positive integer." });
        return;
    }

    try {
        const deleted = await projectService.deleteProject(projectId);
        console.info("[project.controller.deleteProject] service returned", { projectId, deleted });

        if (!deleted) {
            console.warn("[project.controller.deleteProject] project not found", { projectId });
            res.status(404).json({ message: "Project not found." });
            return;
        }

        const response = { message: "Project deleted." };
        console.info("[project.controller.deleteProject] response sent", {
            projectId,
            statusCode: 200,
            response,
        });
        res.status(200).json(response);
    } catch (error) {
        const databaseErrorCode =
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            typeof error.code === "string"
                ? error.code
                : undefined;

        if (databaseErrorCode === "22P02" || databaseErrorCode === "22003") {
            console.warn("[project.controller.deleteProject] database rejected project id", {
                projectId,
                databaseErrorCode,
            });
            res.status(400).json({ message: "Project ID must be a valid project identifier." });
            return;
        }

        if (databaseErrorCode === "23503") {
            console.warn("[project.controller.deleteProject] project is referenced by other records", {
                projectId,
            });
            res.status(409).json({
                message: "Project cannot be deleted because it is referenced by other records.",
            });
            return;
        }

        next(error);
    }
};
