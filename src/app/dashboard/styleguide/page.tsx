
"use client";

import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ColorBox = ({ name, className }: { name: string; className: string }) => (
  <div className="flex flex-col items-center">
    <div className={`h-20 w-20 rounded-lg shadow-md ${className}`} />
    <span className="mt-2 text-sm font-medium">{name}</span>
  </div>
);

export default function StyleguidePage() {
  return (
    <div>
      <PageHeader title="Styleguide" />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <ColorBox name="Primary" className="bg-primary" />
            <ColorBox name="Secondary" className="bg-secondary" />
            <ColorBox name="Accent" className="bg-accent" />
            <ColorBox name="Muted" className="bg-muted" />
            <ColorBox name="Destructive" className="bg-destructive" />
            <ColorBox name="Background" className="bg-background border" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography &amp; Buttons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">The Joke Tax Chronicles</h1>
                <p className="text-xl text-muted-foreground">A king thought he was protecting his people, but he was really punishing them.</p>
            </div>
            <div className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">Destructive</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Glassmorphism</CardTitle>
          </CardHeader>
          <CardContent>
             <GlassCard>
                <div className="p-4">
                    <h3 className="text-lg font-semibold">GlassCard Component</h3>
                    <p className="text-muted-foreground">This is a card with a glass-like effect using backdrop-filter.</p>
                </div>
            </GlassCard>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
