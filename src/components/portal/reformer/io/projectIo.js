// Project serialize / deserialize. Pure (no DOM). The schema is the Project
// type with an explicit `version` field for future migrations.

const SCHEMA_VERSION = 1

/** @param {import('../../../../lib/reformer/types.js').Project} project */
export function serializeProject(project) {
  return JSON.stringify({ ...project, version: SCHEMA_VERSION }, null, 2)
}

/**
 * Parse a project file. Validates the schema lightly: returns the project
 * on success or throws on failure.
 *
 * @param {string} text
 * @returns {import('../../../../lib/reformer/types.js').Project}
 */
export function deserializeProject(text) {
  let obj
  try {
    obj = JSON.parse(text)
  } catch {
    throw new Error('Project file is not valid JSON')
  }
  if (typeof obj !== 'object' || !obj) throw new Error('Project file is not an object')
  if (!obj.model || !obj.model.reformer || !obj.model.human || !obj.model.springs) {
    throw new Error('Project file is missing required model fields')
  }
  if (!Array.isArray(obj.keyframes)) throw new Error('Project file is missing keyframes')
  return {
    version: obj.version ?? SCHEMA_VERSION,
    name: obj.name ?? 'Untitled reformer pose',
    model: obj.model,
    keyframes: obj.keyframes,
    ui: obj.ui ?? { activeKeyframeId: null, fps: 30 },
  }
}
