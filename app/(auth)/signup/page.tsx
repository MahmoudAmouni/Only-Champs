import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";
import { Separator } from "@/components/ui/separator";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-center text-xl font-semibold tracking-[-0.01em] text-foreground">
        Create your account
      </h1>

      <SignupForm />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <GoogleButton />
    </div>
  );
}
