import { Link } from 'react-router-dom'
import '../styles/ppv2.css'
import './HowITalkAboutPhysics.css'
import Head from '../components/Head'
import { PAGE_META } from '../lib/pageMeta'

// "How I talk about Pilates and physics": the glossary and simplification
// policy behind every post. Linked from /links and the footer so it can be
// dropped into a reply when someone asks "but isn't a spring a force?".
//
// Deliberately flat: one heading per section and paragraphs under it. No
// kickers, labels, lists or pull quotes. Every section stacks its heading
// above paragraphs that run to 82ch, wide enough to hold the 1320px container.

const SECTIONS = [
  {
    head: (
      <>
        The information I share is simplified for clarity of concept
      </>
    ),
    body: [
      'Before I simplify anything, I ask: what is the core concept I want to communicate?',
      "Then, I leave out everything that doesn't help explain the concept. Trying to explain a practical takeaway into a 3 minute social media post or even a blog post is something I'm constantly working on.  But that inherently means that not every nuance will be covered.",
    ],
  },
  {
    head: (
      <>
        A note to engineers and scientists about terms, simplifications, and nuance
      </>
    ),
    body: [
      'My audience is Pilates instructors. I try to use language that resonates with them.',
      "That means colloquial terms like spring weight instead of spring resistance will be used because that's what people say in a studio, and I don't think that's a nit I want to pick. I won't use lbf or lbm, I'll use lb, for the same reason.",
    ],
  },
  {
    head: (
      <>
        What I usually leave out of a post, and why
      </>
    ),
    body: [
      "Unless I say otherwise, I'm ignoring friction in the wheels and rails. It's real, it's small, and it rarely changes a setup decision. I'm also treating springs as perfectly linear. Real springs are close, but not perfect.",
      "I round. “About 37 pounds” is more useful in a studio than 36.8. And I use Balanced Body as the reference, because it's the most common equipment and so our shared starting point. Your brand's numbers will be different. The principles won't.",
      "I leave out the math. It's there. I did it. You don't need it to teach better.",
      "When a simplification does change the answer, I'll tell you.",
    ],
  },
  {
    head: <>Why I look at single moments in time</>,
    body: [
      'I look at moments in time, which can be counterintuitive for many folks who teach movement. Hardly ever are we looking at just one point in time. But the snapshot of that point in time has something to teach us. A concept to build from.',
      "Pilates physics won't explain everything exactly. I'm not trying to do a dissertation. But basic physics can be used to explain basic Pilates scenarios to create a more logical decision-making framework and understanding of the client experience in Pilates. Sometimes I can make animations to explain changes over time and space.",
    ],
  },
  {
    head: <>The assumptions and caveats behind my examples</>,
    body: [
      'Just about all of my posts and examples have assumptions. I try to list them, but sometimes they are incomplete. There are always caveats, too.',
      "I typically pick “average” client dimensions for examples, and in reality our clients have a wide variety of proportions and weight distribution that mean my example is not a universal experience. The point is not to calculate a number for every single person. It's to calculate some numbers with controlled differences to communicate a concept you can apply to anyone.",
      "If you want to poke holes in my application, you'll be able to. There are always exceptions, minutiae that can slightly change things. I'm not writing a dissertation and I'm not trying to do math while teaching. I'm trying to illustrate a concept that helps you see your client and the loading scenario in a useful way.",
    ],
  },
  {
    head: (
      <>
        What stays in, even in a short post
      </>
    ),
    body: [
      <>
        The conclusions. If I say a taller client on the same springs feels a different load, or
        that adding a spring doesn't make everything harder, that's a claim I stand behind and can
        show the math for. You can check a lot of it yourself in the{' '}
        <Link to="/spring-calculator">spring calculator</Link>.
      </>,
    ],
  },
]

export default function HowITalkAboutPhysics() {
  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      <Head {...PAGE_META['/how-i-talk-about-physics']} />

      <section className="section-pad talk-hero">
        <div className="container">
          <h1 className="talk-hero__head">
            How I talk about Pilates and physics
          </h1>
          <div className="talk-prose">
            <p>Every post I make involves choices about what not to say.</p>
            <p>
              A 60-second reel can't hold a semester of physics, and it shouldn't try. My job is
              to get you thinking about load in the right direction, so the decisions you make for
              your clients get better. Here's how I do that, so you know what I mean when I say
              it.
            </p>
          </div>
        </div>
      </section>

      {SECTIONS.map((s, i) => (
        <section className="section-pad section--inset" key={i}>
          <div className="container">
            <div>
              <h2 className="talk-section__head">{s.head}</h2>
              <div className="talk-prose">
                {s.body.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="section-pad section--inset">
        <div className="container">
          <div>
            <h2 className="talk-section__head">
              What happens when I get something wrong
            </h2>
            <div className="talk-prose">
              <p>
                I will. I'm bringing an engineering lens to Pilates, and nobody's mapped all of
                this out before. Some of what I share is a first draft.
              </p>
              <p>
                When someone catches an error that changes a conclusion, I'll check it, thank
                them, and post the correction. That's how engineering works: build, test, learn,
                update.
              </p>
              <p>
                Got a question about something I said, or think I got something wrong?{' '}
                <a href="https://ig.me/m/kaleenc_" target="_blank" rel="noopener noreferrer">
                  Send me a DM on Instagram
                </a>{' '}
                or <a href="mailto:hello@pilatesphysics.com">email me</a>. Let's chat.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
