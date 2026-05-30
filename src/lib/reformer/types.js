// JSDoc typedefs for the Reformer Force Modeler.
// This file declares no runtime values; it exists so editors pick up the @typedef
// blocks and so the rest of src/lib/reformer can reference them.
//
// Unit conventions (SI everywhere internally):
//   linear dimensions  meters
//   forces             newtons
//   stiffness          newtons / meter
//   angles             radians   (degrees only at the UI boundary)
//   masses             kilograms
//
// World frame:
//   origin (0, 0) at the head end of the reformer frame, at floor level.
//   +x toward the foot / spring end of the frame.
//   +y up.
//   (SVG y-down conversion lives in src/components/portal/reformer/scene/coords.js.)

/** @typedef {{ x: number, y: number }} Vec2 */

/** @typedef {Object} PulleyRoute
 *  @property {string} id                    rope id this route serves
 *  @property {Vec2}   pulley                pulley / riser-top position, world m
 *  @property {number} mechanicalAdvantage   1 = single rope, 2 = block-and-tackle, default 1
 */

/** @typedef {Object} Reformer
 *  @property {number} frameLength           m
 *  @property {number} frameHeight           m  rail height above floor
 *  @property {number} carriageLength        m
 *  @property {number} carriageRestX         m  world x of carriage spring-end at rest
 *  @property {number} carriageMinX          m  travel limit (most-stretched side)
 *  @property {number} carriageMaxX          m  travel limit (slack side)
 *  @property {Vec2}   footbar               m
 *  @property {Vec2}   springAnchor          m  fixed spring end on frame
 *  @property {number} carriageSpringY       m  world y of the spring attachment on the carriage
 *  @property {PulleyRoute[]} routes         per-rope routing
 */

/** @typedef {Object} Spring
 *  @property {string}  id
 *  @property {string}  color                Balanced Body color key
 *  @property {string}  displayColor         hex used by the SVG layer
 *  @property {number}  stiffness            N / m
 *  @property {number}  freeLength           m  natural unstretched length
 *  @property {boolean} attached             true = engaged on the carriage
 */

/** @typedef {Object} BodySegment
 *  @property {string}      id               trunk | headNeck | upperArm | forearm | hand | thigh | shank | foot
 *  @property {string|null} parentId         the segment whose distal joint is this one's proximal start; null for root segments
 *  @property {number}      length           m
 *  @property {number}      massFraction     PHASE 2  Winter fraction of total body mass (unused in v1)
 *  @property {number}      comFraction      PHASE 2  COM fraction along the segment from proximal (unused in v1)
 */

/** @typedef {Object} ExternalLoad
 *  @property {string} id
 *  @property {string} atJoint               named joint id where the load is applied
 *  @property {number} magnitude             N
 *  @property {number} angle                 rad, measured from world +x (default -PI/2 = down)
 */

/** @typedef {Object} Human
 *  @property {number}                       heightM     total height m
 *  @property {number}                       bodyMass    kg  PHASE 2 (display-weight only in v1)
 *  @property {Vec2}                         rootPos     world pos of the pelvis root
 *  @property {BodySegment[]}                segments    chain in dependency order (parents before children)
 *  @property {Object.<string, number>}      angles      segmentId -> absolute world angle, rad
 *  @property {ExternalLoad[]}               loads       external loads to decompose at hand / foot points
 */

/** @typedef {Object} Rope
 *  @property {string} id
 *  @property {number} totalLength           m  fixed
 *  @property {('frame'|'carriage')} carriageEnd    which end is driven (typ. carriage)
 *  @property {string} handId                endId this rope attaches to (handTip | toeTip)
 */

/** @typedef {('free'|'pinnedToRopeEnd'|'pinnedToFrame')} AttachmentMode */

/** @typedef {Object} Attachment
 *  @property {string}         endId         handTip | toeTip
 *  @property {AttachmentMode} mode
 *  @property {string|null}    ropeId        when mode === 'pinnedToRopeEnd'
 *  @property {string|null}    framePoint    when mode === 'pinnedToFrame'  (footbar | shoulderRest | carriageEdge)
 */

/** @typedef {Object} ModelState
 *  @property {Reformer}      reformer
 *  @property {Spring[]}      springs
 *  @property {Human}         human
 *  @property {Rope[]}        ropes
 *  @property {Attachment[]}  attachments
 *  @property {number}        carriageSeedX  warm-start hint for the carriage solver
 */

/** @typedef {Object} SpringResult
 *  @property {string} id
 *  @property {number} stretch               m  >= 0
 *  @property {number} tension               N  >= 0
 */

/** @typedef {Object} RopeResult
 *  @property {string} id
 *  @property {number} tension               N
 *  @property {number} angleFromHorizontal   deg  atan2(dy, dx) of (pulley - hand)
 *  @property {number} angleFromVertical     deg  complement, normalized to [0, 180]
 *  @property {Vec2}   forceVectorAtHand     N    tension * unit(pulley - hand)
 *  @property {number} fH                    N    horizontal component (signed)
 *  @property {number} fV                    N    vertical component (signed, +up)
 *  @property {boolean} slack
 */

/** @typedef {Object} Flags
 *  @property {boolean}  slack
 *  @property {boolean}  atLimit
 *  @property {boolean}  infeasible
 *  @property {string[]} messages
 */

/** @typedef {Object} DerivedState
 *  @property {Object.<string, Vec2>}   jointPositions   world m, by named joint id
 *  @property {Object.<string, number>} jointAnglesDeg   deg, by joint id (between parent and child segment)
 *  @property {number}        carriageX                  m
 *  @property {number}        carriageDisplacement       m  signed, from carriageRestX
 *  @property {SpringResult[]} springResults
 *  @property {number}        totalSpringForce           N
 *  @property {RopeResult[]}  ropeResults
 *  @property {number}        bodyWeightN                PHASE 2  display-only (bodyMass * g)
 *  @property {Flags}         flags
 */

/** @typedef {Object} Keyframe
 *  @property {string}                       id
 *  @property {number}                       durationToNext   seconds
 *  @property {('linear'|'ease')}            ease
 *  @property {Object.<string, number>}      angles            full angle snapshot, rad
 *  @property {Vec2}                         rootPos
 *  @property {Reformer}                     reformer
 *  @property {Spring[]}                     springs
 *  @property {Attachment[]}                 attachments
 */

/** @typedef {Object} Project
 *  @property {number}      version
 *  @property {string}      name
 *  @property {ModelState}  model
 *  @property {Keyframe[]}  keyframes
 *  @property {{ activeKeyframeId: (string|null), fps: number }} ui
 */

export {}
