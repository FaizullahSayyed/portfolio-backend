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
    try{
        const deleted = await projectService.deleteProject(req.params.id as string);

        if(!deleted){
            res.status(404).json({message: 'Project not found.'});
            return;
        }

        res.status(200).json({message: 'Project deleted.'});
    } catch (error) {
        next(error);
    }
};
