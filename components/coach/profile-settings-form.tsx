"use client";

import { useActionState, useState } from "react";
import { updateCoachProfile } from "@/lib/actions/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/shared/media-uploader";

export function ProfileSettingsForm({
  userId,
  displayName,
  headline,
  bio,
  avatarUrl,
  coverImageUrl,
}: {
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateCoachProfile, null);
  const [avatar, setAvatar] = useState(avatarUrl ?? "");
  const [cover, setCover] = useState(coverImageUrl ?? "");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="avatarUrl" value={avatar} />
      <input type="hidden" name="coverImageUrl" value={cover} />

      <div className="flex gap-6">
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

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={displayName} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" name="headline" defaultValue={headline ?? ""} maxLength={140} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={bio ?? ""} rows={5} maxLength={2000} />
      </div>

      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      {state?.ok && <p className="text-xs text-success">Saved.</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
