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
        Every post starts with one concept, and I cut what doesn't serve it
      </>
    ),
    body: [
      'Before I simplify anything, I ask: what is the core concept I want to communicate?',
      "Then, I leave out as much as I can that doesn't help explain the concept to my target audience.Trying to explain a practical takeaway into a 3 minute social media post or even a blog post is hard, and something I'm constantly working on.  But that inherently means that not every nuance will be covered.",
    ],
  },
  {
    head: (
      <>
        I use the words instructors use, unless those words teach the wrong thing
      </>
    ),
    body: [
      'My audience is Pilates instructors. I try to use language that resonates with them.',
      "That means colloquial terms like spring weight instead of spring resistance will be used because that's what people say in a studio, and I don't think that's a nit I want to pick. I won't use lbf or lbm, I'll use lb, for the same reason.",
      "Precision matters when the words change what someone understands. “Spring weight” and “lb” don't change anyone's picture of what's happening, so I don't fuss over them. But if the words used teach the wrong mechanics, it's worth fixing, because the client walks away believing something that isn't true. For example, the idea that everyone should be using the same spring settings all the time, or that you should be using your hamstrings to pull the carriage back in during footwork.",
      "Imagery is different. “Imagine your shoulder blades are wings” doesn't make anyone think they have wings. The image helps a body find a movement, and it isn't pretending to explain anything. So the question I ask is: is this an image, or an explanation? Images get to be poetic. Explanations need to be right.",
    ],
  },
  {
    head: (
      <>
        I stop explaining before the caveats outgrow the concept
      </>
    ),
    body: [
      "I want to go deep enough to be practical, but not so deep I'm having a discussion that isn't useful to the professional Pilates instructor. The human body is wildly complex, and science as a whole simultaneously knows so much and also hardly anything. I don't want to get caught up in concepts that a PhD candidate would spend a couple of years studying, and that means that I have to be okay with stopping my explanations before the list of caveats, nuances, and exceptions gets to be longer than the explanation of the concept itself.",
      'Just about all of my posts and examples have assumptions. I try to list them, but sometimes they are incomplete. There are always caveats, too.',
      "Unless I say otherwise, I'm ignoring friction in the wheels and rails. It's real, it's small, and it rarely changes a setup decision. I'm also treating springs as perfectly linear. Real springs are close, but not perfect.",
      "I round. “About 37 pounds” is more useful in a studio than 36.8. And I use Balanced Body as the reference, because it's the most common equipment and so our shared starting point. Your brand's numbers will be different. The principles won't.",
      "If you want to poke holes in my application, you'll be able to. There are always exceptions, minutiae that can slightly change things. Most of them won't change what you do with the client in front of you. I'm trying to illustrate a concept that helps you see your client and the loading scenario in a useful way.",
    ],
  },
  {
    head: <>One moment in time can teach a concept you can build on</>,
    body: [
      'I look at moments in time, which can be counterintuitive for many folks who teach movement. Hardly ever are we looking at just one point in time. But the snapshot of that point in time has something to teach us. A concept to build from.',
    ],
  },
  {
    head: <>Comparing two bodies teaches more than measuring one</>,
    body: [
      "I typically pick “average” client dimensions for examples, and in reality our clients have a wide variety of proportions and weight distribution that mean my example is not a universal experience. The point is not to calculate a number for every single person. It's to calculate some numbers with controlled differences to communicate a concept you can apply to anyone.",
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
              I won't always get it right, and I want to hear when I don't
            </h2>
            <div className="talk-prose">
              <p>
                It's not uncommon that I'm working through the math as I create a post for the
                first time. I try very hard to examine a concept from many angles, check my math,
                and stay within the realm of practical reality. But I won't always get it right. I
                welcome questions, discussions, and directional checks.{' '}
                <a href="https://ig.me/m/kaleenc_" target="_blank" rel="noopener noreferrer">
                  Send me a DM on Instagram
                </a>{' '}
                or <a href="mailto:hello@pilatesphysics.com">email me</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
