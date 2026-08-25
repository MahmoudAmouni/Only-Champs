/**
 * Seed script — see docs/02-BACKEND.md §7 for the full spec and why this
 * exists: an app screenshotted empty reads as a tutorial, not a product.
 *
 * Run with: npx tsx supabase/seed.ts
 *
 * Uses the service role key (bypasses RLS) — the second and last
 * legitimate use of it, alongside lib/actions/subscribe.ts.
 *
 * Scope: six published coaches, each with their own pricing ladder,
 * content library, client roster, programs and conversations. Every
 * client has an assigned program and real training history, so no demo
 * account lands on an empty screen.
 *
 * Media note: avatars and photography use external URLs (pravatar,
 * Unsplash) directly, not real Supabase Storage uploads. That's a
 * deliberate seed-only shortcut, not the real upload path —
 * getSignedMediaUrl() passes through any media_path that's already a
 * full URL instead of trying to sign it, so this data renders without a
 * Storage round-trip. All four hosts are allowed in next.config.ts.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_EMAIL_SUFFIX = "@onlychamps.demo";
const DEMO_PASSWORD = "OnlyChamps2026!";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Scatters a timestamp across a plausible hour of the day, then clamps it
 * to the past. Randomising the hour on a date that is already "today" can
 * land in the future, which renders as a negative relative time — the coach
 * inbox showed "-1d ago" on its newest threads. */
function atTimeOfDay(date: Date, minHour: number, maxHour: number) {
  date.setHours(randInt(minHour, maxHour), randInt(0, 59), 0, 0);
  const now = Date.now();
  if (date.getTime() > now) date.setTime(now - randInt(5, 180) * 60_000);
  return date;
}

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, ".")}${DEMO_EMAIL_SUFFIX}`;
}

/** Real faces rather than initials — initials read as placeholder data. */
function avatarUrl(seed: string) {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(seed)}`;
}

const GYM_PHOTOS = [
  "photo-1517836357463-d25dfeac3438",
  "photo-1518611012118-696072aa579a",
  "photo-1534438327276-14e5300c3a48",
  "photo-1541534741688-6078c6bfb5c5",
  "photo-1546483875-ad9014c88eba",
  "photo-1550345332-09e3ac987658",
  "photo-1566241440091-ec10de8db2e1",
  "photo-1571019613454-1cb2f99b2d8b",
  "photo-1581009146145-b5ef050c2e1e",
  "photo-1583454110551-21f2fa2afe61",
  "photo-1584466977773-e625c37cdd50",
];

let photoCursor = 0;
function gymPhoto(w: number, h: number) {
  const id = GYM_PHOTOS[photoCursor++ % GYM_PHOTOS.length];
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&q=80&auto=format&fit=crop`;
}

function progressPhoto(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/800`;
}

