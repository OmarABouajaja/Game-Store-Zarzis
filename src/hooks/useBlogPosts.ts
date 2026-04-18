import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface BlogPost {
  id: string;
  title: string;
  title_fr: string;
  title_ar: string;
  content: string;
  content_fr: string;
  content_ar: string;
  category: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  scheduled_at?: string | null; // Optional until migration is run
  author_id: string;
  excerpt?: string; // Optional
  tags?: string[]; // Optional
  views?: number; // Optional until migration is run
  created_at: string;
}

export const useBlogPosts = (publishedOnly = true) => {
  return useQuery({
    queryKey: ["blog-posts", publishedOnly],
    queryFn: async () => {
      const query = supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      // For published only, we'll filter client-side to handle scheduled posts
      if (!publishedOnly) {
        const { data, error } = await query;
        if (error) throw error;
        return data as BlogPost[];
      }

      // Get all posts and filter client-side
      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();
      const posts = (data as BlogPost[]).filter(post => {
        // Include published posts
        if (post.is_published) return true;

        // Include scheduled posts that have reached their time
        if (post.scheduled_at) {
          const scheduledTime = new Date(post.scheduled_at);
          return scheduledTime <= now;
        }

        return false;
      });

      return posts;
    },
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: Omit<BlogPost, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: Partial<BlogPost> & { id: string }) => {
      const { id, ...updateData } = post;
      const { error } = await supabase
        .from("blog_posts")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
};

export const useIncrementPostViews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      try {
        // First get current views
        const { data: post, error: fetchError } = await supabase
          .from("blog_posts")
          .select("views")
          .eq("id", postId)
          .single();

        // If column doesn't exist, silently fail (frontend-only mode)
        if (fetchError?.message?.includes('column') || fetchError?.message?.includes('schema')) {
          return; // Column doesn't exist yet, skip
        }

        if (fetchError) throw fetchError;

        const currentViews = post?.views || 0;

        // Update views
        const { error } = await supabase
          .from("blog_posts")
          .update({ views: currentViews + 1 })
          .eq("id", postId);

        // If column doesn't exist, silently fail
        if (error?.message?.includes('column') || error?.message?.includes('schema')) {
          return; // Column doesn't exist yet, skip
        }

        if (error) throw error;
      } catch (error: any) {
        // Silently handle missing column errors for frontend-only mode
        if (error?.message?.includes('column') || error?.message?.includes('schema')) {
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
};


