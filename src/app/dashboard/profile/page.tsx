"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/use-app-store";
import { ROLE_LABELS } from "@/lib/rbac";

export default function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const [skills, setSkills] = useState(["Next.js", "TypeScript", "Node.js"]);
  const [skillInput, setSkillInput] = useState("");
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10 text-center">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted">Loading your account…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted">Manage your account, role, and university info.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`}
              />
              <AvatarFallback>
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                4ward.com/{user.username}
              </p>
              <Badge className="mt-2" variant="secondary">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input className="mt-1.5" defaultValue={user.name} key={`name-${user.email}`} />
          </div>
          <div>
            <Label>Username</Label>
            <Input className="mt-1.5" defaultValue={user.username} key={`u-${user.email}`} />
          </div>
          <div>
            <Label>University</Label>
            <Input
              className="mt-1.5"
              defaultValue={user.university}
              key={`uni-${user.email}`}
            />
          </div>
          <div>
            <Label>Role</Label>
            <Input
              className="mt-1.5"
              value={ROLE_LABELS[user.role]}
              readOnly
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Buyers can sell anytime (promoted to Seller). Admins manage roles under Admin → Users.
            </p>
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea className="mt-1.5" placeholder="Tell buyers about yourself…" />
          </div>
          <div>
            <Label>Skills</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                  {s} ×
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add skill"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && skillInput.trim()) {
                    e.preventDefault();
                    setSkills([...skills, skillInput.trim()]);
                    setSkillInput("");
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (skillInput.trim()) {
                    setSkills([...skills, skillInput.trim()]);
                    setSkillInput("");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
          <div>
            <Label>Website</Label>
            <Input className="mt-1.5" placeholder="https://" />
          </div>
          <div>
            <Label>GitHub</Label>
            <Input className="mt-1.5" placeholder="https://github.com/" />
          </div>
          <Button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? "Saved!" : "Save profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