async function createConfirmedUser(email: string, fullName: string, role: "coach" | "client") {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// Exercise library — shared across every coach (coach_id null).
// ---------------------------------------------------------------------------

type ExerciseDef = { name: string; muscle_group: string; equipment: string; load: number | null };

/** `load` is a plausible working weight in kg for a mid-level lifter, used
 * as the base for progression in the generated set logs. null means the
 * movement is loaded by bodyweight, so set_logs.weight_kg stays null and
 * only reps are recorded — which is also what the real logger does. */
const EXERCISES: ExerciseDef[] = [
  { name: "Barbell Back Squat", muscle_group: "Legs", equipment: "Barbell", load: 90 },
  { name: "Conventional Deadlift", muscle_group: "Back", equipment: "Barbell", load: 120 },
  { name: "Barbell Bench Press", muscle_group: "Chest", equipment: "Barbell", load: 70 },
  { name: "Overhead Press", muscle_group: "Shoulders", equipment: "Barbell", load: 45 },
  { name: "Barbell Row", muscle_group: "Back", equipment: "Barbell", load: 65 },
  { name: "Pull-up", muscle_group: "Back", equipment: "Bodyweight", load: null },
  { name: "Chin-up", muscle_group: "Back", equipment: "Bodyweight", load: null },
  { name: "Dip", muscle_group: "Chest", equipment: "Bodyweight", load: null },
  { name: "Push-up", muscle_group: "Chest", equipment: "Bodyweight", load: null },
  { name: "Incline Dumbbell Press", muscle_group: "Chest", equipment: "Dumbbell", load: 26 },
  { name: "Romanian Deadlift", muscle_group: "Hamstrings", equipment: "Barbell", load: 80 },
  { name: "Front Squat", muscle_group: "Legs", equipment: "Barbell", load: 65 },
  { name: "Leg Press", muscle_group: "Legs", equipment: "Machine", load: 150 },
  { name: "Leg Curl", muscle_group: "Hamstrings", equipment: "Machine", load: 45 },
  { name: "Leg Extension", muscle_group: "Quads", equipment: "Machine", load: 50 },
  { name: "Lat Pulldown", muscle_group: "Back", equipment: "Machine", load: 60 },
  { name: "Seated Cable Row", muscle_group: "Back", equipment: "Cable", load: 60 },
  { name: "Dumbbell Shoulder Press", muscle_group: "Shoulders", equipment: "Dumbbell", load: 22 },
  { name: "Lateral Raise", muscle_group: "Shoulders", equipment: "Dumbbell", load: 10 },
  { name: "Face Pull", muscle_group: "Shoulders", equipment: "Cable", load: 25 },
  { name: "Rear Delt Fly", muscle_group: "Shoulders", equipment: "Dumbbell", load: 9 },
  { name: "Barbell Curl", muscle_group: "Biceps", equipment: "Barbell", load: 30 },
  { name: "Hammer Curl", muscle_group: "Biceps", equipment: "Dumbbell", load: 14 },
  { name: "Preacher Curl", muscle_group: "Biceps", equipment: "Barbell", load: 25 },
  { name: "Tricep Pushdown", muscle_group: "Triceps", equipment: "Cable", load: 35 },
  { name: "Skull Crusher", muscle_group: "Triceps", equipment: "Barbell", load: 28 },
  { name: "Hip Thrust", muscle_group: "Glutes", equipment: "Barbell", load: 85 },
  { name: "Glute Bridge", muscle_group: "Glutes", equipment: "Barbell", load: 50 },
  { name: "Cable Kickback", muscle_group: "Glutes", equipment: "Cable", load: 15 },
  { name: "Walking Lunge", muscle_group: "Legs", equipment: "Dumbbell", load: 18 },
  { name: "Bulgarian Split Squat", muscle_group: "Legs", equipment: "Dumbbell", load: 20 },
  { name: "Goblet Squat", muscle_group: "Legs", equipment: "Kettlebell", load: 24 },
  { name: "Standing Calf Raise", muscle_group: "Calves", equipment: "Machine", load: 70 },
  { name: "Plank", muscle_group: "Core", equipment: "Bodyweight", load: null },
  { name: "Cable Crunch", muscle_group: "Core", equipment: "Cable", load: 35 },
  { name: "Hanging Leg Raise", muscle_group: "Core", equipment: "Bodyweight", load: null },
  { name: "Dead Bug", muscle_group: "Core", equipment: "Bodyweight", load: null },
  { name: "Bird Dog", muscle_group: "Core", equipment: "Bodyweight", load: null },
  { name: "Pallof Press", muscle_group: "Core", equipment: "Cable", load: 20 },
  { name: "Farmer's Carry", muscle_group: "Full Body", equipment: "Dumbbell", load: 32 },
  { name: "Kettlebell Swing", muscle_group: "Full Body", equipment: "Kettlebell", load: 24 },
  { name: "Kettlebell Clean & Press", muscle_group: "Full Body", equipment: "Kettlebell", load: 20 },
  { name: "Turkish Get-up", muscle_group: "Full Body", equipment: "Kettlebell", load: 16 },
  { name: "Battle Ropes", muscle_group: "Conditioning", equipment: "Ropes", load: null },
  { name: "Burpee", muscle_group: "Conditioning", equipment: "Bodyweight", load: null },
  { name: "Box Jump", muscle_group: "Legs", equipment: "Bodyweight", load: null },
  { name: "Sled Push", muscle_group: "Conditioning", equipment: "Sled", load: 60 },
  { name: "Assault Bike", muscle_group: "Conditioning", equipment: "Machine", load: null },
  { name: "Rowing Machine", muscle_group: "Conditioning", equipment: "Machine", load: null },
  { name: "Tempo Run", muscle_group: "Conditioning", equipment: "None", load: null },
  { name: "Hill Sprints", muscle_group: "Conditioning", equipment: "None", load: null },
  { name: "Easy Run", muscle_group: "Conditioning", equipment: "None", load: null },
  { name: "Pistol Squat", muscle_group: "Legs", equipment: "Bodyweight", load: null },
  { name: "Ring Row", muscle_group: "Back", equipment: "Rings", load: null },
  { name: "Handstand Push-up", muscle_group: "Shoulders", equipment: "Bodyweight", load: null },
  { name: "L-Sit", muscle_group: "Core", equipment: "Bodyweight", load: null },
  { name: "Nordic Curl", muscle_group: "Hamstrings", equipment: "Bodyweight", load: null },
  { name: "Landmine Press", muscle_group: "Shoulders", equipment: "Barbell", load: 30 },
  { name: "Chest Fly", muscle_group: "Chest", equipment: "Cable", load: 18 },
  { name: "Zercher Squat", muscle_group: "Legs", equipment: "Barbell", load: 60 },
];

// ---------------------------------------------------------------------------
// Training splits — reused across coaches, assigned by coaching style.
// ---------------------------------------------------------------------------

type Split = { name: string; days: { name: string; exercises: string[] }[] };

const SPLITS: Record<string, Split> = {
  ppl: {
    name: "Push Pull Legs",
    days: [
      { name: "Push", exercises: ["Barbell Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Pushdown", "Lateral Raise"] },
      { name: "Pull", exercises: ["Conventional Deadlift", "Barbell Row", "Pull-up", "Face Pull", "Barbell Curl"] },
      { name: "Legs", exercises: ["Barbell Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Standing Calf Raise"] },
    ],
  },
  powerbuilding: {
    name: "Powerbuilding",
    days: [
      { name: "Squat Focus", exercises: ["Barbell Back Squat", "Front Squat", "Leg Extension", "Walking Lunge", "Plank"] },
      { name: "Bench Focus", exercises: ["Barbell Bench Press", "Dip", "Incline Dumbbell Press", "Skull Crusher", "Cable Crunch"] },
      { name: "Deadlift Focus", exercises: ["Conventional Deadlift", "Hip Thrust", "Seated Cable Row", "Hammer Curl", "Farmer's Carry"] },
    ],
  },
  upperLower: {
    name: "Upper / Lower",
    days: [
      { name: "Upper A", exercises: ["Barbell Bench Press", "Barbell Row", "Dumbbell Shoulder Press", "Lat Pulldown", "Barbell Curl"] },
      { name: "Lower A", exercises: ["Barbell Back Squat", "Romanian Deadlift", "Leg Curl", "Standing Calf Raise", "Pallof Press"] },
      { name: "Upper B", exercises: ["Overhead Press", "Chin-up", "Incline Dumbbell Press", "Seated Cable Row", "Tricep Pushdown"] },
    ],
  },
  starter: {
    name: "Starter Strength",
    days: [
      { name: "Full Body A", exercises: ["Goblet Squat", "Push-up", "Ring Row", "Glute Bridge", "Plank"] },
      { name: "Full Body B", exercises: ["Romanian Deadlift", "Dumbbell Shoulder Press", "Lat Pulldown", "Walking Lunge", "Dead Bug"] },
      { name: "Full Body C", exercises: ["Leg Press", "Incline Dumbbell Press", "Seated Cable Row", "Hammer Curl", "Bird Dog"] },
    ],
  },
  hybrid: {
    name: "Hybrid Base",
    days: [
      { name: "Strength", exercises: ["Barbell Back Squat", "Overhead Press", "Barbell Row", "Nordic Curl", "Pallof Press"] },
      { name: "Tempo", exercises: ["Tempo Run", "Hill Sprints", "Plank", "Dead Bug"] },
      { name: "Long Easy", exercises: ["Easy Run", "Bird Dog", "Farmer's Carry"] },
    ],
  },
  calisthenics: {
    name: "Calisthenics Progression",
    days: [
      { name: "Push Skills", exercises: ["Handstand Push-up", "Dip", "Push-up", "L-Sit"] },
      { name: "Pull Skills", exercises: ["Pull-up", "Chin-up", "Ring Row", "Hanging Leg Raise"] },
      { name: "Legs & Core", exercises: ["Pistol Squat", "Box Jump", "Nordic Curl", "Plank"] },
    ],
  },
  glutes: {
    name: "Glute & Core Foundations",
    days: [
      { name: "Lower A", exercises: ["Hip Thrust", "Bulgarian Split Squat", "Cable Kickback", "Leg Curl", "Dead Bug"] },
      { name: "Upper", exercises: ["Lat Pulldown", "Dumbbell Shoulder Press", "Seated Cable Row", "Rear Delt Fly", "Pallof Press"] },
      { name: "Lower B", exercises: ["Romanian Deadlift", "Goblet Squat", "Glute Bridge", "Standing Calf Raise", "Bird Dog"] },
    ],
  },
  hypertrophy: {
    name: "Hypertrophy Split",
    days: [
      { name: "Chest & Triceps", exercises: ["Barbell Bench Press", "Incline Dumbbell Press", "Chest Fly", "Skull Crusher", "Tricep Pushdown"] },
      { name: "Back & Biceps", exercises: ["Lat Pulldown", "Barbell Row", "Seated Cable Row", "Preacher Curl", "Hammer Curl"] },
      { name: "Legs & Shoulders", exercises: ["Leg Press", "Leg Extension", "Leg Curl", "Lateral Raise", "Rear Delt Fly"] },
    ],
  },
  kettlebell: {
    name: "Kettlebell Conditioning",
    days: [
      { name: "Ballistics", exercises: ["Kettlebell Swing", "Kettlebell Clean & Press", "Goblet Squat", "Battle Ropes"] },
      { name: "Grind", exercises: ["Turkish Get-up", "Farmer's Carry", "Landmine Press", "Pallof Press"] },
      { name: "Engine", exercises: ["Assault Bike", "Rowing Machine", "Burpee", "Sled Push"] },
    ],
  },
};

// ---------------------------------------------------------------------------
// The roster — everything below is generated from this one array.
// ---------------------------------------------------------------------------

type TierDef = { level: 1 | 2 | 3; name: string; description: string; price: number; features: string[] };
type PostDef = { title: string; level: 1 | 2 | 3; type: "text" | "image" | "video"; body: string };

/** joinedDaysAgo staggers subscription start dates across the past ~6
 * months so the dashboard revenue chart has a genuine growth trend to
 * plot. lastWorkoutDaysAgo drives the at-risk panel: the dashboard flags
 * anyone whose most recent session is 7+ days old. */
type ClientDef = {
  name: string;
  level: 1 | 2 | 3;
  joinedDaysAgo: number;
  lastWorkoutDaysAgo: number;
  atRisk?: boolean;
};

type CoachDef = {
  handle: string;
  name: string;
  headline: string;
  bio: string;
  profileBio: string;
  specialties: string[];
  timezone: string;
  tiers: TierDef[];
  posts: PostDef[];
  clients: ClientDef[];
  /** SPLITS keys used for this coach's programs, by tier level. */
  splits: { 1: string; 2: string; 3: string };
  templates: string[];
  groupTopics: string[];
};

const COACHES: CoachDef[] = [
  {
    handle: "marcus",
    name: "Marcus Chen",
    headline: "Strength coaching for people who lift late and eat early",
    bio: "I coach lifters of every level — from your first barbell squat to your first competition total. Programming is individualized, but the principles never change: consistency, progressive overload, and enough protein to make your dietitian proud.",
    profileBio: "12 years coaching strength and physique. Ex-competitive powerlifter, now I just help people not skip leg day.",
    specialties: ["Strength Training", "Powerlifting", "Fat Loss"],
    timezone: "America/New_York",
    tiers: [
      { level: 1, name: "Content", description: "Weekly training content and programming breakdowns.", price: 1900, features: ["Weekly video library", "Programming breakdowns", "Community feed"] },
      { level: 2, name: "Group", description: "Everything in Content, plus group coaching.", price: 5900, features: ["Everything in Content", "Group chat access", "Monthly group call", "Check-in template"] },
      { level: 3, name: "1:1 Coaching", description: "Fully custom programming and direct access to me.", price: 24900, features: ["Everything in Group", "Custom 1:1 programming", "Direct chat with Marcus", "Weekly form-check review"] },
    ],
    posts: [
      { title: "Why your squat stalled (and it's not what you think)", level: 1, type: "text", body: "Most stalls aren't strength problems, they're bar-path problems. Film your next three attempts from the side before you touch your programming." },
      { title: "This week's leg day walkthrough", level: 1, type: "video", body: "Full session, unedited. Watch the bar speed on set 3 of the front squats." },
      { title: "Protein timing myths, debunked", level: 1, type: "text", body: "The 30-minute anabolic window is mostly marketing. Total daily intake matters far more than timing — here's what actually moves the needle." },
      { title: "Deload week: what it should actually feel like", level: 1, type: "image", body: "A deload isn't a rest week. It's still training, just at a volume you can recover from." },
      { title: "Three warm-up sets you're probably skipping", level: 1, type: "video", body: "Ramping properly costs you four minutes and buys you a working set that actually counts." },
      { title: "How to read your own bar speed", level: 1, type: "text", body: "If the last rep looks the same as the first, you left weight on the platform. Here's how to judge it without a tracker." },
      { title: "Group Q&A recap — hip pain during squats", level: 2, type: "text", body: "Summary of last night's call for anyone who missed it. Short answer: it's almost always ankle mobility, not hip mobility." },
      { title: "This month's group programming block", level: 2, type: "image", body: "Four-week upper/lower split, posted early for anyone who wants a head start on planning their week." },
      { title: "Group call: form checks live", level: 2, type: "video", body: "Recording from Tuesday's group call. Three form checks, all deadlift-related, all the same fix." },
      { title: "How I program conjugate for group clients", level: 2, type: "text", body: "A breakdown of how max-effort and dynamic-effort days rotate across the four-week group block." },
      { title: "Autoregulation without overthinking it", level: 2, type: "text", body: "You don't need a velocity tracker. You need one honest question at the top of every working set." },
      { title: "Your program update — week 5 progression", level: 3, type: "text", body: "Notes on this week's adjustments based on your check-in data. Volume's up slightly on posterior chain." },
      { title: "1:1 form check response", level: 3, type: "video", body: "Reviewed your bench video — bar path is solid, but let's tighten the leg drive timing." },
      { title: "Competition prep: 8 weeks out", level: 3, type: "text", body: "Here's how the next eight weeks break down. Peak week isn't until the very end, be patient with the taper." },
      { title: "Custom nutrition adjustment", level: 3, type: "image", body: "Updated macro targets based on this week's weigh-ins and training load." },
      { title: "Opener selection, and why yours is too heavy", level: 3, type: "video", body: "Your opener should be a lift you could hit on your worst day. Walkthrough of how I pick all three attempts." },
    ],
    clients: [
      { name: "Sofia Martins", level: 1, joinedDaysAgo: 150, lastWorkoutDaysAgo: 2 },
      { name: "Daniel Osei", level: 1, joinedDaysAgo: 128, lastWorkoutDaysAgo: 24, atRisk: true },
      { name: "Priya Nair", level: 2, joinedDaysAgo: 111, lastWorkoutDaysAgo: 1 },
      { name: "Jordan Blake", level: 2, joinedDaysAgo: 84, lastWorkoutDaysAgo: 21, atRisk: true },
      { name: "Amara Okafor", level: 2, joinedDaysAgo: 62, lastWorkoutDaysAgo: 3 },
      { name: "Liam Fischer", level: 3, joinedDaysAgo: 47, lastWorkoutDaysAgo: 1 },
      { name: "Elena Volkov", level: 3, joinedDaysAgo: 25, lastWorkoutDaysAgo: 2 },
      { name: "Tyler Brooks", level: 3, joinedDaysAgo: 9, lastWorkoutDaysAgo: 4 },
    ],
    splits: { 1: "starter", 2: "upperLower", 3: "ppl" },
    templates: ["powerbuilding", "upperLower"],
    groupTopics: [
      "Reminder: group call is Thursday 7pm EST.",
      "Looking forward to it!",
      "Quick question — is the leg day superset order strict or flexible?",
      "Flexible, just get all the work in.",
      "Anyone else's DOMS brutal this week?",
      "Same here, squats hit different this block.",
      "That's the volume bump working as intended.",
      "Posted this week's programming update in the feed, check it out.",
    ],
  },
  {
    handle: "nadia",
    name: "Nadia Rahman",
    headline: "Run faster without giving up the barbell",
    bio: "Hybrid training is not two programs stapled together. I coach runners who want to get strong and lifters who want an engine, and the whole point is that neither goal has to lose. Most of my clients are training for a first half marathon while keeping their squat.",
    profileBio: "2:58 marathon, 140kg deadlift, same twelve-week block. Coaching hybrid athletes since 2019.",
    specialties: ["Hybrid Training", "Marathon Prep", "Endurance"],
    timezone: "Europe/London",
    tiers: [
      { level: 1, name: "Training Log", description: "My weekly sessions, paces and reasoning, published as I run them.", price: 1500, features: ["Weekly session breakdowns", "Pace and RPE guidance", "Community feed"] },
      { level: 2, name: "Squad", description: "Train alongside the group with shared blocks and a weekly call.", price: 4500, features: ["Everything in Training Log", "Squad chat", "Weekly group call", "Shared training block"] },
      { level: 3, name: "Full Hybrid", description: "A programme built around your race date and your lifts.", price: 18000, features: ["Everything in Squad", "Individual periodisation", "Direct chat with Nadia", "Race-week strategy"] },
    ],
    posts: [
      { title: "Zone 2 is not a vibe, it's a number", level: 1, type: "text", body: "If you can't hold a conversation, you're not in zone 2. Here's how to find yours without a lab test." },
      { title: "This week's tempo session, explained", level: 1, type: "video", body: "Twenty minutes at threshold. Watch how little the pace drifts — that's the whole point of the session." },
      { title: "Why lifting won't make you slow", level: 1, type: "text", body: "Every runner I've coached who added two strength days got faster, not heavier. The mechanism is stiffness, not size." },
      { title: "Fuelling a long run properly", level: 1, type: "image", body: "Sixty to ninety grams of carbs an hour past the two-hour mark. Practise it in training, not on race day." },
      { title: "Cadence: leave it alone", level: 1, type: "text", body: "Chasing 180 steps per minute fixes nothing on its own. Fix your volume first." },
      { title: "Squad block 4 — the bridge weeks", level: 2, type: "image", body: "Two weeks of reduced mileage and increased intensity before we start the race-specific block." },
      { title: "Group call recap: shin splints", level: 2, type: "video", body: "Recording from Sunday. Almost every case in the squad traced back to a mileage jump, not footwear." },
      { title: "How to run a long run off tired legs", level: 2, type: "text", body: "The Saturday session is supposed to feel heavy. That's the adaptation we're buying." },
      { title: "Squad strength standards for this block", level: 2, type: "text", body: "Targets for squat, deadlift and single-leg work, scaled to bodyweight rather than absolute numbers." },
      { title: "Your race-week plan", level: 3, type: "text", body: "Taper starts Monday. Mileage drops 40%, intensity stays. Do not add anything new this week." },
      { title: "Individual gait review", level: 3, type: "video", body: "Slow-motion breakdown of your footage from the track. Two things to change, one to ignore." },
      { title: "Adjusting your block around the work trip", level: 3, type: "text", body: "Moved your long run to Thursday and cut the Friday strength session. Nothing else changes." },
    ],
    clients: [
      { name: "Ruth Adeyemi", level: 1, joinedDaysAgo: 138, lastWorkoutDaysAgo: 3 },
      { name: "Owen Pritchard", level: 1, joinedDaysAgo: 96, lastWorkoutDaysAgo: 26, atRisk: true },
      { name: "Marco Silva", level: 2, joinedDaysAgo: 71, lastWorkoutDaysAgo: 2 },
      { name: "Hana Kobayashi", level: 3, joinedDaysAgo: 34, lastWorkoutDaysAgo: 1 },
    ],
    splits: { 1: "starter", 2: "hybrid", 3: "hybrid" },
    templates: ["hybrid", "upperLower"],
    groupTopics: [
      "Long run Sunday — anyone want to meet at the park gate at 8?",
      "I'm in. What pace are we thinking?",
      "Easy. Genuinely easy. If you're racing me I'm going home.",
      "Nadia, is the Thursday tempo still 4x8 minutes?",
      "Yes, same as last week but 5 seconds quicker per km.",
      "My legs have not recovered from Tuesday.",
      "That's expected in a bridge week. Sleep more, run slower.",
      "New shoes arrived, first run tomorrow.",
    ],
  },
  {
    handle: "theo",
    name: "Theo Almeida",
    headline: "Bodyweight strength that actually transfers",
    bio: "No gym, no excuses, no nonsense about needing machines. I coach calisthenics progressions from a first strict pull-up to a freestanding handstand, and mobility work that earns its place in the session rather than padding it.",
    profileBio: "Former gymnast turned coach. I care more about your shoulders in ten years than your numbers this month.",
    specialties: ["Calisthenics", "Mobility", "Bodyweight Strength"],
    timezone: "Europe/Lisbon",
    tiers: [
      { level: 1, name: "Basics", description: "The progression library and weekly technique breakdowns.", price: 1200, features: ["Full progression library", "Weekly technique videos", "Community feed"] },
      { level: 2, name: "Practice", description: "Structured blocks with the group and a weekly session review.", price: 3900, features: ["Everything in Basics", "Group chat", "Structured 4-week blocks", "Weekly session review"] },
      { level: 3, name: "Coached", description: "Your own progression path, reviewed on video every week.", price: 14900, features: ["Everything in Practice", "Individual progressions", "Direct chat with Theo", "Weekly video feedback"] },
    ],
    posts: [
      { title: "Your first pull-up is a scapular problem", level: 1, type: "video", body: "Before you add bands, spend two weeks on dead hangs and scap pulls. Most people skip straight past the thing they're missing." },
      { title: "The hollow body, done properly", level: 1, type: "image", body: "Lower back flat on the floor. If there's a gap, shorten the lever until there isn't." },
      { title: "Mobility is strength at the end range", level: 1, type: "text", body: "Passive stretching gives you range you can't use. Load the position instead." },
      { title: "Wrist prep for handstand work", level: 1, type: "video", body: "Four minutes before every session. Skipping this is the single most common reason people quit handstands." },
      { title: "Why I don't program to failure", level: 1, type: "text", body: "Skill work degrades fast under fatigue. Stop two reps short and keep the quality." },
      { title: "Block 2: the L-sit progression", level: 2, type: "image", body: "Six steps from tuck to full. Move on only when you can hold the current step for fifteen seconds." },
      { title: "Group review: ring dips", level: 2, type: "video", body: "Three submissions this week, all with the same turnout timing issue." },
      { title: "Practice structure for a busy week", level: 2, type: "text", body: "Twenty minutes, three times, beats ninety minutes once. Skill follows frequency." },
      { title: "Handstand: wall to freestanding", level: 2, type: "video", body: "The transition nobody films — what the first ten unassisted seconds actually look like." },
      { title: "Your progression update", level: 3, type: "text", body: "Moving you to straddle L-sit this week. Keep the tuck holds as a warm-up, not the main set." },
      { title: "Video feedback — pistol squat depth", level: 3, type: "video", body: "You're losing the position at the bottom because of ankle range, not strength. Two drills attached." },
      { title: "Deload and reassessment", level: 3, type: "text", body: "Week seven, so we test. Same four holds as the start, filmed the same way, then we compare honestly." },
    ],
    clients: [
      { name: "Isabel Duarte", level: 1, joinedDaysAgo: 142, lastWorkoutDaysAgo: 4 },
      { name: "Kwame Mensah", level: 2, joinedDaysAgo: 103, lastWorkoutDaysAgo: 2 },
      { name: "Ben Whitaker", level: 2, joinedDaysAgo: 57, lastWorkoutDaysAgo: 19, atRisk: true },
      { name: "Lucia Ferrari", level: 3, joinedDaysAgo: 30, lastWorkoutDaysAgo: 1 },
    ],
    splits: { 1: "starter", 2: "calisthenics", 3: "calisthenics" },
    templates: ["calisthenics", "starter"],
    groupTopics: [
      "Held my first 10-second freestanding handstand today.",
      "That's the one. Post the video.",
      "Are we repeating block 2 or moving on next week?",
      "Repeating. Half the group is still short on the tuck holds.",
      "My wrists hate me.",
      "Do the prep. All four minutes of it, not the first two.",
      "Anyone training outdoors tomorrow?",
      "Rings are up at the park until six.",
    ],
  },
  {
    handle: "kaia",
    name: "Kaia Lindqvist",
    headline: "Strength training that fits the life you actually have",
    bio: "I coach women through the phases where training usually falls apart: postpartum return, perimenopause, and the years where three sessions a week is genuinely the maximum. The programming is unglamorous and it works.",
    profileBio: "Strength coach and pre/postnatal specialist. Two kids, two barbells, no patience for fitness industry nonsense.",
    specialties: ["Women's Strength", "Postpartum", "Nutrition"],
    timezone: "Europe/Stockholm",
    tiers: [
      { level: 1, name: "Foundations", description: "The full library of sessions, plus nutrition guidance that isn't a diet.", price: 2200, features: ["Session library", "Nutrition guidance", "Community feed"] },
      { level: 2, name: "Small Group", description: "A shared block, a weekly call, and a group that actually answers.", price: 6500, features: ["Everything in Foundations", "Group chat", "Weekly call", "Shared training block"] },
      { level: 3, name: "Private", description: "Individual programming around your recovery, schedule and goals.", price: 22000, features: ["Everything in Small Group", "Individual programming", "Direct chat with Kaia", "Monthly video review"] },
    ],
    posts: [
      { title: "Returning to lifting postpartum: the first six weeks", level: 1, type: "text", body: "Breathing, then bracing, then load. In that order, and slower than you want." },
      { title: "Hip thrust setup nobody teaches", level: 1, type: "video", body: "Bench height, foot position, ribs down. Three fixes that make it a glute exercise again." },
      { title: "Protein without meal prep Sunday", level: 1, type: "image", body: "Six options you can assemble in under four minutes. None of them involve a food scale." },
      { title: "Training around a bad night's sleep", level: 1, type: "text", body: "Cut the sets, keep the session. Showing up at 60% still counts; skipping compounds." },
      { title: "Core work after diastasis", level: 1, type: "video", body: "What to do, what to postpone, and how to tell which category you're in." },
      { title: "Group block: three days, forty minutes", level: 2, type: "image", body: "Built for the schedule most of you actually have, not the one you wish you had." },
      { title: "Call recap: perimenopause and recovery", level: 2, type: "text", body: "Why the same programme feels harder, and what to change before you change the programme." },
      { title: "Group form check: Romanian deadlifts", level: 2, type: "video", body: "Four submissions, three of them stopping the bar too low." },
      { title: "Progressing when you can't add weight", level: 2, type: "text", body: "Tempo, range, density, then load. There are three levers before the one everyone reaches for." },
      { title: "Your block adjustment", level: 3, type: "text", body: "Dropping Thursday to two main lifts given how the last fortnight has gone. We'll rebuild volume in week three." },
      { title: "Video review — squat depth and bracing", level: 3, type: "video", body: "Depth is fine. The brace is releasing at the turnaround, which is why the bar drifts." },
      { title: "Nutrition check-in and adjustment", level: 3, type: "image", body: "Slight protein increase, no change to total intake. Let's hold this for three weeks." },
    ],
    clients: [
      { name: "Mei Chen", level: 1, joinedDaysAgo: 133, lastWorkoutDaysAgo: 5 },
      { name: "Freya Nilsson", level: 2, joinedDaysAgo: 88, lastWorkoutDaysAgo: 2 },
      { name: "Dana Kowalski", level: 2, joinedDaysAgo: 65, lastWorkoutDaysAgo: 23, atRisk: true },
      { name: "Aisha Karim", level: 3, joinedDaysAgo: 41, lastWorkoutDaysAgo: 1 },
    ],
    splits: { 1: "starter", 2: "glutes", 3: "glutes" },
    templates: ["glutes", "starter"],
    groupTopics: [
      "Made all three sessions this week for the first time since January.",
      "That's the win. Everything else follows from that.",
      "Is the Thursday session okay to move to Friday?",
      "Yes, as long as you keep a day between it and the lower session.",
      "Anyone else find the tempo squats brutal?",
      "Four seconds down is much longer than it sounds.",
      "Reminder that the call is 8pm Wednesday, recording posted after.",
      "Can't make it live but I'll watch it back.",
    ],
  },
  {
    handle: "dre",
    name: "Andre Wallace",
    headline: "Hypertrophy programming for people chasing a stage",
    bio: "Contest prep and offseason work for natural bodybuilders. I run high-accountability coaching: weekly photos, weekly numbers, weekly adjustments. If you want a template you can buy one for twenty dollars — this is the other thing.",
    profileBio: "Natural pro card 2021. Coaching prep since 2016. I answer every check-in personally, usually at an unreasonable hour.",
    specialties: ["Hypertrophy", "Contest Prep", "Bodybuilding"],
    timezone: "America/Chicago",
    tiers: [
      { level: 1, name: "Offseason", description: "Training splits, technique work and the reasoning behind both.", price: 2500, features: ["Full split library", "Technique breakdowns", "Community feed"] },
      { level: 2, name: "Team", description: "Team programming, group accountability and a weekly review call.", price: 7900, features: ["Everything in Offseason", "Team chat", "Weekly review call", "Team programming block"] },
      { level: 3, name: "Prep", description: "Full contest prep with weekly adjustments and peak week.", price: 29900, features: ["Everything in Team", "Individual prep programming", "Direct chat with Dre", "Weekly photo and macro review", "Peak week protocol"] },
    ],
    posts: [
      { title: "Junk volume is real and you're doing it", level: 1, type: "text", body: "Sets four and five of the same movement are paying rent, not earning it. Cut them and add intensity." },
      { title: "Lat pulldown: the grip that changes it", level: 1, type: "video", body: "Thumbless, elbows driving down not back. Feel it in the right place for once." },
      { title: "Offseason calorie ranges, honestly", level: 1, type: "image", body: "A slow surplus builds more muscle and less regret. Here's the range I use with clients." },
      { title: "Why I stopped programming to failure every set", level: 1, type: "text", body: "Two sets shy of failure, one set to it. Recovery is the limiting resource, not effort." },
      { title: "Rear delts deserve their own day", level: 1, type: "video", body: "Not four sets tacked onto the end of a push session when you're already cooked." },
      { title: "Team block 3 — intensity techniques", level: 2, type: "image", body: "Myo-reps and drop sets, but only on the movements where they cost you nothing the next day." },
      { title: "Review call recap: stubborn calves", level: 2, type: "video", body: "Frequency, not volume. Six times a week, three sets, full stretch. That's the whole answer." },
      { title: "How the team tracks weekly averages", level: 2, type: "text", body: "Daily weight means nothing. The seven-day average is the only number I look at." },
      { title: "Posing practice for the team", level: 2, type: "video", body: "Twenty minutes a week from now, not eight weeks out when it's too late to fix." },
      { title: "Your prep update — 12 weeks out", level: 3, type: "text", body: "Cardio stays where it is. Calories down 150. Training volume unchanged." },
      { title: "Photo review and adjustment", level: 3, type: "image", body: "Back is tracking well, quads need another block of frequency. Adjusted your Wednesday." },
      { title: "Peak week protocol", level: 3, type: "text", body: "Everything you need for the final seven days. Do not improvise, and do not read a forum this week." },
    ],
    clients: [
      { name: "Samir Haddad", level: 1, joinedDaysAgo: 121, lastWorkoutDaysAgo: 3 },
      { name: "Naomi Reyes", level: 2, joinedDaysAgo: 79, lastWorkoutDaysAgo: 1 },
      { name: "Victor Osei", level: 3, joinedDaysAgo: 52, lastWorkoutDaysAgo: 2 },
      { name: "Tobias Klein", level: 3, joinedDaysAgo: 18, lastWorkoutDaysAgo: 1 },
    ],
    splits: { 1: "upperLower", 2: "hypertrophy", 3: "hypertrophy" },
    templates: ["hypertrophy", "ppl"],
    groupTopics: [
      "Weekly average is down 0.4kg, training's holding.",
      "That's exactly the rate we want. Don't touch anything.",
      "Anyone else's appetite gone through the roof this week?",
      "Week four of a deficit will do that. Volume of food, not calories.",
      "Posing practice tonight, 9pm, link in the feed.",
      "Calves finally growing after six weeks of the frequency block.",
      "Told you. Boring and frequent beats clever and occasional.",
      "New photos uploaded for review.",
    ],
  },
  {
    handle: "yuki",
    name: "Yuki Tanaka",
    headline: "Thirty-minute sessions that leave you genuinely conditioned",
    bio: "Kettlebells, carries and an engine you can use. I coach people who don't have ninety minutes and never will — parents, shift workers, anyone whose training window is short and non-negotiable. Short does not mean easy.",
    profileBio: "Kettlebell sport background, now coaching general conditioning. I believe most people are under-trained and over-programmed.",
    specialties: ["Conditioning", "Kettlebells", "Fat Loss"],
    timezone: "Asia/Tokyo",
    tiers: [
      { level: 1, name: "Sessions", description: "Three published sessions a week, thirty minutes each.", price: 1800, features: ["3 sessions per week", "Technique library", "Community feed"] },
      { level: 2, name: "Circle", description: "Shared blocks, group accountability and a weekly call.", price: 4900, features: ["Everything in Sessions", "Group chat", "Weekly call", "Shared block"] },
      { level: 3, name: "Direct", description: "Programming built around your schedule and your equipment.", price: 19900, features: ["Everything in Circle", "Individual programming", "Direct chat with Yuki", "Technique review"] },
    ],
    posts: [
      { title: "The swing is a hinge, not a squat", level: 1, type: "video", body: "If your knees travel forward, you're squatting the bell. Shins stay vertical." },
      { title: "Thirty minutes, properly structured", level: 1, type: "text", body: "Five to warm up, twenty to work, five to breathe down. The twenty is not negotiable." },
      { title: "One kettlebell is enough for a year", level: 1, type: "image", body: "Density, tempo and unilateral work will take you further than a second bell will." },
      { title: "Carries: the most underrated exercise", level: 1, type: "text", body: "Grip, core and conditioning in one movement that nobody can do wrong." },
      { title: "Breathing under load", level: 1, type: "video", body: "Match the breath to the ballistic. It's the difference between ten minutes and two." },
      { title: "Circle block: EMOM ladders", level: 2, type: "image", body: "Four weeks, same twelve minutes, more work each week. Progress you can actually see." },
      { title: "Call recap: grip failing before legs", level: 2, type: "text", body: "Almost always technique, occasionally chalk, never a reason to lower the bell weight." },
      { title: "Group technique review — cleans", level: 2, type: "video", body: "Five submissions, four of them casting the bell too far out." },
      { title: "How to scale on a bad day", level: 2, type: "text", body: "Keep the structure, cut the rounds. Never cut the warm-up, that's backwards." },
      { title: "Your block for the next four weeks", level: 3, type: "text", body: "Built around the two bells you have and the three mornings you can actually train." },
      { title: "Technique review — get-up", level: 3, type: "video", body: "The bridge is where it's falling apart. Two regressions to run for a fortnight." },
      { title: "Adjusting for the night-shift rotation", level: 3, type: "image", body: "Same volume, different placement. Your hard session moves to your second day off." },
    ],
    clients: [
      { name: "Zainab Ali", level: 1, joinedDaysAgo: 108, lastWorkoutDaysAgo: 4 },
      { name: "Rina Sato", level: 2, joinedDaysAgo: 74, lastWorkoutDaysAgo: 2 },
      { name: "Callum Ross", level: 3, joinedDaysAgo: 38, lastWorkoutDaysAgo: 1 },
    ],
    splits: { 1: "starter", 2: "kettlebell", 3: "kettlebell" },
    templates: ["kettlebell", "starter"],
    groupTopics: [
      "Finished the twelve-minute ladder without dropping the bell.",
      "Four weeks ago that was eight minutes. That's the progress.",
      "Is the Saturday session compulsory or optional?",
      "Optional. Three sessions is the programme, four is a bonus.",
      "My forearms are destroyed.",
      "Carries will do that. It passes by week three.",
      "Call is 7am Sunday my time — recording after for everyone else.",
      "Bought a second bell finally.",
    ],
  },
];

/** Clients who also subscribe to a second coach — makes the feed's coach
 * switcher real rather than dead code, and exercises the multi-coach path
 * through /profile and /chat. */
const CROSS_SUBSCRIPTIONS: { client: string; coach: string; level: 1 | 2 | 3 }[] = [
  { client: "Sofia Martins", coach: "nadia", level: 1 },
  { client: "Elena Volkov", coach: "dre", level: 2 },
  { client: "Priya Nair", coach: "theo", level: 1 },
];

// ---------------------------------------------------------------------------
// 0. Cleanup — makes this script idempotent. Deleting the seeded auth.users
//    cascades through profiles/coaches/tiers/subscriptions/posts/programs/
//    check_ins/conversations/messages via ON DELETE CASCADE. The one thing
//    that doesn't cascade is the global exercise library (coach_id is null
//    by design, so it isn't owned by any user) — cleared separately by name
//    so re-running doesn't silently duplicate it.
// ---------------------------------------------------------------------------

async function cleanup() {
  console.log("Clearing previous seed data...");

  const { data: userList, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error(`listUsers: ${listErr.message}`);

  const demoUsers = userList.users.filter((u) => u.email?.endsWith(DEMO_EMAIL_SUFFIX));
  for (const u of demoUsers) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) throw new Error(`deleteUser(${u.email}): ${error.message}`);
  }

  const { error: exErr } = await admin
    .from("exercises")
    .delete()
    .is("coach_id", null)
    .in("name", EXERCISES.map((e) => e.name));
  if (exErr) throw new Error(`exercises cleanup: ${exErr.message}`);

  console.log(`  removed ${demoUsers.length} previously-seeded users`);
}

