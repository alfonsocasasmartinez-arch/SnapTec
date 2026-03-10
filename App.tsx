export interface Project {
  id: string;
  name: string;
  phases: string[];
  zones: string[];
}

export interface Photo {
  id: string;
  url: string;
  projectId: string;
  phase: string;
  zone: string;
  tags: string[];
  timestamp: number;
}
