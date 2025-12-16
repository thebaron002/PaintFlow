
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailCard, SectionRow } from "@/components/mobile/detail-card";
import { CustomMobileCalendar } from "@/components/ui/custom-mobile-calendar";
import { CircleDot, CircleDashed } from "lucide-react";

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
      <PageHeader title="Styleguide & Design System" />

      <div className="space-y-12 pb-20">

        {/* Mobile Design Standard Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-extrabold text-zinc-900 flex items-center gap-2">
            📱 Mobile Design Standard <span className="text-sm font-normal text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">Nano Banana Bold</span>
          </h2>
          <div className="bg-[#F2F1EF] p-8 rounded-[32px] border border-zinc-200">
            <div className="max-w-md mx-auto space-y-6">
              {/* Header Spec */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-[28px] font-extrabold text-black leading-none tracking-tight">
                      Job Title Header
                    </h1>
                    <div className="bg-[#FFE600] self-start px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-black uppercase tracking-wide">
                        Status Pill
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-2">Font: Inter / 28px / ExtraBold</p>
              </div>

              {/* Card Spec */}
              <DetailCard title="Detail Card Component">
                <SectionRow label="Label Text" value="Value Text" />
                <SectionRow label="Numeric Value" value="$ 1,250.00" valueClass="text-zinc-900 font-extrabold" />
                <SectionRow label="Success Value" value="+ 15%" valueClass="text-green-500" />
                <p className="text-xs text-zinc-300 font-mono mt-4 pt-4 border-t">
                  bg-white rounded-[24px] shadow-sm p-5
                </p>
              </DetailCard>

              {/* Production Days Spec */}
              <DetailCard title="Production Days UI">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="flex items-center gap-1 h-5 px-1.5 text-[10px]">
                    <CircleDot className="w-3 h-3 text-secondary-foreground" /> Full Day
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1 h-5 px-1.5 text-[10px]">
                    <CircleDashed className="w-3 h-3 text-zinc-500" /> Half Day
                  </Badge>
                </div>
                <p className="text-[13px] text-zinc-400 mb-4">Badge: variant="secondary" + custom icons</p>

                <div className="border rounded-xl p-4 bg-zinc-50">
                  <h4 className="text-sm font-bold text-zinc-900 mb-2">Custom Mobile Calendar</h4>
                  <div className="bg-white rounded-xl border p-2">
                    <CustomMobileCalendar
                      productionDays={[{ date: new Date().toISOString(), dayType: 'full' }]}
                      onDayClick={() => { }}
                    />
                  </div>
                </div>
              </DetailCard>
            </div>
          </div>
        </section>

        {/* Legacy / Desktop Elements */}
        <section className="space-y-6 opacity-80 pt-10 border-t">
          <h2 className="text-xl font-bold text-zinc-500">Desktop / Legacy Elements</h2>
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
        </section>
      </div>
    </div>
  );
}