// ---------------------------------------------------------------------------
// 1. Exercise library
// ---------------------------------------------------------------------------

async function seedExercises() {
  console.log("Creating exercise library...");
  const { data, error } = await admin
    .from("exercises")
    .insert(EXERCISES.map((e) => ({
      name: e.name,
      muscle_group: e.muscle_group,
      equipment: e.equipment,
      coach_id: null,
    })))
    .select("id, name");
  if (error) throw new Error(`exercises insert: ${error.message}`);
  console.log(`  ${data!.length} exercises`);
  return new Map(data!.map((e) => [e.name, e.id]));
}

// ---------------------------------------------------------------------------
// 2. Coach — account, storefront, pricing ladder, content
// ---------------------------------------------------------------------------

type SeededCoach = {
  def: CoachDef;
  id: string;
  tierIdByLevel: Map<number, string>;
};

async function seedCoach(def: CoachDef): Promise<SeededCoach> {
  const id = await createConfirmedUser(emailFor(def.name), def.name, "coach");

  await admin.from("profiles").update({
    avatar_url: avatarUrl(def.handle),
    bio: def.profileBio,
    timezone: def.timezone,
  }).eq("id", id);

  const { error: coachErr } = await admin.from("coaches").insert({
    id,
    handle: def.handle,
    display_name: def.name,
    headline: def.headline,
    bio: def.bio,
    cover_image_url: gymPhoto(1600, 500),
    specialties: def.specialties,
    // The stripe_* columns stay null: this build has no payment processor
    // (see docs/05-BUILD-ORDER.md Phase 6), and stripe_account_id carries a
    // unique constraint, so a shared placeholder collides on the second
    // coach anyway.
    is_published: true,
  });
  if (coachErr) throw new Error(`coaches insert (${def.handle}): ${coachErr.message}`);

  const { data: tiers, error: tierErr } = await admin
    .from("tiers")
    .insert(def.tiers.map((t) => ({
      coach_id: id,
      level: t.level,
      name: t.name,
      description: t.description,
      price_cents: t.price,
      features: t.features,
    })))
    .select("id, level");
  if (tierErr) throw new Error(`tiers insert (${def.handle}): ${tierErr.message}`);

  const posts = def.posts.map((p, i) => ({
    coach_id: id,
    min_tier_level: p.level,
    media_type: p.type,
    title: p.title,
    body: p.body,
    media_path: p.type === "text" ? null : gymPhoto(1200, 800),
    thumbnail_path: p.type === "text" ? null : gymPhoto(600, 400),
    duration_seconds: p.type === "video" ? randInt(90, 720) : null,
    published_at: new Date(Date.now() - i * 2 * 86_400_000).toISOString(),
  }));
  const { error: postErr } = await admin.from("posts").insert(posts);
  if (postErr) throw new Error(`posts insert (${def.handle}): ${postErr.message}`);

  console.log(`  ${def.handle.padEnd(7)} ${def.tiers.length} tiers, ${posts.length} posts`);
  return { def, id, tierIdByLevel: new Map(tiers!.map((t) => [t.level, t.id])) };
}

