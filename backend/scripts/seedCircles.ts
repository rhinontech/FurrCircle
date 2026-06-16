import "dotenv/config";
import db from "../models/index.ts";

const {
  users: User,
  circles: Circle,
  circle_members: CircleMember,
  questions: Question,
  question_answers: QuestionAnswer,
} = db as any;

// Creator of every circle
const CREATOR_USERNAME = "furrcircle";
// "Other people" who ask / answer questions
const COMMUNITY_USERNAMES = ["prabhat", "ahmar_ansari", "varun", "ishra"];

type SeedAnswer = { by: string; text: string; upvotes?: number; isAccepted?: boolean };
type SeedQuestion = {
  by: string;
  title: string;
  body: string;
  tags?: string[];
  upvotes?: number;
  answers: SeedAnswer[];
};
type SeedCircle = {
  name: string;
  description: string;
  category: string;
  questions: SeedQuestion[];
};

const CIRCLES: SeedCircle[] = [
  {
    name: "Hyderabad Indie Dogs & Paws",
    description:
      "Dedicated to Indie Dog Parents, Fosters, and Rescuers. Let's share tips, arrange meetups, and support local strays across Hyderabad! Community | Support | Meetups | Rescues.",
    category: "rescue",
    questions: [
      {
        by: "ishra",
        title: "Best deworming schedule for an 8-week indie puppy?",
        body: "Just rescued a tiny indie pup from near Tank Bund. How often should I deworm at this age and which medicine is safe?",
        tags: ["puppy", "health", "deworming"],
        upvotes: 7,
        answers: [
          { by: "varun", text: "At 8 weeks, deworm every 2 weeks until 12 weeks, then monthly till 6 months. Praziquantel + pyrantel combos are gentle. Always confirm dosage by weight with your vet.", upvotes: 5, isAccepted: true },
          { by: "ahmar_ansari", text: "We used the same schedule for our foster litter. Weigh the pup before each dose — they grow fast and the dose changes.", upvotes: 2 },
        ],
      },
      {
        by: "varun",
        title: "Found a stray indie with mange near Banjara Hills — what should I do?",
        body: "Spotted a young dog with bad hair loss and scabs. Want to help but not sure how to start. Any rescuers nearby?",
        tags: ["rescue", "mange", "banjara-hills"],
        upvotes: 12,
        answers: [
          { by: "ahmar_ansari", text: "Sounds like sarcoptic mange. It's treatable! Try to get it to a vet for an ivermectin schedule + medicated baths. I can share a low-cost clinic contact.", upvotes: 8, isAccepted: true },
          { by: "prabhat", text: "If you can't catch it, feed at the same spot daily to build trust first. Blue Cross Hyderabad also does rescue pickups.", upvotes: 3 },
        ],
      },
      {
        by: "prabhat",
        title: "How do I socialise a rescued indie that's scared of men?",
        body: "Our new boy panics around adult men, including my husband. How do we build trust without overwhelming him?",
        tags: ["behaviour", "socialisation"],
        upvotes: 5,
        answers: [
          { by: "ishra", text: "Go slow — have men ignore him, sit sideways, and toss treats without eye contact. Let the dog approach on his own timeline. Took our girl 3 weeks.", upvotes: 4 },
        ],
      },
      {
        by: "ahmar_ansari",
        title: "Recommended low-cost vaccination camps in Hyderabad?",
        body: "Fostering 4 pups and need ARV + DHPPi shots without breaking the bank. Any upcoming camps or affordable clinics?",
        tags: ["vaccination", "low-cost"],
        upvotes: 9,
        answers: [
          { by: "varun", text: "GHMC runs free ARV drives periodically — check their social handles. People For Animals also does subsidised camps on weekends.", upvotes: 6, isAccepted: true },
          { by: "prabhat", text: "There's a clinic in Kukatpally that does DHPPi for around ₹400. DM me for the number.", upvotes: 2 },
        ],
      },
      {
        by: "ishra",
        title: "Home food or kibble for a 3-month indie pup?",
        body: "Getting mixed advice. Is home-cooked enough or should I add puppy kibble for nutrients?",
        tags: ["nutrition", "puppy"],
        upvotes: 6,
        answers: [
          { by: "ahmar_ansari", text: "Home food is great — rice, curd, boiled chicken, a little pumpkin. Add a calcium + multivitamin supplement since growing pups need it. Avoid salt and masala.", upvotes: 5 },
          { by: "varun", text: "We mix 70% home food with 30% good kibble for balance. Works well and keeps costs down.", upvotes: 1 },
        ],
      },
      {
        by: "varun",
        title: "Monsoon paw infections — how do fosters prevent them?",
        body: "Every rainy season our fosters get itchy, smelly paws. Any prevention tips?",
        tags: ["monsoon", "paws", "fostering"],
        upvotes: 4,
        answers: [
          { by: "prabhat", text: "Wipe paws with diluted povidone-iodine after every walk and dry between the toes. A weekly betadine soak prevents most yeast issues.", upvotes: 3, isAccepted: true },
        ],
      },
    ],
  },
  {
    name: "Gachibowli Pet Parents Club",
    description:
      "Connect. Play. Recommend! Serving Gachibowli, Kondapur & Hitech City. A friendly club for pet parents to arrange playdates, swap vet recommendations, and find trusted local services.",
    category: "general",
    questions: [
      {
        by: "prabhat",
        title: "Dog-friendly parks around Gachibowli for evening playdates?",
        body: "New to the area. Where do you all take your dogs in the evenings for some off-leash time?",
        tags: ["parks", "playdate", "gachibowli"],
        upvotes: 8,
        answers: [
          { by: "varun", text: "Botanical Garden's outer path is great early morning. For evenings, the open ground near Nallagandla gets a friendly dog crowd around 6 PM.", upvotes: 6, isAccepted: true },
          { by: "ishra", text: "We meet at the Kondapur lake park on weekends — join us!", upvotes: 2 },
        ],
      },
      {
        by: "ishra",
        title: "Trusted vet near Kondapur for routine vaccinations?",
        body: "Looking for a vet who's gentle and doesn't upsell unnecessary tests. Recommendations?",
        tags: ["vet", "kondapur", "vaccination"],
        upvotes: 10,
        answers: [
          { by: "ahmar_ansari", text: "Dr. Rao near Kothaguda is fantastic — honest and great with anxious dogs. Cityvet in Gachibowli is good for emergencies too.", upvotes: 7, isAccepted: true },
          { by: "prabhat", text: "+1 for Dr. Rao. He even follows up over WhatsApp after vaccinations.", upvotes: 3 },
        ],
      },
      {
        by: "varun",
        title: "Anyone up for a weekend playdate meetup at Botanical Garden?",
        body: "Thinking Sunday 7 AM near gate 2. My golden loves company. Who's in?",
        tags: ["meetup", "playdate", "weekend"],
        upvotes: 14,
        answers: [
          { by: "prabhat", text: "Count us in! Our beagle needs the exercise.", upvotes: 4 },
          { by: "ishra", text: "We'll be there with our pug — I'll bring some water bowls and treats for everyone.", upvotes: 3 },
        ],
      },
      {
        by: "ahmar_ansari",
        title: "Best pet boarding in Hitech City for a 4-day trip?",
        body: "Travelling next month and need a clean, caring boarding place. Budget is flexible. Suggestions?",
        tags: ["boarding", "hitech-city"],
        upvotes: 6,
        answers: [
          { by: "varun", text: "We've used Critterz near Hitech City twice — they send daily photos and keep dogs in home-like rooms, not cages.", upvotes: 5, isAccepted: true },
        ],
      },
      {
        by: "prabhat",
        title: "Groomers who do home visits in Gachibowli?",
        body: "My dog hates the salon environment. Anyone offering at-home grooming around here?",
        tags: ["grooming", "home-service"],
        upvotes: 5,
        answers: [
          { by: "ishra", text: "Scrubbers does doorstep grooming in Gachibowli — book a day ahead. Calm groomer, fair pricing.", upvotes: 4 },
          { by: "ahmar_ansari", text: "There's also a freelance groomer on Instagram who covers Kondapur. DM me and I'll share the handle.", upvotes: 1 },
        ],
      },
      {
        by: "varun",
        title: "Which pet stores deliver fresh food in Kondapur?",
        body: "Running low and don't have time to drive out. Anyone delivering kibble/fresh meals quickly?",
        tags: ["food", "delivery", "kondapur"],
        upvotes: 4,
        answers: [
          { by: "prabhat", text: "Heads Up For Tails delivers same-day in Kondapur via their app. For fresh meals, Doggie Dabbas delivers weekly subscriptions.", upvotes: 3, isAccepted: true },
        ],
      },
    ],
  },
  {
    name: "Paws & Train Hyderabad",
    description:
      "A positive-reinforcement training community for Hyderabad pet parents. Share techniques, troubleshoot behaviour issues, and find certified trainers. Kind, force-free methods only!",
    category: "training",
    questions: [
      {
        by: "ishra",
        title: "How do I stop my 6-month lab from pulling on the leash?",
        body: "Walks are a tug-of-war. I've tried stopping when he pulls but he just gets more excited. Help!",
        tags: ["leash", "training", "puppy"],
        upvotes: 9,
        answers: [
          { by: "varun", text: "Try the 'be a tree' method consistently + reward every time the leash goes slack. A front-clip harness helps a lot during the learning phase. Keep sessions short.", upvotes: 7, isAccepted: true },
          { by: "ahmar_ansari", text: "Tire him out with some play before the walk — a calmer dog learns faster. Labs at 6 months are pure energy!", upvotes: 2 },
        ],
      },
      {
        by: "varun",
        title: "Is crate training cruel? How do I start?",
        body: "My family thinks crates are like cages. Is it actually good for the dog, and how do I introduce it kindly?",
        tags: ["crate", "training"],
        upvotes: 7,
        answers: [
          { by: "prabhat", text: "Done right it's the opposite of cruel — it becomes their safe den. Feed all meals in the crate with the door open, never use it for punishment, and build up slowly.", upvotes: 6, isAccepted: true },
        ],
      },
      {
        by: "prabhat",
        title: "Puppy bites a lot during play — how do I redirect?",
        body: "Our 4-month pup nips hands and ankles constantly. We yelp but it's not stopping. What works?",
        tags: ["biting", "puppy", "behaviour"],
        upvotes: 6,
        answers: [
          { by: "ishra", text: "Redirect onto a tug toy every single time teeth touch skin, and end play immediately if it continues. Consistency from everyone in the house is key.", upvotes: 5 },
          { by: "varun", text: "Frozen carrots and chew toys during teething saved our hands. It's a phase, hang in there!", upvotes: 2 },
        ],
      },
      {
        by: "ahmar_ansari",
        title: "Best treats for positive reinforcement training?",
        body: "Looking for small, healthy, high-value treats that won't overfeed during long sessions.",
        tags: ["treats", "reinforcement"],
        upvotes: 5,
        answers: [
          { by: "prabhat", text: "Boiled chicken cut into pea-sized bits is the gold standard — high value and low calorie. Keep a mix so the reward stays exciting.", upvotes: 4, isAccepted: true },
        ],
      },
      {
        by: "ishra",
        title: "Recommended certified force-free trainers in Hyderabad?",
        body: "Want a trainer who uses reward-based methods only — no choke chains or e-collars. Who do you recommend?",
        tags: ["trainer", "force-free"],
        upvotes: 8,
        answers: [
          { by: "ahmar_ansari", text: "Look for trainers certified by IATAH or similar bodies. We worked with a positive-only trainer in Madhapur and saw huge progress in 4 weeks.", upvotes: 5, isAccepted: true },
          { by: "varun", text: "Avoid anyone promising 'instant obedience' — that usually means aversive tools. Ask about their methods upfront.", upvotes: 3 },
        ],
      },
      {
        by: "varun",
        title: "How do I potty train an adult rescue dog?",
        body: "Adopted a 2-year-old who isn't house-trained. Is it harder than with a puppy?",
        tags: ["potty-training", "rescue", "adult-dog"],
        upvotes: 4,
        answers: [
          { by: "prabhat", text: "Same principles as a pup — take them out on a strict schedule (after meals, naps, play) and reward heavily outside. Adults often pick it up faster. Crate helps overnight.", upvotes: 3, isAccepted: true },
        ],
      },
    ],
  },
];

