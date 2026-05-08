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
- Slug: kebab-case, max 60 chars, no stop words.
- Excerpt: 1-2 sentences, no marketing fluff, summarizes the post's payoff.
- Use Markdown only. No HTML tags.

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
      email_markdown: {
        type: 'string',
        description:
          'Email body in Markdown. Should reference the blog post and end with a CTA link to it.',
      },
    },
    required: [
      'blog_title',
      'blog_slug',
      'blog_excerpt',
      'blog_markdown',
      'email_subject',
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
