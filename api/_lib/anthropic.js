import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 16000

const STATIC_INSTRUCTIONS = `You are Kaleen Canevari's writing partner for Pilates Physics, an
educational brand that teaches the physics of Pilates reformer exercises to instructors and
practitioners.

Your job is to draft (1) a long-form blog post and (2) a companion email that promotes the blog.
The blog post is the source of truth; the email is a shorter teaser linking to it.

Guidelines:
- Match Kaleen's voice as demonstrated in the reference material in the system prompt.
- Be specific. Use concrete reformer/anatomy/physics terminology when it earns its place.
- Don't pad. No filler intros. Open with the idea.
- Headings in the blog post use sentence case.
- Email is short (under ~250 words), warm, and ends with a single clear CTA linking to the blog.
- Open the email body with a personalized greeting using Kit's Liquid tag for the subscriber's first name, with a fallback for subscribers who don't have one set. Use exactly this syntax: \`Hi {{ subscriber.first_name | default: "there" }},\` (or a similarly warm variant like "Hey"). Kit interpolates this at send time — leave it as literal text in the markdown, don't replace it with a real name.
- Email preview text: 60-110 chars, complements the subject (don't repeat it), gives a reason to open. No emojis.
- Slug: kebab-case, max 60 chars, no stop words.
- Excerpt: 1-2 sentences, no marketing fluff, summarizes the post's payoff.
- Use Markdown only. No HTML tags.
- The entire blog post may contain at most one em dash (—). Use commas, periods, parentheses, or colons instead.

Always respond by calling the submit_content tool. Do not write a normal text reply.`

const SUBMIT_TOOL = {
  name: 'submit_content',
  description: 'Submit the finished blog post and companion email.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      blog_title: { type: 'string', description: 'Headline for the blog post.' },
      blog_slug: {
        type: 'string',
        description: 'URL slug, kebab-case, max 60 chars, lowercase letters/numbers/hyphens only.',
      },
      blog_excerpt: { type: 'string', description: '1-2 sentence summary used in listings.' },
      blog_markdown: { type: 'string', description: 'Full blog post body in Markdown.' },
      email_subject: { type: 'string', description: 'Email subject line.' },
      email_preview_text: {
        type: 'string',
        description:
          'Inbox preview snippet (preheader). 60-110 chars. Complements the subject without repeating it. No emojis.',
      },
      email_markdown: {
        type: 'string',
        description:
          'Email body in Markdown. Must open with a personalized greeting using the literal Kit Liquid tag `{{ subscriber.first_name | default: "there" }}` (e.g. `Hi {{ subscriber.first_name | default: "there" }},`). Should reference the blog post and end with a CTA link to it.',
      },
    },
    required: [
      'blog_title',
      'blog_slug',
      'blog_excerpt',
      'blog_markdown',
      'email_subject',
      'email_preview_text',
      'email_markdown',
    ],
  },
}

function buildBrainBlock(brainEntries) {
  if (!brainEntries?.length) {
    return '<reference_material>No reference material provided yet.</reference_material>'
  }
  const sections = { style_guide: [], blog_post: [], transcript: [] }
  for (const e of brainEntries) {
    if (sections[e.type]) sections[e.type].push(e)
  }
  const parts = ['<reference_material>']
  if (sections.style_guide.length) {
    parts.push('<voice_and_style>')
    for (const e of sections.style_guide) {
      parts.push(`### ${e.title}\n${e.content}`)
    }
    parts.push('</voice_and_style>')
  }
  if (sections.blog_post.length) {
    parts.push('<past_blog_posts>')
    for (const e of sections.blog_post) {
      parts.push(
        `<post title="${e.title}"${e.source_url ? ` url="${e.source_url}"` : ''}>\n${e.content}\n</post>`,
      )
    }
    parts.push('</past_blog_posts>')
  }
  if (sections.transcript.length) {
    parts.push('<transcripts>')
    for (const e of sections.transcript) {
      parts.push(`<transcript title="${e.title}">\n${e.content}\n</transcript>`)
    }
    parts.push('</transcripts>')
  }
  parts.push('</reference_material>')
  return parts.join('\n\n')
}