const seedCircles = async () => {
  // ── Resolve users ──────────────────────────────────────────────────────────
  const creator = await User.findOne({ where: { username: CREATOR_USERNAME } });
  if (!creator) throw new Error(`Creator user @${CREATOR_USERNAME} not found.`);

  const userByUsername: Record<string, any> = {};
  for (const uname of COMMUNITY_USERNAMES) {
    const u = await User.findOne({ where: { username: uname } });
    if (!u) {
      console.warn(`[warn] community user @${uname} not found — their Q&As will fall back to @${CREATOR_USERNAME}`);
      continue;
    }
    userByUsername[uname] = u;
  }
  const idOf = (uname: string) => (userByUsername[uname]?.id ?? creator.id);

  // Everyone who should be a member of each circle (creator as admin + community as members)
  const memberUsernames = COMMUNITY_USERNAMES.filter((u) => userByUsername[u]);

  for (const c of CIRCLES) {
    const existing = await Circle.findOne({ where: { name: c.name } });
    if (existing) {
      console.log(`[skip] circle already exists → ${c.name}`);
      continue;
    }

    const memberCount = 1 + memberUsernames.length; // creator + community members

    const circle = await Circle.create({
      name: c.name,
      description: c.description,
      category: c.category,
      coverImage: null,
      createdBy: creator.id,
      memberCount,
      isPublic: true,
    });
    console.log(`[created] circle → ${c.name} (${c.category})`);

    // ── Members ────────────────────────────────────────────────────────────────
    await CircleMember.create({ circleId: circle.id, userId: creator.id, role: "admin" });
    for (const uname of memberUsernames) {
      await CircleMember.create({ circleId: circle.id, userId: idOf(uname), role: "member" });
    }

    // ── Questions + answers ──────────────────────────────────────────────────────
    for (const q of c.questions) {
      const question = await Question.create({
        userId: idOf(q.by),
        circleId: circle.id,
        title: q.title,
        body: q.body,
        tags: q.tags ?? [],
        upvotes: q.upvotes ?? 0,
        answerCount: q.answers.length,
      });

      for (const a of q.answers) {
        await QuestionAnswer.create({
          questionId: question.id,
          userId: idOf(a.by),
          text: a.text,
          upvotes: a.upvotes ?? 0,
          isAccepted: a.isAccepted ?? false,
        });
      }
      console.log(`   └─ question (${q.answers.length} answers) → ${q.title}`);
    }
  }
};

try {
  await seedCircles();
  console.log("\n✅ Circle seeding complete.");
} catch (error: any) {
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  await db.sequelize.close();
}