// ---------------------------------------------------------------------------
// 3. Clients + subscriptions
// ---------------------------------------------------------------------------

type SeededClient = ClientDef & { id: string; coach: SeededCoach };

async function seedClients(coach: SeededCoach): Promise<SeededClient[]> {
  const out: SeededClient[] = [];

  for (const c of coach.def.clients) {
    const id = await createConfirmedUser(emailFor(c.name), c.name, "client");

    await admin.from("profiles").update({
      avatar_url: avatarUrl(c.name),
      timezone: coach.def.timezone,
    }).eq("id", id);

    const { error } = await admin.from("subscriptions").insert({
      client_id: id,
      coach_id: coach.id,
      tier_id: coach.tierIdByLevel.get(c.level)!,
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      created_at: daysAgo(c.joinedDaysAgo).toISOString(),
    });
    if (error) throw new Error(`subscription for ${c.name}: ${error.message}`);

    out.push({ ...c, id, coach });
  }

  return out;
}

async function seedCrossSubscriptions(clients: SeededClient[], coaches: SeededCoach[]) {
  console.log("Creating second subscriptions...");
  const clientByName = new Map(clients.map((c) => [c.name, c]));
  const coachByHandle = new Map(coaches.map((c) => [c.def.handle, c]));
  let n = 0;

  for (const x of CROSS_SUBSCRIPTIONS) {
    const client = clientByName.get(x.client);
    const coach = coachByHandle.get(x.coach);
    if (!client || !coach) continue;

    const { error } = await admin.from("subscriptions").insert({
      client_id: client.id,
      coach_id: coach.id,
      tier_id: coach.tierIdByLevel.get(x.level)!,
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      created_at: daysAgo(randInt(14, 60)).toISOString(),
    });
    if (error) throw new Error(`cross-subscription ${x.client} -> ${x.coach}: ${error.message}`);
    n++;
  }

  console.log(`  ${n} clients subscribed to a second coach`);
}

