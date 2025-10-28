
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  destructive: string;
};

const ColorBox = ({ name, className }: { name: string; className: string }) => (
  <div className="flex flex-col items-center">
    <div className={`h-20 w-20 rounded-lg shadow-md ${className}`} />
    <span className="mt-2 text-sm font-medium">{name}</span>
  </div>
);

const ColorEditor = ({ name, value, onChange }: { name: keyof ThemeColors, value: string, onChange: (name: keyof ThemeColors, value: string) => void }) => (
    <div className="space-y-2">
        <Label htmlFor={name} className="capitalize">{name}</Label>
        <Input
            id={name}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder="H S% L%"
        />
    </div>
)

export default function StyleguidePage() {
  const [colors, setColors] = useState<ThemeColors>({
    primary: '',
    secondary: '',
    accent: '',
    background: '',
    foreground: '',
    card: '',
    destructive: '',
  });

  useEffect(() => {
    // Get initial CSS variable values
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);
    const initialColors: ThemeColors = {
      primary: computedStyles.getPropertyValue('--primary').trim(),
      secondary: computedStyles.getPropertyValue('--secondary').trim(),
      accent: computedStyles.getPropertyValue('--accent').trim(),
      background: computedStyles.getPropertyValue('--background').trim(),
      foreground: computedStyles.getPropertyValue('--foreground').trim(),
      card: computedStyles.getPropertyValue('--card').trim(),
      destructive: computedStyles.getPropertyValue('--destructive').trim(),
    };
    setColors(initialColors);
  }, []);

  const handleColorChange = (name: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [name]: value }));
    document.documentElement.style.setProperty(`--${name}`, value);
  };
  
  return (
    <div>
      <PageHeader title="Styleguide" />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Live Theme Editor</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ColorEditor name="primary" value={colors.primary} onChange={handleColorChange} />
                <ColorEditor name="secondary" value={colors.secondary} onChange={handleColorChange} />
                <ColorEditor name="accent" value={colors.accent} onChange={handleColorChange} />
                <ColorEditor name="background" value={colors.background} onChange={handleColorChange} />
                <ColorEditor name="foreground" value={colors.foreground} onChange={handleColorChange} />
                <ColorEditor name="card" value={colors.card} onChange={handleColorChange} />
                <ColorEditor name="destructive" value={colors.destructive} onChange={handleColorChange} />
          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            <ColorBox name="Primary" className="bg-primary" />
            <ColorBox name="Secondary" className="bg-secondary" />
            <ColorBox name="Accent" className="bg-accent" />
            <ColorBox name="Muted" className="bg-muted" />
            <ColorBox name="Destructive" className="bg-destructive" />
            <ColorBox name="Background" className="bg-background border" />
            <ColorBox name="Card" className="bg-card border" />
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
