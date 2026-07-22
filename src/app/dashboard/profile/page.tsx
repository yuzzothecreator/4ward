"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const [skills, setSkills] = useState(["Next.js", "TypeScript", "Node.js"]);
  const [skillInput, setSkillInput] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted">Manage your creator profile and university info.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" />
              <AvatarFallback>YO</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Your profile</CardTitle>
              <p className="text-sm text-muted-foreground">4ward.com/you</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input className="mt-1.5" defaultValue="Alex Creator" />
          </div>
          <div>
            <Label>Username</Label>
            <Input className="mt-1.5" defaultValue="alexcreator" />
          </div>
          <div>
            <Label>University</Label>
            <Input className="mt-1.5" defaultValue="University of Nairobi" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea className="mt-1.5" defaultValue="CS student building tools for campus life." />
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
