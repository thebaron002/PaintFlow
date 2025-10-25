
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/app/lib/types";
import { useFirestore, setDocumentNonBlocking, useUser } from "@/firebase";
import { doc } from "firebase/firestore";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Please enter a valid email address."),
  businessName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile: UserProfile;
  onSuccess: () => void;
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name || "",
      email: profile.email || "",
      businessName: profile.businessName || "",
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    if (!firestore || !user) return;

    const profileRef = doc(firestore, 'users', user.uid);
    setDocumentNonBlocking(profileRef, data, { merge: true });
    
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 max-w-2xl mx-auto">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
               <FormControl>
                  <Input placeholder="e.g. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                 <Input type="email" placeholder="e.g. john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Name (Optional)</FormLabel>
               <FormControl>
                  <Input placeholder="e.g. Doe's Painting Co." {...field} />
              </FormControl>
              <FormDescription>
                The name of your company, if applicable.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Save Changes</Button>
      </form>
    </Form>
  );
}