function buildUserMessage({ idea, notes, feedback, previousDraft }) {
  const lines = []
  lines.push(`Idea title: ${idea.title}`)
  if (idea.notes) lines.push(`\nIdea notes:\n${idea.notes}`)
  if (notes) lines.push(`\nAdditional context for this draft:\n${notes}`)
  if (previousDraft && feedback) {
    lines.push('\nPrevious draft (please revise based on the feedback below):')
    lines.push(`\nBLOG TITLE: ${previousDraft.blog_title ?? ''}`)
    lines.push(`BLOG MARKDOWN:\n${previousDraft.blog_markdown ?? ''}`)
    lines.push(`\nEMAIL SUBJECT: ${previousDraft.email_subject ?? ''}`)
    lines.push(`EMAIL PREVIEW TEXT: ${previousDraft.email_preview_text ?? ''}`)
    lines.push(`EMAIL MARKDOWN:\n${previousDraft.email_markdown ?? ''}`)
    lines.push(`\nFeedback:\n${feedback}`)
  }
  return lines.join('\n')
}

export async function generateContentDraft({
  idea,
  notes,
  feedback,
  brainEntries,
  previousDraft,
}) {
  const brainBlock = buildBrainBlock(brainEntries)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    tools: [SUBMIT_TOOL],
    tool_choice: { type: 'tool', name: 'submit_content' },
    system: [
      { type: 'text', text: STATIC_INSTRUCTIONS },
      {
        type: 'text',
        text: brainBlock,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: buildUserMessage({ idea, notes, feedback, previousDraft }),
      },
    ],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use' && b.name === 'submit_content')
  if (!toolUse) {
    throw new Error('Model did not call submit_content')
  }
  const data = toolUse.input
  const required = [
    'blog_title',
    'blog_slug',
    'blog_excerpt',
    'blog_markdown',
    'email_subject',
    'email_preview_text',
    'email_markdown',
  ]
  for (const key of required) {
    if (typeof data[key] !== 'string' || !data[key].trim()) {
      throw new Error(`submit_content missing or empty field: ${key}`)
    }
  }

  return {
    data,
    usage: response.usage,
  }
}

const PROOFREAD_INSTRUCTIONS = `You are a meticulous proofreader for Kaleen Canevari's Pilates Physics content.
You will receive a blog post and a companion email. Find issues and submit them via the submit_issues tool.

Check for:
- Spelling and typos.
- Grammar, punctuation, capitalization.
- Voice and style violations against these rules:
  - The entire blog post may contain AT MOST ONE em dash (—). If there are two or more, every extra one is an issue. Suggest replacing with commas, periods, parentheses, or colons.
  - Blog headings use sentence case (not Title Case).
  - No HTML tags — markdown only.
  - Email preview text: 60-110 characters, complements the subject without repeating it, no emojis.
  - Email body must open with the literal Kit Liquid greeting \`{{ subscriber.first_name | default: "there" }}\` — flag if it's missing or has been replaced with a real name.
  - Email body should end with a clear CTA linking to the blog.
  - No filler intros, no marketing fluff.
- Internal inconsistencies — claims, numbers, or terminology that contradict each other across the blog or email.

Do not flag stylistic preferences that aren't in the rules above. Quote the exact text in the \`quote\` field so the editor can find it. Be concise in \`reason\` — one sentence.

If there are zero issues, submit an empty array. Always respond by calling submit_issues.`

const PROOFREAD_TOOL = {
  name: 'submit_issues',
  description: 'Submit the list of issues found in the content.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      issues: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            kind: {
              type: 'string',
              enum: ['spelling', 'grammar', 'voice', 'inconsistency'],
            },
            where: {
              type: 'string',
              enum: ['blog', 'email_subject', 'email_preview', 'email_body'],
            },
            quote: {
              type: 'string',
              description: 'Short verbatim quote from the text that identifies the issue.',
            },
            suggestion: {
              type: 'string',
              description: 'Proposed replacement or fix.',
            },
            reason: {
              type: 'string',
              description: 'One sentence explaining why this is an issue.',
            },
          },
          required: ['kind', 'where', 'quote', 'suggestion', 'reason'],
        },
      },
    },
    required: ['issues'],
  },
}

function buildProofreadUserMessage({ blogMarkdown, emailSubject, emailPreviewText, emailMarkdown }) {
  return [
    '<blog>',
    blogMarkdown ?? '',
    '</blog>',
    '',
    '<email_subject>',
    emailSubject ?? '',
    '</email_subject>',
    '',
    '<email_preview_text>',
    emailPreviewText ?? '',
    '</email_preview_text>',
    '',
    '<email_body>',
    emailMarkdown ?? '',
    '</email_body>',
  ].join('\n')
}

