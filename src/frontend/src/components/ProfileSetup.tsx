import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveUserProfile } from "../hooks/useQueries";

export default function ProfileSetup() {
  const [name, setName] = useState("");
  const { mutateAsync, isPending } = useSaveUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await mutateAsync({ name: name.trim() });
      toast.success("Welcome to DeepWork!");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-sm"
        data-ocid="profile_setup.dialog"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-2">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <DialogTitle>Set up your profile</DialogTitle>
          <DialogDescription>
            Tell us your name to personalize your experience.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="profile_setup.input"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full gradient-primary text-white border-0"
            data-ocid="profile_setup.submit_button"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Get Started
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
