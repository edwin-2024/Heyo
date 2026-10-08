"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Camera, Sparkles, User, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialEmail: string;
  initialAvatar?: string | null;
  onSave: (updated: { name: string; avatarUrl?: string | null }) => void;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Edwin&backgroundColor=2563eb",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Alex&backgroundColor=7c3aed",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sara&backgroundColor=ffd5dc",
];

export function EditProfileModal({
  open,
  onOpenChange,
  initialName,
  initialEmail,
  initialAvatar,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatar || null);
  const [isSaved, setIsSaved] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name: name.trim() || initialName, avatarUrl });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onOpenChange(false);
    }, 400);
  };

  const userInitials = (name || initialName)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border shadow-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-pixel text-muted-foreground uppercase tracking-wider">
              OPERATOR // SETTINGS
            </span>
            <Badge variant="outline" className="text-[10px] font-mono py-0 px-2 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              Verified
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Profile</DialogTitle>
          <DialogDescription className="text-xs">
            Manage your operator display name and chat avatar identity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Avatar Management */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary/40 bg-card shadow-md flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl font-mono">
                    {userInitials || "OP"}
                  </div>
                )}
              </div>

              {/* Upload trigger overlay */}
              <label className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] cursor-pointer transition-opacity backdrop-blur-xs">
                <Camera className="h-5 w-5 mb-0.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Presets & Reset buttons */}
            <div className="flex items-center gap-2">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarUrl(url)}
                  className={cn(
                    "h-8 w-8 rounded-lg overflow-hidden border transition-all cursor-pointer hover:scale-105",
                    avatarUrl === url ? "border-primary ring-2 ring-primary/30" : "border-border opacity-70 hover:opacity-100"
                  )}
                  title={`Preset ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preset ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAvatarUrl(null)}
                className="h-8 px-2 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                title="Reset to initials"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Initials
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="operator-name" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Display Name
              </Label>
              <Input
                id="operator-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="operator-email" className="text-xs font-medium text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="operator-email"
                value={initialEmail}
                disabled
                className="h-9 text-xs bg-muted/50 text-muted-foreground cursor-not-allowed font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Email is managed through your Neon Auth identity.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaved}
              className="text-xs font-medium cursor-pointer"
            >
              {isSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Saved!
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
