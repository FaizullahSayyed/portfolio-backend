
export interface Project {
  id: string;
  title: string;
  description: string;
  url: string | null;
  technologies: string[];
  images: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectInput {
  title: string;
  description: string;
  url?: string | null;
  technologies?: string[];
  images?: string[];
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  url?: string | null;
  technologies?: string[];
  images?: string[];
}
