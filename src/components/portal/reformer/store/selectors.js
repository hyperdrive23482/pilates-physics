// Pure read-only selectors for the Reformer Force Modeler store.

/** @typedef {import('../../../../lib/reformer/types.js').Project} Project */
/** @typedef {import('../../../../lib/reformer/types.js').BodySegment} BodySegment */

export function getActiveKeyframe(project) {
  if (!project.ui.activeKeyframeId) return null
  return project.keyframes.find((k) => k.id === project.ui.activeKeyframeId) ?? null
}

export function getSpringById(model, id) {
  return model.springs.find((s) => s.id === id) ?? null
}

export function getRopeById(model, id) {
  return model.ropes.find((r) => r.id === id) ?? null
}

export function getAttachmentByEndId(model, endId) {
  return model.attachments.find((a) => a.endId === endId) ?? null
}

/**
 * IDs of every segment in the subtree rooted at rootSegmentId, INCLUDING the
 * root itself. Used by ROTATE_SUBTREE to rigidly rotate a drag-affected limb.
 *
 * @param {BodySegment[]} segments
 * @param {string} rootSegmentId
 * @returns {string[]}
 */
export function getSubtreeSegmentIds(segments, rootSegmentId) {
  const childrenOf = new Map()
  for (const s of segments) {
    if (!s.parentId) continue
    const arr = childrenOf.get(s.parentId) ?? []
    arr.push(s.id)
    childrenOf.set(s.parentId, arr)
  }
  const out = []
  const stack = [rootSegmentId]
  while (stack.length) {
    const cur = stack.pop()
    out.push(cur)
    const kids = childrenOf.get(cur)
    if (kids) stack.push(...kids)
  }
  return out
}