// ---------------------------------------------------------------------------
// 4. Programs — one assigned per client, plus unassigned templates so the
//    coach's library isn't just the programs already handed out.
//
//    Every client gets a program, including level 1: content subscribers
//    follow a shared starter block, level 2 follows the group block, and
//    level 3 gets an individually named one. That keeps /today and
//    /progress populated for every demo account while the tier ladder
//    still reads correctly — what level 3 buys is the coach's attention,
//    not the existence of a plan.
// ---------------------------------------------------------------------------

type SeededProgram = { clientId: string; dayIds: string[] };

async function insertProgram(
  coachId: string,
  exerciseIds: Map<string, string>,
  split: Split,
  opts: { name: string; description: string; clientId: string | null; minTierLevel: number; weeks: number },
) {
  const { data: program, error: progErr } = await admin
    .from("programs")
    .insert({
      coach_id: coachId,
      name: opts.name,
      description: opts.description,
      duration_weeks: opts.weeks,
      is_template: opts.clientId === null,
      client_id: opts.clientId,
      min_tier_level: opts.minTierLevel,
    })
    .select("id")
    .single();
  if (progErr) throw new Error(`program insert: ${progErr.message}`);

  // One insert for every day across every week, then one for every
  // exercise — two round trips per program instead of two per day.
  const dayRows: {
    program_id: string;
    week_number: number;
    day_number: number;
    name: string;
    notes: string | null;
  }[] = [];
  for (let week = 1; week <= opts.weeks; week++) {
    split.days.forEach((d, i) => {
      dayRows.push({
        program_id: program.id,
        week_number: week,
        day_number: i + 1,
        name: d.name,
        notes: week === opts.weeks ? "Deload — same movements, two sets fewer." : null,
      });
    });
  }

  const { data: days, error: dayErr } = await admin
    .from("program_days")
    .insert(dayRows)
    .select("id, week_number, day_number");
  if (dayErr) throw new Error(`program_days insert: ${dayErr.message}`);

  const exRows: {
    program_day_id: string;
    exercise_id: string;
    order_index: number;
    target_sets: number;
    target_reps: string;
    target_rpe: number;
    rest_seconds: number;
  }[] = [];
  for (const day of days!) {
    const template = split.days[day.day_number - 1];
    template.exercises.forEach((name, idx) => {
      const exerciseId = exerciseIds.get(name);
      if (!exerciseId) throw new Error(`unknown exercise in split: ${name}`);
      exRows.push({
        program_day_id: day.id,
        exercise_id: exerciseId,
        order_index: idx,
        target_sets: idx === 0 ? 5 : 3,
        target_reps: idx === 0 ? "5" : "8-12",
        target_rpe: idx === 0 ? 8 : 7,
        rest_seconds: idx === 0 ? 180 : 90,
      });
    });
  }
  const { error: peErr } = await admin.from("program_exercises").insert(exRows);
  if (peErr) throw new Error(`program_exercises insert: ${peErr.message}`);

  const ordered = [...days!].sort(
    (a, b) => a.week_number - b.week_number || a.day_number - b.day_number,
  );
  return ordered.map((d) => d.id);
}

