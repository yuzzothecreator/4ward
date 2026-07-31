"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedTick } from "@/components/verified-tick";
import { useAppStore } from "@/store/use-app-store";
import { ROLE_LABELS } from "@/lib/rbac";
import { UniversitySelect } from "@/components/university-select";
import { canonicalizeInstitution } from "@/lib/tanzania-institutions";
import { isSellerProfileReady } from "@/lib/seller-profile";

export default function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const setVerified = useAppStore((s) => s.setVerified);
  const hydratedFor = useRef<string | null>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [university, setUniversity] = useState("");
  const [bio, setBio] = useState("");
  const [supportNote, setSupportNote] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const verified = Boolean(user?.verified);

  function applyProfile(data: {
    name?: string;
    username?: string;
    university?: string | null;
    bio?: string | null;
    supportNote?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    githubUrl?: string | null;
    skills?: string[];
  }) {
    if (data.name) setName(data.name);
    if (data.username) setUsername(data.username);
    setUniversity(data.university || "");
    setBio(data.bio || "");
    setSupportNote(data.supportNote || "");
    setWhatsapp(data.whatsapp || "");
    setWebsite(data.website || "");
    setGithubUrl(data.githubUrl || "");
    setSkills(data.skills?.length ? data.skills : []);
  }

  // Hydrate once per signed-in email — do not reset while typing when verification refreshes
  useEffect(() => {
    if (!user?.email) return;
    if (hydratedFor.current === user.email) return;
    hydratedFor.current = user.email;

    applyProfile({
      name: user.name,
      username: user.username,
      university: user.university,
      bio: user.bio,
      supportNote: user.supportNote,
      whatsapp: user.whatsapp,
      website: user.website,
      githubUrl: user.githubUrl,
      skills: user.skills,
    });

    let cancelled = false;
    setLoadingProfile(true);
    void fetch(
      `/api/users/by-username/${encodeURIComponent(user.username)}`
    )
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (cancelled || !data?.user) return;
        applyProfile({
          name: data.user.name,
          username: data.user.username,
          university: data.user.university,
          bio: data.user.bio,
          supportNote: data.user.supportNote,
          whatsapp: data.user.whatsapp,
          website: data.user.website,
          githubUrl: data.user.githubUrl,
          skills: data.user.skills,
        });
        useAppStore.setState({
          user: {
            ...user,
            name: data.user.name || user.name,
            username: data.user.username || user.username,
            university: data.user.university || user.university,
            bio: data.user.bio || "",
            supportNote: data.user.supportNote || "",
            whatsapp: data.user.whatsapp || "",
            website: data.user.website || "",
            githubUrl: data.user.githubUrl || "",
            skills: data.user.skills || [],
            verified: Boolean(data.user.verified ?? user.verified),
          },
        });
      })
      .catch(() => {
        /* store values already applied */
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per email
  }, [user?.email]);

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

    const nextName = name.trim();
    const nextUsername = username.trim().toLowerCase();
    if (nextName.length < 2) {
      setSaveError("Name must be at least 2 characters");
      setSaving(false);
      return;
    }
    if (!/^[a-z0-9_-]{3,30}$/.test(nextUsername)) {
      setSaveError(
        "Username must be 3–30 characters: lowercase letters, numbers, _ or -"
      );
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: user.email,
          name: nextName,
          username: nextUsername,
          university: canonicalizeInstitution(university) || university.trim(),
          bio: bio.trim(),
          supportNote: supportNote.trim(),
          whatsapp: whatsapp.trim(),
          website: website.trim(),
          githubUrl: githubUrl.trim(),
          skills,
          updateProfile: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Could not save profile");
        return;
      }

      const savedUni =
        canonicalizeInstitution(data.user?.university || university) ||
        university.trim();

      const nextUser = {
        ...user,
        name: data.user?.name || nextName,
        username: data.user?.username || nextUsername,
        university: savedUni,
        bio: data.user?.bio ?? bio.trim(),
        supportNote: data.user?.supportNote ?? supportNote.trim(),
        whatsapp: data.user?.whatsapp ?? whatsapp.trim(),
        website: data.user?.website ?? website.trim(),
        githubUrl: data.user?.githubUrl ?? githubUrl.trim(),
        skills: data.user?.skills ?? skills,
        verified: Boolean(data.user?.verified ?? user.verified),
        role: data.user?.role || user.role,
      };

      useAppStore.setState({ user: nextUser });
      applyProfile(nextUser);
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

  const sellerReady = isSellerProfileReady({
    bio,
    supportNote,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted">
          Buyers need to know who you are and how to get help after they buy.
        </p>
      </div>

      {loadingProfile ? (
        <p className="text-xs text-muted-foreground">Loading saved profile…</p>
      ) : null}

      {!sellerReady ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-medium">Complete seller help details</p>
          <p className="mt-1 text-xs opacity-90">
            Add a bio and post-purchase support note before publishing listings —
            so buyers aren’t stuck without setup help.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100">
          Seller profile ready — buyers can see how to reach you for help.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`}
              />
              <AvatarFallback>
                {(name || user.name).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="flex items-center gap-1.5">
                {name || user.name}
                {verified ? <VerifiedTick /> : null}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                4ward.com/{username || user.username}
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              className="mt-1.5"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
          </div>
          <div>
            <Label>University / institute</Label>
            <div className="mt-1.5">
              <UniversitySelect value={university} onChange={setUniversity} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Stored as short code (e.g. UDSM). Used for campus exclusivity.
            </p>
          </div>
          <div>
            <Label>Role</Label>
            <Input className="mt-1.5" value={ROLE_LABELS[user.role]} readOnly />
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground">
              About you (shown to buyers)
            </p>
            <CardDescription className="mt-1">
              Required before you publish Campus or Market listings.
            </CardDescription>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              className="mt-1.5"
              rows={3}
              placeholder="Who you are, what you build, campuses or companies you’ve shipped for…"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Min 20 characters. Helps buyers trust the seller.
            </p>
          </div>

          <div>
            <Label htmlFor="supportNote">Buyer support after purchase</Label>
            <Textarea
              id="supportNote"
              className="mt-1.5"
              rows={4}
              placeholder="e.g. Message me on WhatsApp within 24h for install help. I reply Mon–Sat 9am–6pm EAT. Include your order title."
              value={supportNote}
              onChange={(e) => setSupportNote(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Min 20 characters. Explain how buyers get help if they don’t know
              how to use the product.
            </p>
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp / phone (optional)</Label>
            <Input
              id="whatsapp"
              className="mt-1.5"
              placeholder="2557…"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
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
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              className="mt-1.5"
              placeholder="https://"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="githubUrl">GitHub</Label>
            <Input
              id="githubUrl"
              className="mt-1.5"
              placeholder="https://github.com/"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
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
