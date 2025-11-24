"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const customOrderSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  material: z.enum(["acrylic", "steel", "iron", "wood"], {
    required_error: "Please select a material",
  }),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
});

type CustomOrderFormData = z.infer<typeof customOrderSchema>;

export function CustomOrderForm() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomOrderFormData>({
    resolver: zodResolver(customOrderSchema),
    defaultValues: {
      email: "",
      material: undefined,
      description: "",
    },
  });

  const onSubmit = async (data: CustomOrderFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement Supabase submission
      console.log("Custom order data:", data);
      console.log("File:", file);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Custom order request submitted successfully! We'll contact you soon.");
      form.reset();
      setFile(null);
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">Your Vision, Our Craft</h2>
          <p className="mt-4 text-muted-foreground">
            Have a unique idea? We specialize in bringing custom wall decor to life. Describe your vision below, 
            and our designers will collaborate with you to create a piece that&apos;s truly yours.
          </p>
          <div className="mt-8 hidden md:block">
            <div 
              className="w-full h-64 md:h-80 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=2070&auto=format&fit=crop")'
              }}
            />
          </div>
        </div>

        <div className="w-full max-w-lg mx-auto md:mx-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="acrylic">Acrylic</SelectItem>
                        <SelectItem value="steel">Steel</SelectItem>
                        <SelectItem value="iron">Iron</SelectItem>
                        <SelectItem value="wood">Wood</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe your customization</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="E.g., size, color, specific design elements..." 
                        rows={4} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="block text-sm font-medium mb-1">Upload design file</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-input hover:border-primary transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="flex text-sm text-muted-foreground">
                      <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept="image/png,image/jpeg,image/jpg,image/gif"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {file ? file.name : "PNG, JPG, GIF up to 10MB"}
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Get a Quote"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}