export async function proofreadContent({
  blogMarkdown,
  emailSubject,
  emailPreviewText,
  emailMarkdown,
}) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    tools: [PROOFREAD_TOOL],
    tool_choice: { type: 'tool', name: 'submit_issues' },
    system: PROOFREAD_INSTRUCTIONS,
    messages: [
      {
        role: 'user',
        content: buildProofreadUserMessage({
          blogMarkdown,
          emailSubject,
          emailPreviewText,
          emailMarkdown,
        }),
      },
    ],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use' && b.name === 'submit_issues')
  if (!toolUse) throw new Error('Model did not call submit_issues')
  const issues = Array.isArray(toolUse.input?.issues) ? toolUse.input.issues : []
  return { issues, usage: response.usage }
}

const AUDIENCE_INSTRUCTIONS = `You are simulating an audience read for Kaleen Canevari's Pilates Physics content.
You will receive (1) a list of audience personas and (2) one blog post plus the email that drove the reader to it.
For each persona, react AS that persona reading the email in their inbox and clicking through to the blog. One reaction per persona.

Stay in character. React cold — do not soften reactions, do not be diplomatic. If a persona would skim, say so. If a persona would push back, push back. If a persona would forward it to a friend, say that. Do not give editorial advice — give a reader's reaction.

Submit all reactions in one tool call via submit_reactions. Use the exact persona_id and persona_name you were given.`

const AUDIENCE_TOOL = {
  name: 'submit_reactions',
  description: 'Submit one in-character reaction per persona.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      reactions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            persona_id: { type: 'string', description: 'The id of the persona, exactly as given.' },
            persona_name: { type: 'string' },
            gut: {
              type: 'string',
              description: "1-2 sentence overall gut reaction in the persona's voice.",
            },
            what_landed: {
              type: 'string',
              description: 'What worked for this persona — specific moments, lines, or framings.',
            },
            what_didnt: {
              type: 'string',
              description: "What fell flat, confused them, or made them push back. Empty string if nothing.",
            },
            would_forward: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description:
                '1 = would not share or recommend. 5 = would forward to a friend or post about it immediately.',
            },
          },
          required: ['persona_id', 'persona_name', 'gut', 'what_landed', 'what_didnt', 'would_forward'],
        },
      },
    },
    required: ['reactions'],
  },
}

function buildAudienceUserMessage({
  personas,
  blogMarkdown,
  emailSubject,
  emailPreviewText,
  emailMarkdown,
}) {
  const personaBlock = personas
    .map(
      (p) =>
        `<persona id="${p.id}" name="${p.name.replace(/"/g, '&quot;')}">\n${p.content}\n</persona>`,
    )
    .join('\n\n')

  return [
    '<personas>',
    personaBlock,
    '</personas>',
    '',
    '<email_subject>',
    emailSubject ?? '',
    '</email_subject>',
    '',
    '<email_preview_text>',
    emailPreviewText ?? '',
    '</email_preview_text>',
    '',
    '<email_body>',
    emailMarkdown ?? '',
    '</email_body>',
    '',
    '<blog>',
    blogMarkdown ?? '',
    '</blog>',
  ].join('\n')
}

export async function audienceRead({
  personas,
  blogMarkdown,
  emailSubject,
  emailPreviewText,
  emailMarkdown,
}) {
  if (!personas?.length) throw new Error('No active personas in the brain')

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6000,
    tools: [AUDIENCE_TOOL],
    tool_choice: { type: 'tool', name: 'submit_reactions' },
    system: AUDIENCE_INSTRUCTIONS,
    messages: [
      {
        role: 'user',
        content: buildAudienceUserMessage({
          personas,
          blogMarkdown,
          emailSubject,
          emailPreviewText,
          emailMarkdown,
        }),
      },
    ],
  })

  const toolUse = response.content.find(
    (b) => b.type === 'tool_use' && b.name === 'submit_reactions',
  )
  if (!toolUse) throw new Error('Model did not call submit_reactions')
  const reactions = Array.isArray(toolUse.input?.reactions) ? toolUse.input.reactions : []
  return { reactions, usage: response.usage }
}
