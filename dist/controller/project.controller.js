"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = exports.getProjects = void 0;
const projectService = __importStar(require("../services/project.service"));
const project_validatos_1 = require("../validators/project.validatos");
const getProjects = async (req, res, next) => {
    try {
        const projects = await projectService.getAllProjects();
        res.status(200).json({ data: projects });
    }
    catch (error) {
        next(error);
    }
};
exports.getProjects = getProjects;
const getProject = async (req, res, next) => {
    try {
        const project = await projectService.getProjectById(req.params.id);
        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }
        res.status(200).json({ data: project });
    }
    catch (error) {
        next(error);
    }
};
exports.getProject = getProject;
const createProject = async (req, res, next) => {
    try {
        const parsed = project_validatos_1.createProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Invalid project details',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const project = await projectService.createProject(parsed.data);
        res.status(201).json({ message: 'Project created.', data: project
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createProject = createProject;
const updateProject = async (req, res, next) => {
    try {
        const parsed = project_validatos_1.updateProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                message: 'Invalid project details',
                errors: parsed.error.flatten(),
            });
            return;
        }
        const project = await projectService.updateProject(req.params.id, parsed.data);
        if (!project) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }
        res.status(200).json({ message: 'Project updated.', data: project });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res, next) => {
    try {
        const deleted = await projectService.deleteProject(req.params.id);
        if (!deleted) {
            res.status(404).json({ message: 'Project not found.' });
            return;
        }
        res.status(200).json({ message: 'Project deleted.' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProject = deleteProject;
