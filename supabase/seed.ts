/**
 * Seed script — see docs/02-BACKEND.md §7 for the full spec and why this
 * exists: an app screenshotted empty reads as a tutorial, not a product.
 *
 * Run with: npx tsx supabase/seed.ts
 *
 * Uses the service role key (bypasses RLS) — the second and last
 * legitimate use of it, alongside the Stripe webhook.
 *
 * Media note: avatars and post thumbnails use external placeholder URLs
 * (ui-avatars.com, picsum.photos) directly, not real Supabase Storage
 * uploads. That's a deliberate seed-only shortcut, not the real upload
 * path — getSignedMediaUrl() (built in Phase 4/5) passes through any
 * media_path that's already a full URL instead of trying to sign it, so
 * this data renders correctly without a Storage round-trip.
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: T[]): T {
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

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function avatarUrl(seed: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=1F2A36&color=F0F4F8&size=256`;
}

function photoUrl(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

async function createConfirmedUser(email: string, fullName: string, role: "coach" | "client") {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "OnlyChamps2026!",
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user.id;
}

// ---------------------------------------------------------------------------
// 0. Cleanup — makes this script idempotent. Deleting the seeded auth.users
//    cascades through profiles/coaches/tiers/subscriptions/posts/programs/
//    check_ins/conversations/messages via ON DELETE CASCADE. The one thing
//    that doesn't cascade is the global exercise library (coach_id is null
//    by design, so it isn't owned by any user) — cleared separately by name
//    so re-running doesn't silently duplicate all 30 exercises.
// ---------------------------------------------------------------------------

const DEMO_EMAIL_SUFFIX = "@onlychamps.demo";

async function cleanup() {
  console.log("Clearing previous seed data...");

  const { data: userList, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error(`listUsers: ${listErr.message}`);

  const demoUsers = userList.users.filter((u) => u.email?.endsWith(DEMO_EMAIL_SUFFIX));
  for (const u of demoUsers) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) throw new Error(`deleteUser(${u.email}): ${error.message}`);
  }

  const exerciseNames = EXERCISES.map((e) => e.name);
  const { error: exErr } = await admin
    .from("exercises")
    .delete()
    .is("coach_id", null)
    .in("name", exerciseNames);
  if (exErr) throw new Error(`exercises cleanup: ${exErr.message}`);

  console.log(`  removed ${demoUsers.length} previously-seeded users`);
}

// ---------------------------------------------------------------------------
// 1. Coach
// ---------------------------------------------------------------------------

async function seedCoach() {
  console.log("Creating coach...");
  const coachId = await createConfirmedUser("marcus@onlychamps.demo", "Marcus Chen", "coach");

  await admin.from("profiles").update({
    avatar_url: avatarUrl("Marcus Chen"),
    bio: "12 years coaching strength and physique. Ex-competitive powerlifter, now I just help people not skip leg day.",
    timezone: "America/New_York",
  }).eq("id", coachId);

  const { error: coachErr } = await admin.from("coaches").insert({
    id: coachId,
    handle: "marcus",
    display_name: "Marcus Chen",
    headline: "Strength coaching for people who lift late and eat early",
    bio: "I coach lifters of every level — from your first barbell squat to your first competition total. Programming is individualized, but the principles never change: consistency, progressive overload, and enough protein to make your dietitian proud.",
    cover_image_url: photoUrl("marcus-cover", 1600, 500),
    specialties: ["Strength Training", "Powerlifting", "Fat Loss"],
    stripe_account_id: "acct_seed_demo",
    stripe_onboarding_complete: true,
    is_published: true,
  });
  if (coachErr) throw new Error(`coaches insert: ${coachErr.message}`);

  const tierRows = [
    { coach_id: coachId, level: 1, name: "Content", description: "Weekly training content and programming breakdowns.", price_cents: 1900, features: ["Weekly video library", "Programming breakdowns", "Community feed"] },
    { coach_id: coachId, level: 2, name: "Group", description: "Everything in Content, plus group coaching.", price_cents: 5900, features: ["Everything in Content", "Group chat access", "Monthly group call", "Check-in template"] },
    { coach_id: coachId, level: 3, name: "1:1 Coaching", description: "Fully custom programming and direct access to me.", price_cents: 24900, features: ["Everything in Group", "Custom 1:1 programming", "Direct chat with Marcus", "Weekly form-check review"] },
  ];
  const { data: tiers, error: tierErr } = await admin.from("tiers").insert(tierRows).select();
  if (tierErr) throw new Error(`tiers insert: ${tierErr.message}`);

  console.log(`  coach: marcus (${coachId})`);
  return { coachId, tiers: tiers! };
}

// ---------------------------------------------------------------------------
// 2. Clients + subscriptions
// ---------------------------------------------------------------------------

const CLIENTS = [
  { name: "Sofia Martins", level: 1, atRisk: false },
  { name: "Daniel Osei", level: 1, atRisk: true },
  { name: "Priya Nair", level: 2, atRisk: false },
  { name: "Jordan Blake", level: 2, atRisk: true },
  { name: "Amara Okafor", level: 2, atRisk: false },
  { name: "Liam Fischer", level: 3, atRisk: false },
  { name: "Elena Volkov", level: 3, atRisk: false },
  { name: "Tyler Brooks", level: 3, atRisk: false },
] as const;

async function seedClients(coachId: string, tiers: { id: string; level: number }[]) {
  console.log("Creating clients...");
  const tierByLevel = new Map(tiers.map((t) => [t.level, t.id]));
  const clients: { id: string; name: string; level: number; atRisk: boolean }[] = [];

  for (const c of CLIENTS) {
    const email = `${c.name.toLowerCase().replace(/\s+/g, ".")}@onlychamps.demo`;
    const id = await createConfirmedUser(email, c.name, "client");

    await admin.from("profiles").update({
      avatar_url: avatarUrl(c.name),
      timezone: "America/New_York",
    }).eq("id", id);

    const { error } = await admin.from("subscriptions").insert({
      client_id: id,
      coach_id: coachId,
      tier_id: tierByLevel.get(c.level)!,
      status: "active",
      stripe_subscription_id: `sub_seed_${id.slice(0, 8)}`,
      stripe_customer_id: `cus_seed_${id.slice(0, 8)}`,
      current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
    });
    if (error) throw new Error(`subscription for ${c.name}: ${error.message}`);

    clients.push({ id, name: c.name, level: c.level, atRisk: c.atRisk });
  }

  console.log(`  ${clients.length} clients subscribed`);
  return clients;
}

// ---------------------------------------------------------------------------
// 3. Posts
// ---------------------------------------------------------------------------

const POSTS: { title: string; level: 1 | 2 | 3; type: "text" | "image" | "video"; body: string }[] = [
  { title: "Why your squat stalled (and it's not what you think)", level: 1, type: "text", body: "Most stalls aren't strength problems, they're bar-path problems. Film your next three attempts from the side before you touch your programming." },
  { title: "This week's leg day walkthrough", level: 1, type: "video", body: "Full session, unedited. Watch the bar speed on set 3 of the front squats." },
  { title: "Protein timing myths, debunked", level: 1, type: "text", body: "The 30-minute anabolic window is mostly marketing. Total daily intake matters far more than timing — here's what actually moves the needle." },
  { title: "Deload week: what it should actually feel like", level: 1, type: "image", body: "A deload isn't a rest week. It's still training, just at a volume you can recover from." },
  { title: "Group Q&A recap — hip pain during squats", level: 2, type: "text", body: "Summary of last night's call for anyone who missed it. Short answer: it's almost always ankle mobility, not hip mobility." },
  { title: "This month's group programming block", level: 2, type: "image", body: "Four-week upper/lower split, posted early for anyone who wants a head start on planning their week." },
  { title: "Group call: form checks live", level: 2, type: "video", body: "Recording from Tuesday's group call. Three form checks, all deadlift-related, all the same fix." },
  { title: "How I program conjugate for group clients", level: 2, type: "text", body: "A breakdown of how max-effort and dynamic-effort days rotate across the four-week group block." },
  { title: "Your program update — week 5 progression", level: 3, type: "text", body: "Notes on this week's adjustments based on your check-in data. Volume's up slightly on posterior chain." },
  { title: "1:1 form check response", level: 3, type: "video", body: "Reviewed your bench video — bar path is solid, but let's tighten the leg drive timing." },
  { title: "Competition prep: 8 weeks out", level: 3, type: "text", body: "Here's how the next eight weeks break down. Peak week isn't until the very end, be patient with the taper." },
  { title: "Custom nutrition adjustment", level: 3, type: "image", body: "Updated macro targets based on this week's weigh-ins and training load." },
];

async function seedPosts(coachId: string) {
  console.log("Creating posts...");
  const now = Date.now();
  const rows = POSTS.map((p, i) => ({
    coach_id: coachId,
    min_tier_level: p.level,
    media_type: p.type,
    title: p.title,
    body: p.body,
    media_path: p.type === "text" ? null : photoUrl(`post-${i}`),
    thumbnail_path: p.type === "text" ? null : photoUrl(`post-${i}`, 400, 300),
    duration_seconds: p.type === "video" ? randInt(90, 720) : null,
    published_at: new Date(now - i * 2 * 86400_000).toISOString(),
  }));

  const { error } = await admin.from("posts").insert(rows);
  if (error) throw new Error(`posts insert: ${error.message}`);
  console.log(`  ${rows.length} posts published`);
}

// ---------------------------------------------------------------------------
// 4. Exercise library
// ---------------------------------------------------------------------------

const EXERCISES: { name: string; muscle_group: string; equipment: string }[] = [
  { name: "Barbell Back Squat", muscle_group: "Legs", equipment: "Barbell" },
  { name: "Conventional Deadlift", muscle_group: "Back", equipment: "Barbell" },
  { name: "Barbell Bench Press", muscle_group: "Chest", equipment: "Barbell" },
  { name: "Overhead Press", muscle_group: "Shoulders", equipment: "Barbell" },
  { name: "Barbell Row", muscle_group: "Back", equipment: "Barbell" },
  { name: "Pull-up", muscle_group: "Back", equipment: "Bodyweight" },
  { name: "Chin-up", muscle_group: "Back", equipment: "Bodyweight" },
  { name: "Dip", muscle_group: "Chest", equipment: "Bodyweight" },
  { name: "Incline Dumbbell Press", muscle_group: "Chest", equipment: "Dumbbell" },
  { name: "Romanian Deadlift", muscle_group: "Hamstrings", equipment: "Barbell" },
  { name: "Front Squat", muscle_group: "Legs", equipment: "Barbell" },
  { name: "Leg Press", muscle_group: "Legs", equipment: "Machine" },
  { name: "Leg Curl", muscle_group: "Hamstrings", equipment: "Machine" },
  { name: "Leg Extension", muscle_group: "Quads", equipment: "Machine" },
  { name: "Lat Pulldown", muscle_group: "Back", equipment: "Machine" },
  { name: "Seated Cable Row", muscle_group: "Back", equipment: "Cable" },
  { name: "Dumbbell Shoulder Press", muscle_group: "Shoulders", equipment: "Dumbbell" },
  { name: "Lateral Raise", muscle_group: "Shoulders", equipment: "Dumbbell" },
  { name: "Face Pull", muscle_group: "Shoulders", equipment: "Cable" },
  { name: "Barbell Curl", muscle_group: "Biceps", equipment: "Barbell" },
  { name: "Hammer Curl", muscle_group: "Biceps", equipment: "Dumbbell" },
  { name: "Tricep Pushdown", muscle_group: "Triceps", equipment: "Cable" },
  { name: "Skull Crusher", muscle_group: "Triceps", equipment: "Barbell" },
  { name: "Hip Thrust", muscle_group: "Glutes", equipment: "Barbell" },
  { name: "Walking Lunge", muscle_group: "Legs", equipment: "Dumbbell" },
  { name: "Bulgarian Split Squat", muscle_group: "Legs", equipment: "Dumbbell" },
  { name: "Standing Calf Raise", muscle_group: "Calves", equipment: "Machine" },
  { name: "Plank", muscle_group: "Core", equipment: "Bodyweight" },
  { name: "Cable Crunch", muscle_group: "Core", equipment: "Cable" },
  { name: "Farmer's Carry", muscle_group: "Full Body", equipment: "Dumbbell" },
];

async function seedExercises() {
  console.log("Creating exercise library...");
  const { data, error } = await admin.from("exercises").insert(
    EXERCISES.map((e) => ({ ...e, coach_id: null }))
  ).select();
  if (error) throw new Error(`exercises insert: ${error.message}`);
  console.log(`  ${data!.length} exercises`);
  return data!;
}

// ---------------------------------------------------------------------------
// 5. Programs (2 assigned, out of 3 level-3 clients — the third
//    deliberately has none, to exercise the empty state later)
// ---------------------------------------------------------------------------

async function seedPrograms(
  coachId: string,
  clients: { id: string; name: string; level: number }[],
  exercises: { id: string; name: string }[]
) {
  console.log("Creating programs...");
  const byName = new Map(exercises.map((e) => [e.name, e.id]));
  const level3 = clients.filter((c) => c.level === 3);
  const [clientA, clientB] = level3;

  const programDefs = [
    {
      name: "Push Pull Legs — 4 Week",
      client: clientA,
      days: [
        { week: 1, day: 1, name: "Push", exercises: ["Barbell Bench Press", "Overhead Press", "Incline Dumbbell Press", "Tricep Pushdown", "Lateral Raise"] },
        { week: 1, day: 2, name: "Pull", exercises: ["Conventional Deadlift", "Barbell Row", "Pull-up", "Face Pull", "Barbell Curl"] },
        { week: 1, day: 3, name: "Legs", exercises: ["Barbell Back Squat", "Romanian Deadlift", "Leg Press", "Leg Curl", "Standing Calf Raise"] },
      ],
    },
    {
      name: "Powerbuilding — 4 Week",
      client: clientB,
      days: [
        { week: 1, day: 1, name: "Squat Focus", exercises: ["Barbell Back Squat", "Front Squat", "Leg Extension", "Walking Lunge", "Plank"] },
        { week: 1, day: 2, name: "Bench Focus", exercises: ["Barbell Bench Press", "Dip", "Incline Dumbbell Press", "Skull Crusher", "Cable Crunch"] },
        { week: 1, day: 3, name: "Deadlift Focus", exercises: ["Conventional Deadlift", "Hip Thrust", "Seated Cable Row", "Hammer Curl", "Farmer's Carry"] },
      ],
    },
  ];

  const assignedPrograms: { programId: string; clientId: string; dayIds: { id: string; week: number; day: number }[] }[] = [];

  for (const def of programDefs) {
    if (!def.client) continue;

    const { data: program, error: progErr } = await admin
      .from("programs")
      .insert({
        coach_id: coachId,
        name: def.name,
        description: `Custom program for ${def.client.name}.`,
        duration_weeks: 4,
        is_template: false,
        client_id: def.client.id,
        min_tier_level: 3,
      })
      .select()
      .single();
    if (progErr) throw new Error(`program insert: ${progErr.message}`);

    const dayIds: { id: string; week: number; day: number }[] = [];

    for (const day of def.days) {
      const { data: dayRow, error: dayErr } = await admin
        .from("program_days")
        .insert({ program_id: program.id, week_number: day.week, day_number: day.day, name: day.name })
        .select()
        .single();
      if (dayErr) throw new Error(`program_days insert: ${dayErr.message}`);
      dayIds.push({ id: dayRow.id, week: day.week, day: day.day });

      const exRows = day.exercises.map((name, idx) => ({
        program_day_id: dayRow.id,
        exercise_id: byName.get(name)!,
        order_index: idx,
        target_sets: idx === 0 ? 5 : 3,
        target_reps: idx === 0 ? "5" : "8-12",
        target_rpe: idx === 0 ? 8 : 7,
        rest_seconds: idx === 0 ? 180 : 90,
      }));
      const { error: peErr } = await admin.from("program_exercises").insert(exRows);
      if (peErr) throw new Error(`program_exercises insert: ${peErr.message}`);
    }

    assignedPrograms.push({ programId: program.id, clientId: def.client.id, dayIds });
  }

  console.log(`  ${assignedPrograms.length} programs assigned (of ${level3.length} level-3 clients)`);
  return assignedPrograms;
}

// ---------------------------------------------------------------------------
// 6. Workout logs for the two clients with assigned programs
// ---------------------------------------------------------------------------

async function seedWorkoutLogs(
  assignedPrograms: { clientId: string; dayIds: { id: string; week: number; day: number }[] }[],
  exercises: { id: string }[]
) {
  console.log("Creating workout logs...");
  let total = 0;

  for (const ap of assignedPrograms) {
    // Six completed sessions over the last three weeks, cycling through the
    // three program days.
    for (let i = 0; i < 6; i++) {
      const day = ap.dayIds[i % ap.dayIds.length];
      const startedAt = daysAgo((5 - i) * 3 + 1);

      const { data: log, error: logErr } = await admin
        .from("workout_logs")
        .insert({
          client_id: ap.clientId,
          program_day_id: day.id,
          started_at: startedAt.toISOString(),
          completed_at: new Date(startedAt.getTime() + 55 * 60_000).toISOString(),
        })
        .select()
        .single();
      if (logErr) throw new Error(`workout_logs insert: ${logErr.message}`);

      const { data: dayExercises } = await admin
        .from("program_exercises")
        .select("id, exercise_id, target_sets")
        .eq("program_day_id", day.id);

      const setRows = (dayExercises ?? []).flatMap((pe) =>
        Array.from({ length: pe.target_sets }, (_, setIdx) => ({
          workout_log_id: log.id,
          program_exercise_id: pe.id,
          exercise_id: pe.exercise_id,
          set_number: setIdx + 1,
          weight_kg: randInt(40, 140),
          reps: randInt(5, 12),
          rpe: randInt(6, 9),
          completed: true,
        }))
      );
      if (setRows.length) {
        const { error: setErr } = await admin.from("set_logs").insert(setRows);
        if (setErr) throw new Error(`set_logs insert: ${setErr.message}`);
      }
      total++;
    }
  }

  console.log(`  ${total} workout logs`);
  void exercises;
}

// ---------------------------------------------------------------------------
// 7. Check-ins — 12 weeks per client, weight trending down with noise, two
//    clients with declining adherence for the at-risk panel
// ---------------------------------------------------------------------------

async function seedCheckIns(coachId: string, clients: { id: string; name: string; atRisk: boolean }[]) {
  console.log("Creating check-ins...");
  let total = 0;

  for (const client of clients) {
    const startWeight = randInt(70, 95);
    for (let week = 11; week >= 0; week--) {
      const weekOf = mondayOf(daysAgo(week * 7));
      const trend = (11 - week) * 0.25; // gentle downward trend over 12 weeks
      const noise = (Math.random() - 0.5) * 1.2;
      const weight = Math.round((startWeight - trend + noise) * 10) / 10;

      // Declining adherence for the two flagged clients — starts strong,
      // drops off in the last few weeks so the at-risk panel has something
      // real to show.
      const adherence = client.atRisk
        ? Math.max(30, 95 - (11 - week) * 6 + randInt(-5, 5))
        : randInt(75, 98);

      const { error } = await admin.from("check_ins").insert({
        client_id: client.id,
        coach_id: coachId,
        week_of: weekOf,
        weight_kg: weight,
        sleep_hours: Math.round((randInt(55, 80) / 10) * 10) / 10,
        adherence_pct: adherence,
        energy_score: randInt(4, 9),
        notes: pick([
          "Felt strong this week, energy was good.",
          "Slept badly Tuesday and Wednesday, showed up in the gym.",
          "Traveled for work, missed one session.",
          "Best week in a while — hit a few PRs.",
          "Stress has been high, appetite's been off.",
          null,
        ]),
        coach_reply: week > 2 ? pick([
          "Great work — keep this pace.",
          "Let's back off intensity slightly next week if sleep doesn't improve.",
          "No worries on the missed session, life happens. Back at it this week.",
          null,
        ]) : null,
        replied_at: week > 2 && Math.random() > 0.4 ? daysAgo(week * 7 - 1).toISOString() : null,
      });
      if (error) throw new Error(`check_ins insert (${client.name}, week ${week}): ${error.message}`);
      total++;
    }
  }

  console.log(`  ${total} check-ins across ${clients.length} clients`);
}

// ---------------------------------------------------------------------------
// 8. Conversations — 3 direct (level-3 clients), 1 group (level-2+)
// ---------------------------------------------------------------------------

async function seedConversations(
  coachId: string,
  clients: { id: string; name: string; level: number }[]
) {
  console.log("Creating conversations...");
  const level3 = clients.filter((c) => c.level === 3);
  let totalMessages = 0;

  for (const client of level3) {
    const { data: convo, error: convErr } = await admin
      .from("conversations")
      .insert({ coach_id: coachId, type: "direct", client_id: client.id })
      .select()
      .single();
    if (convErr) throw new Error(`conversation insert: ${convErr.message}`);

    const count = randInt(30, 60);
    const messages = buildThread(coachId, client.id, convo.id, count, [
      "How'd the session go today?",
      "Solid — hit all my numbers, felt heavy on the last set though.",
      "That's normal for week 3, we're pushing volume. RPE should ease off next week.",
      "Good to know. Sleep's been rough, might've affected it.",
      "Noted, let's keep an eye on that in your check-in. Anything hurting?",
      "No, just tired. Otherwise good.",
      "Great. Keep logging your sets, I'll adjust Thursday's session if needed.",
      "Will do, thanks.",
    ]);
    const { error: msgErr } = await admin.from("messages").insert(messages);
    if (msgErr) throw new Error(`messages insert: ${msgErr.message}`);
    totalMessages += messages.length;
  }

  // One group thread, level 2+
  const { data: group, error: groupErr } = await admin
    .from("conversations")
    .insert({ coach_id: coachId, type: "group", min_tier_level: 2, title: "Group Chat" })
    .select()
    .single();
  if (groupErr) throw new Error(`group conversation insert: ${groupErr.message}`);

  const groupMembers = clients.filter((c) => c.level >= 2).map((c) => c.id);
  const groupMessages = buildGroupThread(coachId, groupMembers, group.id, 40);
  const { error: gMsgErr } = await admin.from("messages").insert(groupMessages);
  if (gMsgErr) throw new Error(`group messages insert: ${gMsgErr.message}`);
  totalMessages += groupMessages.length;

  console.log(`  ${level3.length + 1} conversations, ${totalMessages} messages`);
}

function buildThread(coachId: string, clientId: string, conversationId: string, count: number, lines: string[]) {
  const messages: { conversation_id: string; sender_id: string; body: string; created_at: string }[] = [];
  for (let i = 0; i < count; i++) {
    const sender = i % 2 === 0 ? clientId : coachId;
    const body = lines[i % lines.length];
    const createdAt = daysAgo(Math.floor((count - i) / 3)).toISOString();
    messages.push({ conversation_id: conversationId, sender_id: sender, body, created_at: createdAt });
  }
  return messages;
}

function buildGroupThread(coachId: string, memberIds: string[], conversationId: string, count: number) {
  const lines = [
    "Reminder: group call is Thursday 7pm EST.",
    "Looking forward to it!",
    "Quick question — is the leg day superset order strict or flexible?",
    "Flexible, just get all the work in.",
    "Anyone else's DOMS brutal this week?",
    "Same here, squats hit different this block.",
    "That's the volume bump working as intended.",
    "Posted this week's programming update in the feed, check it out.",
  ];
  const messages: { conversation_id: string; sender_id: string; body: string; created_at: string }[] = [];
  for (let i = 0; i < count; i++) {
    const sender = i % 4 === 0 ? coachId : pick(memberIds);
    const body = lines[i % lines.length];
    const createdAt = daysAgo(Math.floor((count - i) / 2)).toISOString();
    messages.push({ conversation_id: conversationId, sender_id: sender, body, created_at: createdAt });
  }
  return messages;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  await cleanup();
  const { coachId, tiers } = await seedCoach();
  const clients = await seedClients(coachId, tiers);
  await seedPosts(coachId);
  const exercises = await seedExercises();
  const assignedPrograms = await seedPrograms(coachId, clients, exercises);
  await seedWorkoutLogs(assignedPrograms, exercises);
  await seedCheckIns(coachId, clients);
  await seedConversations(coachId, clients);

  console.log("\nSeed complete.");
  console.log("Coach login:  marcus@onlychamps.demo / OnlyChamps2026!");
  console.log("Client login: sofia.martins@onlychamps.demo / OnlyChamps2026! (or any client above)");
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
