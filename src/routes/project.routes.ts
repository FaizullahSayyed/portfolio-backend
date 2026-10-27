import {Router} from "express";
import {
    getProjects, getProject, createProject, updateProject, 
    deleteProject} from "../controller/project.controller";
import { requireMasterPassword } from "../middleware/master-auth.middleware";

const router = Router();

router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", requireMasterPassword, createProject);
router.put("/:id", requireMasterPassword, updateProject);
router.delete("/:id", requireMasterPassword, deleteProject);

export default router;