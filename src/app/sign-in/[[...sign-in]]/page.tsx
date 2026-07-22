import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="gradient-mesh flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Sign in to 4ward</CardTitle>
          <CardDescription>
            Email/password and Google OAuth via Clerk when keys are configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input className="mt-1.5" type="email" placeholder="you@university.edu" />
          </div>
          <div>
            <Label>Password</Label>
            <Input className="mt-1.5" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full">Continue</Button>
          <Button variant="secondary" className="w-full">
            Continue with Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo mode:{" "}
            <Link href="/dashboard" className="text-primary hover:underline">
              enter dashboard
            </Link>{" "}
            without auth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
