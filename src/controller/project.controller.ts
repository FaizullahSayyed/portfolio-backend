import type {RequestHandler} from "express";
import * as projectService from "../services/project.service";
import { createProjectSchema, updateProjectSchema } from "../validators/project.validatos"; 

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
    try{
        const parsed = updateProjectSchema.safeParse(req.body);

        if(!parsed.success){
            res.status(400).json({
                message: 'Invalid project details',
                errors: parsed.error.flatten(),
            });
            return;
        }

        const project = await projectService.updateProject(req.params.id as string, parsed.data);

        if(!project){
            res.status(404).json({message: 'Project not found.'});
            return;
        }

        res.status(200).json({message: 'Project updated.', data: project});
    } catch (error) {
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
