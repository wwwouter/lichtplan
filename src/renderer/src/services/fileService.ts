import { Project } from '../types/project'

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2)
}

export function deserializeProject(data: string): Project {
  const parsed = JSON.parse(data)
  // Basic validation
  if (!parsed.id || !parsed.name || !Array.isArray(parsed.floors)) {
    throw new Error('Invalid lichtplan file format')
  }
  return parsed as Project
}