async function seedPrograms(
  coach: SeededCoach,
  clients: SeededClient[],
  exerciseIds: Map<string, string>,
): Promise<SeededProgram[]> {
  const assigned: SeededProgram[] = [];

  for (const client of clients) {
    const split = SPLITS[coach.def.splits[client.level]];
    // Level 1 takes the split name unqualified — the level-1 split is already
    // called "Starter Strength", and "Starter Strength — Starter" reads like a
    // bug on /today.
    const name =
      client.level === 3
        ? `${split.name} — ${client.name.split(" ")[0]}`
        : client.level === 2
          ? `${split.name} — Group Block`
          : split.name;

    const dayIds = await insertProgram(coach.id, exerciseIds, split, {
      name,
      description:
        client.level === 3
          ? `Individual programming for ${client.name}.`
          : `Shared ${client.level === 2 ? "group" : "starter"} block.`,
      clientId: client.id,
      minTierLevel: client.level,
      weeks: 4,
    });

    assigned.push({ clientId: client.id, dayIds });
  }

  for (const key of coach.def.templates) {
    const split = SPLITS[key];
    await insertProgram(coach.id, exerciseIds, split, {
      name: `${split.name} — Template`,
      description: "Reusable block, not currently assigned.",
      clientId: null,
      minTierLevel: 1,
      weeks: 4,
    });
  }

  return assigned;
}

