"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateCoachProfile } from "@/lib/actions/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MediaUploader } from "@/components/shared/media-uploader";

export function ProfileSettingsForm({
  userId,
  displayName,
  headline,
  bio,
  avatarUrl,
  coverImageUrl,
  specialties,
}: {
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  specialties: string[];
}) {
  const [state, formAction, isPending] = useActionState(updateCoachProfile, null);
  const [avatar, setAvatar] = useState(avatarUrl ?? "");
  const [cover, setCover] = useState(coverImageUrl ?? "");

  // Mirrored into state purely so the preview panel updates as you type.
  const [name, setName] = useState(displayName);
  const [tagline, setTagline] = useState(headline ?? "");
  const [tags, setTags] = useState(specialties.join(", "));

  const tagList = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <input type="hidden" name="avatarUrl" value={avatar} />
      <input type="hidden" name="coverImageUrl" value={cover} />

      {/* ------------------------------------------------------------ fields */}
      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Images</h2>
          <p className="mt-1 text-xs text-fg-muted">
            The cover sits behind your name on your storefront. Wide crops work
            best — around 1600×500.
          </p>
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <Label>Avatar</Label>
              <MediaUploader
                bucket="avatars"
                userId={userId}
                previewUrl={avatar || undefined}
                onUploaded={(_, url) => setAvatar(url)}
                label="Change"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cover image</Label>
              <MediaUploader
                bucket="avatars"
                userId={userId}
                previewUrl={cover || undefined}
                onUploaded={(_, url) => setCover(url)}
                label="Change"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Public details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              name="headline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={140}
              placeholder="What you help people do, in one line"
            />
            <p className="text-xs text-fg-muted">{tagline.length}/140</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specialties">Specialties</Label>
            <Input
              id="specialties"
              name="specialties"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Strength Training, Powerlifting, Fat Loss"
            />
            <p className="text-xs text-fg-muted">
              Comma separated, up to six. These are the tags people filter by on
              Discover.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={bio ?? ""}
              rows={6}
              maxLength={2000}
              placeholder="Who you coach, how you work, and what makes your approach yours."
            />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          {state?.ok && (
            <p className="animate-scale-in flex items-center gap-1.5 text-sm text-success">
              <Check className="size-4" />
              Saved
            </p>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- preview */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
          Storefront preview
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative h-28 bg-accent">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          </div>
          <div className="-mt-9 px-5 pb-5">
            <Avatar className="size-16 shadow-lg ring-4 ring-card">
              {avatar && <AvatarImage src={avatar} alt="" />}
              <AvatarFallback>{name[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <p className="mt-3 font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
              {name || "Your name"}
            </p>
            {tagline && (
              <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
                {tagline}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tagList.length > 0 ? (
                tagList.map((t) => (
                  <Badge key={t} variant="secondary" className="rounded-full text-[11px]">
                    {t}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-fg-muted">No specialties yet</span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          Updates as you type. Save to publish the changes.
        </p>
      </aside>
    </form>
  );
}
