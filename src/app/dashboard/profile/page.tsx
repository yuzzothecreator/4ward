"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedTick } from "@/components/verified-tick";
import { useAppStore } from "@/store/use-app-store";
import { ROLE_LABELS } from "@/lib/rbac";
import { UniversitySelect } from "@/components/university-select";
import { canonicalizeInstitution } from "@/lib/tanzania-institutions";

export default function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const setVerified = useAppStore((s) => s.setVerified);
  const [skills, setSkills] = useState(["Next.js", "TypeScript", "Node.js"]);
  const [skillInput, setSkillInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [university, setUniversity] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const verified = Boolean(user?.verified);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setUsername(user.username);
    setUniversity(user.university);
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    void fetch(`/api/verification?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setVerified(Boolean(data.verified));
      })
      .catch(() => {
        /* keep store value */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, setVerified]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: user.email,
          name: name.trim(),
          username: username.trim(),
          university: university.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Could not save profile");
        return;
      }
      useAppStore.setState({
        user: {
          ...user,
          name: data.user?.name || name.trim(),
          username: data.user?.username || username.trim(),
          university: data.user?.university || university.trim(),
          verified: Boolean(data.user?.verified ?? user.verified),
          role: data.user?.role || user.role,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Network error saving profile");
    } finally {
      setSaving(false);
    }
  }

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
              <CardTitle className="flex items-center gap-1.5">
                {user.name}
                {verified ? <VerifiedTick /> : null}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                4ward.com/{user.username}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                {verified ? (
                  <Badge variant="neon">Verified seller</Badge>
                ) : (
                  <Link href="/dashboard/verification">
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:border-sky-500 hover:text-sky-500"
                    >
                      Get blue tick
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label>Username</Label>
            <Input
              className="mt-1.5"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Label>University / institute</Label>
            <div className="mt-1.5">
              <UniversitySelect
                value={university}
                onChange={setUniversity}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Stored as short code (e.g. UDSM). Used for campus exclusivity — one
              buyer per campus per project for 4 months.
            </p>
          </div>
          <div>
            <Label>Role</Label>
            <Input className="mt-1.5" value={ROLE_LABELS[user.role]} readOnly />
            <p className="mt-1 text-xs text-muted-foreground">
              Buyers can sell anytime. Admins approve blue ticks under Admin → Blue ticks.
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
                <Badge
                  key={s}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setSkills(skills.filter((x) => x !== s))}
                >
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
          {saveError ? (
            <p className="text-sm text-destructive">{saveError}</p>
          ) : null}
          <Button onClick={() => void saveProfile()} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved!" : "Save profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