// ---------------------------------------------------------------------------
// 5. Workout logs
//
//    Weights progress session over session from a plausible starting load
//    rather than being drawn at random each set — random numbers read as
//    noise on the progress chart and defeat the point of the last-session
//    prefill in /today, which shows you what you did last time.
// ---------------------------------------------------------------------------

async function seedWorkoutLogs(
  clients: SeededClient[],
  programs: SeededProgram[],
  loadByExerciseId: Map<string, number | null>,
) {
  const byClient = new Map(programs.map((p) => [p.clientId, p]));
  let logCount = 0;
  let setCount = 0;

  for (const client of clients) {
    const program = byClient.get(client.id);
    if (!program) continue;

    const sessions = randInt(11, 16);
    const logRows = [];
    for (let i = 0; i < sessions; i++) {
      // Most recent session lands on lastWorkoutDaysAgo; earlier ones step
      // back roughly every other day.
      const offset = client.lastWorkoutDaysAgo + (sessions - 1 - i) * randInt(2, 3);
      const startedAt = atTimeOfDay(daysAgo(offset), 6, 20);
      logRows.push({
        client_id: client.id,
        program_day_id: program.dayIds[i % program.dayIds.length],
        started_at: startedAt.toISOString(),
        completed_at: new Date(startedAt.getTime() + randInt(38, 72) * 60_000).toISOString(),
        notes: Math.random() > 0.75 ? pick([
          "Felt good, everything moved well.",
          "Short on time, cut the last accessory.",
          "Heavy day. Grinding but nothing failed.",
          "Low energy, kept the loads and dropped a set.",
        ]) : null,
        created_at: startedAt.toISOString(),
      });
    }

    const { data: logs, error: logErr } = await admin
      .from("workout_logs")
      .insert(logRows)
      .select("id, program_day_id, started_at");
    if (logErr) throw new Error(`workout_logs insert (${client.name}): ${logErr.message}`);
    logCount += logs!.length;

    const dayIds = [...new Set(logRows.map((l) => l.program_day_id))];
    type DayExercise = {
      id: string;
      exercise_id: string;
      target_sets: number;
      program_day_id: string;
    };

    const { data: dayExercises, error: peErr } = await admin
      .from("program_exercises")
      .select("id, exercise_id, target_sets, program_day_id")
      .in("program_day_id", dayIds);
    if (peErr) throw new Error(`program_exercises fetch: ${peErr.message}`);

    const byDay = new Map<string, DayExercise[]>();
    for (const pe of (dayExercises ?? []) as DayExercise[]) {
      const list = byDay.get(pe.program_day_id) ?? [];
      list.push(pe);
      byDay.set(pe.program_day_id, list);
    }

    const ordered = [...logs!].sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
    );

    const setRows: {
      workout_log_id: string;
      program_exercise_id: string;
      exercise_id: string;
      set_number: number;
      weight_kg: number | null;
      reps: number;
      rpe: number;
      completed: boolean;
    }[] = [];
    ordered.forEach((log, sessionIdx) => {
      for (const pe of byDay.get(log.program_day_id) ?? []) {
        const base = loadByExerciseId.get(pe.exercise_id) ?? null;
        for (let s = 0; s < pe.target_sets; s++) {
          // +2.5kg roughly every other session, and lighter on later sets.
          const weight =
            base === null
              ? null
              : Math.round((base + Math.floor(sessionIdx / 2) * 2.5 - s * 2.5) * 2) / 2;
          setRows.push({
            workout_log_id: log.id,
            program_exercise_id: pe.id,
            exercise_id: pe.exercise_id,
            set_number: s + 1,
            weight_kg: weight !== null && weight > 0 ? weight : null,
            reps: base === null ? randInt(6, 15) : randInt(5, 10),
            rpe: Math.min(10, 6 + s + (Math.random() > 0.6 ? 1 : 0)),
            completed: true,
          });
        }
      }
    });

    if (setRows.length) {
      const { error: setErr } = await admin.from("set_logs").insert(setRows);
      if (setErr) throw new Error(`set_logs insert (${client.name}): ${setErr.message}`);
      setCount += setRows.length;
    }
  }

  console.log(`  ${logCount} workout logs, ${setCount} set logs`);
}

// ---------------------------------------------------------------------------
// 6. Check-ins — 12 weeks per client, weight trending down with noise,
//    flagged clients dropping off toward the end.
// ---------------------------------------------------------------------------

const CHECKIN_NOTES = [
  "Felt strong this week, energy was good.",
  "Slept badly Tuesday and Wednesday, showed up in the gym.",
  "Traveled for work, missed one session.",
  "Best week in a while — hit a few PRs.",
  "Stress has been high, appetite's been off.",
  "Back to normal after last week. Sessions felt easy.",
  "Knee was grumbling on Monday, fine by Thursday.",
  null,
] as const;

