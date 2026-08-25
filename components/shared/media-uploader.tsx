"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * Uploads directly to a Storage bucket from the browser and returns the
 * resulting object path (not a public URL — see docs/01-DATABASE.md §7 on
 * why gated media is only ever handed out as a short-lived signed URL).
 * Path convention is `${userId}/...` because that's what every storage
 * policy checks against — see docs/01-DATABASE.md §11.
 */
export function MediaUploader({
  bucket,
  userId,
  accept = "image/*",
  previewUrl,
  onUploaded,
  label = "Upload image",
}: {
  bucket: string;
  userId: string;
  accept?: string;
  previewUrl?: string;
  onUploaded: (path: string, publicUrl: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(previewUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith(accept.split("/")[0])) {
      setError("Unsupported file type.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large (20MB max).");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    setUploading(false);

    if (uploadError) {
      setError("Upload failed. Try again.");
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onUploaded(path, data.publicUrl);
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted",
          uploading && "opacity-60"
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-foreground" />
          </div>
        )}
        {preview && !uploading && (
          <button
            type="button"
            onClick={() => {
              setPreview(undefined);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute right-1 top-1 rounded-full bg-background/80 p-1"
            aria-label="Remove image"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : label}
      </Button>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
