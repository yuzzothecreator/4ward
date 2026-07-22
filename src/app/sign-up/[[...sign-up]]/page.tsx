import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div className="gradient-mesh flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Create your 4ward account</CardTitle>
          <CardDescription>Join as a buyer or student creator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input className="mt-1.5" placeholder="Your name" />
          </div>
          <div>
            <Label>Email</Label>
            <Input className="mt-1.5" type="email" placeholder="you@university.edu" />
          </div>
          <div>
            <Label>Password</Label>
            <Input className="mt-1.5" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full">Create account</Button>
          <Button variant="secondary" className="w-full">
            Sign up with Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