const COACH_REPLIES = [
  "Great work — keep this pace.",
  "Let's back off intensity slightly next week if sleep doesn't improve.",
  "No worries on the missed session, life happens. Back at it this week.",
  "Numbers are moving in the right direction. Hold everything steady.",
  "Noted on the knee — swap to the machine variation if it returns.",
  // No null entry here, unlike CHECKIN_NOTES. The `replied` flag already
  // decides whether a check-in was answered; a null in the pool as well made
  // a sixth of "answered" weeks silently unanswered, which pushed the
  // dashboard's awaiting-reply tile from 8 to 22.
] as const;

async function seedCheckIns(clients: SeededClient[]) {
  let total = 0;

  for (const client of clients) {
    const startWeight = randInt(58, 96);
    const rows = [];

    for (let week = 11; week >= 0; week--) {
      const elapsed = 11 - week;
      const trend = elapsed * 0.25;
      const noise = (Math.random() - 0.5) * 1.2;
      const weight = Math.round((startWeight - trend + noise) * 10) / 10;

      const adherence = client.atRisk
        ? Math.max(25, 95 - elapsed * 6 + randInt(-5, 5))
        : randInt(75, 98);

      // Historical check-ins need a historical created_at too — otherwise
      // every row defaults to insert time, and whichever client is seeded
      // last owns every slot in a "recent check-ins by created_at" panel
      // regardless of which week the data represents.
      const createdAt = daysAgo(week * 7).toISOString();
      // Everything but the current week has been answered. Leaving a
      // quarter of twelve weeks unanswered per client stacked up to 54
      // awaiting reply on the dashboard, which reads as a coach who ignores
      // people rather than one with this week's inbox to clear.
      const replied = week >= 1;

      rows.push({
        client_id: client.id,
        coach_id: client.coach.id,
        week_of: mondayOf(daysAgo(week * 7)),
        created_at: createdAt,
        weight_kg: weight,
        sleep_hours: Math.round(randInt(55, 80) / 10 * 10) / 10,
        adherence_pct: adherence,
        energy_score: client.atRisk ? randInt(3, 6) : randInt(5, 9),
        notes: pick(CHECKIN_NOTES),
        // Progress photos on roughly every third week, which is how often
        // people actually take them.
        photo_paths: elapsed % 3 === 0
          ? [progressPhoto(`${client.name}-${week}-front`), progressPhoto(`${client.name}-${week}-side`)]
          : [],
        coach_reply: replied ? pick(COACH_REPLIES) : null,
        replied_at: replied ? daysAgo(week * 7 - 1).toISOString() : null,
      });
    }

    const { error } = await admin.from("check_ins").insert(rows);
    if (error) throw new Error(`check_ins insert (${client.name}): ${error.message}`);
    total += rows.length;
  }

  console.log(`  ${total} check-ins across ${clients.length} clients`);
}

// ---------------------------------------------------------------------------
// 7. Conversations — one direct thread per level-3 client, one group
//    thread per coach for level 2 and above.
// ---------------------------------------------------------------------------

const DIRECT_LINES = [
  "How'd the session go today?",
  "Solid — hit all my numbers, felt heavy on the last set though.",
  "That's normal for week 3, we're pushing volume. RPE should ease off next week.",
  "Good to know. Sleep's been rough, might've affected it.",
  "Noted, let's keep an eye on that in your check-in. Anything hurting?",
  "No, just tired. Otherwise good.",
  "Great. Keep logging your sets, I'll adjust Thursday's session if needed.",
  "Will do, thanks.",
  "Also — video from today's top set is uploaded whenever you get a chance.",
  "Watched it. Bar path is much straighter than a month ago.",
];

async function seedConversations(coach: SeededCoach, clients: SeededClient[]) {
  const level3 = clients.filter((c) => c.level === 3);
  let totalMessages = 0;

  for (const client of level3) {
    const { data: convo, error: convErr } = await admin
      .from("conversations")
      .insert({ coach_id: coach.id, type: "direct", client_id: client.id })
      .select("id")
      .single();
    if (convErr) throw new Error(`conversation insert: ${convErr.message}`);

    const count = randInt(30, 60);
    const messages = [];
    for (let i = 0; i < count; i++) {
      const createdAt = atTimeOfDay(daysAgo(Math.floor((count - i) / 3)), 7, 21);
      messages.push({
        conversation_id: convo.id,
        sender_id: i % 2 === 0 ? client.id : coach.id,
        body: DIRECT_LINES[i % DIRECT_LINES.length],
        created_at: createdAt.toISOString(),
      });
    }
    const { error: msgErr } = await admin.from("messages").insert(messages);
    if (msgErr) throw new Error(`messages insert: ${msgErr.message}`);

    await admin
      .from("conversations")
      .update({ last_message_at: messages[messages.length - 1].created_at })
      .eq("id", convo.id);

    totalMessages += messages.length;
  }

  const { data: group, error: groupErr } = await admin
    .from("conversations")
    .insert({ coach_id: coach.id, type: "group", min_tier_level: 2, title: "Group Chat" })
    .select("id")
    .single();
  if (groupErr) throw new Error(`group conversation insert: ${groupErr.message}`);

  const members = clients.filter((c) => c.level >= 2).map((c) => c.id);
  const topics = coach.def.groupTopics;
  const groupMessages = [];
  const groupCount = randInt(28, 44);
  for (let i = 0; i < groupCount; i++) {
    const createdAt = atTimeOfDay(daysAgo(Math.floor((groupCount - i) / 2)), 7, 22);
    groupMessages.push({
      conversation_id: group.id,
      sender_id: i % 4 === 0 || members.length === 0 ? coach.id : pick(members),
      body: topics[i % topics.length],
      created_at: createdAt.toISOString(),
    });
  }
  const { error: gMsgErr } = await admin.from("messages").insert(groupMessages);
  if (gMsgErr) throw new Error(`group messages insert: ${gMsgErr.message}`);

  await admin
    .from("conversations")
    .update({ last_message_at: groupMessages[groupMessages.length - 1].created_at })
    .eq("id", group.id);

  totalMessages += groupMessages.length;
  return { conversations: level3.length + 1, messages: totalMessages };
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  const startedAt = Date.now();

  await cleanup();
  const exerciseIds = await seedExercises();

  // exercise id -> plausible working load, so the generated set logs
  // progress from a sane starting weight instead of random numbers.
  const loadByExerciseId = new Map<string, number | null>(
    EXERCISES.flatMap((e) => {
      const id = exerciseIds.get(e.name);
      return id ? [[id, e.load] as [string, number | null]] : [];
    }),
  );

  console.log("Creating coaches...");
  const coaches: SeededCoach[] = [];
  for (const def of COACHES) coaches.push(await seedCoach(def));

  const allClients: SeededClient[] = [];
  let conversationCount = 0;
  let messageCount = 0;

  for (const coach of coaches) {
    console.log(`Populating ${coach.def.handle}...`);
    const clients = await seedClients(coach);
    const programs = await seedPrograms(coach, clients, exerciseIds);
    await seedWorkoutLogs(clients, programs, loadByExerciseId);
    await seedCheckIns(clients);
    const convo = await seedConversations(coach, clients);
    conversationCount += convo.conversations;
    messageCount += convo.messages;
    allClients.push(...clients);
  }

  await seedCrossSubscriptions(allClients, coaches);

  const seconds = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\nSeed complete in ${seconds}s.`);
  console.log(`  ${coaches.length} coaches, ${allClients.length} clients`);
  console.log(`  ${conversationCount} conversations, ${messageCount} messages`);
  console.log(`\nEvery account uses the password: ${DEMO_PASSWORD}`);
  console.log("\nCoaches:");
  for (const c of coaches) console.log(`  ${emailFor(c.def.name).padEnd(34)} /c/${c.def.handle}`);
  console.log("\nClients worth logging in as:");
  console.log(`  ${emailFor("Sofia Martins").padEnd(34)} level 1 — mostly locked feed, two coaches`);
  console.log(`  ${emailFor("Priya Nair").padEnd(34)} level 2 — group chat, group block`);
  console.log(`  ${emailFor("Elena Volkov").padEnd(34)} level 3 — everything unlocked, direct chat`);
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
