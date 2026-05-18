// Pre-built question sets for the three workshops. Loaded via the
// "Load template" control in the admin survey editor. Each template
// is just a `questions` array; timing (opens_at / closes_at) is set
// per-workshop in the editor since it depends on the workshop date.
//
// Question ids follow the legacy column names where they map to one
// (nps_score, years_teaching, valuable_sections, rushed_section,
// length_feedback, share_permission) so the typed-column mirror in
// api/_lib/survey-validation.js can populate them. That keeps the
// "share permission" badge on response cards working, and keeps PP-101
// analytics consistent across the seeded survey and a re-loaded one.

const STANDARD_YEARS_TEACHING = {
  id: 'years_teaching',
  type: 'single_select',
  label: 'How many years have you been teaching Pilates?',
  required: true,
  options: [
    "I'm not an instructor",
    'I am in teacher training',
    '<1 year',
    '1-3 years',
    '4-9 years',
    '10+ years',
  ],
}

const STANDARD_NPS = (workshopName) => ({
  id: 'nps_score',
  type: 'nps',
  label: `1. On a scale of 1-10, how likely are you to recommend ${workshopName} to another Pilates instructor?`,
  required: true,
})

const STANDARD_CHANGE_THIS_WEEK = {
  id: 'change_this_week',
  type: 'long_text',
  label: "2. What's one thing from today that's going to change how you teach this week?",
  required: true,
}

const STANDARD_AHA = {
  id: 'aha_moment',
  type: 'long_text',
  label: '3. What was your favorite "aha" moment from the workshop?',
  required: true,
}

const STANDARD_CONFUSING = {
  id: 'confusing',
  type: 'long_text',
  label: "6. Was anything confusing or that you'd want explained differently? (this is where you tell me what to fix)",
  required: true,
}

const STANDARD_LENGTH = {
  id: 'length_feedback',
  type: 'single_select',
  label: '7. How was the overall length?',
  required: true,
  options: ["Could've been shorter", 'Just right', "Could've been longer"],
}

const STANDARD_SHARE = {
  id: 'share_permission',
  type: 'single_select',
  label: '8. Can I share your feedback? I sometimes quote student feedback publicly to help other instructors decide if this workshop is for them.',
  required: true,
  options: [
    'Yes, with my first name',
    'Yes, but keep me anonymous',
    'No, please keep my responses private',
  ],
}

const STANDARD_NEXT_TOPIC = {
  id: 'next_workshop_topic',
  type: 'long_text',
  label: '9. What would you like to learn in the next workshop? (optional)',
  required: false,
}

const STANDARD_ANYTHING_ELSE = {
  id: 'anything_else',
  type: 'long_text',
  label: '10. Anything else you want me to know? (optional)',
  required: false,
}

// PP-101 - reformer workshop. Matches the seed in migration 025 exactly.
const PP101_TEMPLATE = {
  id: 'pp-101',
  label: 'Pilates Physics 101 (reformer)',
  description: 'The standard 10 questions used for PP-101 on the reformer.',
  questions: [
    STANDARD_YEARS_TEACHING,
    STANDARD_NPS('this workshop'),
    STANDARD_CHANGE_THIS_WEEK,
    STANDARD_AHA,
    {
      id: 'valuable_sections',
      type: 'multi_select',
      label: '4. Which section was most valuable for you? (check all that apply)',
      required: true,
      options: [
        'Framework',
        'Background Physics',
        'Practical Application',
        'Wrap-Up Challenge worksheet',
      ],
    },
    {
      id: 'rushed_section',
      type: 'single_select',
      label: '5. Was there a section that felt rushed, or that you wanted more time with?',
      required: true,
      options: [
        'Framework',
        'Background Physics',
        'Practical Application',
        'Wrap-Up',
        'Nothing — pacing felt right',
      ],
    },
    STANDARD_CONFUSING,
    STANDARD_LENGTH,
    STANDARD_SHARE,
    STANDARD_NEXT_TOPIC,
    STANDARD_ANYTHING_ELSE,
  ],
}

// PP-102 - chair & cadillac workshop. Same shape as PP-101, but the
// "valuable / rushed section" option sets match the PP-102 syllabus
// (FRAMEWORK + TOPICS from PilatesPhysics102.jsx).
const PP102_TEMPLATE = {
  id: 'pp-102',
  label: 'Pilates Physics 102 (chair & cadillac)',
  description: 'PP-102 starter set with chair/cadillac section names.',
  questions: [
    STANDARD_YEARS_TEACHING,
    STANDARD_NPS('this workshop'),
    STANDARD_CHANGE_THIS_WEEK,
    STANDARD_AHA,
    {
      id: 'valuable_sections',
      type: 'multi_select',
      label: '4. Which section was most valuable for you? (check all that apply)',
      required: true,
      options: [
        'Feedback Loop',
        'Spring Mechanics',
        'Body Weight',
        'Chair Mechanics',
        'Cadillac Mechanics',
        'Angle of Pull',
      ],
    },
    {
      id: 'rushed_section',
      type: 'single_select',
      label: '5. Was there a section that felt rushed, or that you wanted more time with?',
      required: true,
      options: [
        'Feedback Loop',
        'Spring Mechanics',
        'Body Weight',
        'Chair Mechanics',
        'Cadillac Mechanics',
        'Angle of Pull',
        'Nothing, pacing felt right',
      ],
    },
    STANDARD_CONFUSING,
    STANDARD_LENGTH,
    STANDARD_SHARE,
    STANDARD_NEXT_TOPIC,
    STANDARD_ANYTHING_ELSE,
  ],
}

// PP-201 - placeholder. Same shape, with generic section labels you can
// rename in the editor once the syllabus is set.
const PP201_TEMPLATE = {
  id: 'pp-201',
  label: 'Pilates Physics 201 (starter, rename sections)',
  description: 'PP-201 placeholder. Rename the section options once the syllabus is set.',
  questions: [
    STANDARD_YEARS_TEACHING,
    STANDARD_NPS('this workshop'),
    STANDARD_CHANGE_THIS_WEEK,
    STANDARD_AHA,
    {
      id: 'valuable_sections',
      type: 'multi_select',
      label: '4. Which section was most valuable for you? (check all that apply)',
      required: true,
      options: ['Section 1', 'Section 2', 'Section 3', 'Section 4'],
    },
    {
      id: 'rushed_section',
      type: 'single_select',
      label: '5. Was there a section that felt rushed, or that you wanted more time with?',
      required: true,
      options: ['Section 1', 'Section 2', 'Section 3', 'Section 4', 'Nothing, pacing felt right'],
    },
    STANDARD_CONFUSING,
    STANDARD_LENGTH,
    STANDARD_SHARE,
    STANDARD_NEXT_TOPIC,
    STANDARD_ANYTHING_ELSE,
  ],
}

export const SURVEY_TEMPLATES = [PP101_TEMPLATE, PP102_TEMPLATE, PP201_TEMPLATE]

export function getTemplate(id) {
  return SURVEY_TEMPLATES.find((t) => t.id === id) ?? null
}
