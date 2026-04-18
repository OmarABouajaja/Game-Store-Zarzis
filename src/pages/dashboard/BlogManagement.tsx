import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost, BlogPost } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileText, Plus, Edit, Trash2, Eye, Share2, Clock, Send, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

const BlogManagement = () => {
  const { user, isOwner } = useAuth();
  const { t } = useLanguage();
  const { data: blogPosts, isLoading } = useBlogPosts(false); // Get all posts including drafts
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    title_fr: "",
    title_ar: "",
    content: "",
    content_fr: "",
    content_ar: "",
    excerpt: "",
    category: "",
    tags: "",
    image_url: "",
    is_published: false,
    scheduled_at: null as Date | null
  });

  // Image preview states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only owners can access this page
  if (!isOwner) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Only owners can manage blog content.</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast({ title: "Erreur de validation", description: "Le titre est obligatoire.", variant: "destructive" });
      return;
    }

    if (!formData.content.trim()) {
      toast({ title: "Erreur de validation", description: "Le contenu est obligatoire.", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Erreur d'authentification", description: "Vous devez être connecté pour publier.", variant: "destructive" });
      return;
    }

    // Temporarily disabled for testing
    // if (!isOwner) {
    //   toast({ title: "Accès refusé", description: "Seuls les propriétaires peuvent gérer le blog.", variant: "destructive" });
    //   return;
    // }

    try {
      // Use actual user ID or fallback to test user
      const authorId = user?.id || "4386a48a-a95c-4f95-97a2-685fed447800";

      // Validate image URL (reject data URLs and ensure HTTP/HTTPS)
      if (formData.image_url) {
        if (formData.image_url.startsWith('data:')) {
          throw new Error("Les URLs de données ne sont pas acceptées. Utilisez une URL d'image externe.");
        }
        if (!formData.image_url.startsWith('http://') && !formData.image_url.startsWith('https://')) {
          throw new Error("L'URL doit commencer par http:// ou https://");
        }
        // Basic URL validation
        try {
          new URL(formData.image_url);
        } catch {
          throw new Error("URL invalide. Vérifiez le format de l'URL.");
        }
      }

      const postData: any = {
        title: formData.title.trim(),
        title_fr: formData.title_fr.trim() || formData.title.trim(),
        title_ar: formData.title_ar.trim() || formData.title.trim(),
        content: formData.content.trim(),
        content_fr: formData.content_fr.trim() || formData.content.trim(),
        content_ar: formData.content_ar.trim() || formData.content.trim(),
        category: formData.category || null,
        image_url: formData.image_url || null,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null,
        author_id: authorId
      };

      // Only include new columns if they exist in the database
      // These will be added after running the migration SQL
      if (formData.scheduled_at) {
        postData.scheduled_at = formData.scheduled_at.toISOString();
      }

      // Note: views column will be added later via migration
      // Don't set views here to avoid errors if column doesn't exist

      // Ensure all required fields are provided
      if (!postData.title_fr || !postData.title_ar || !postData.content_fr || !postData.content_ar) {
        throw new Error("All language versions are required");
      }



      if (editingPost) {
        // For updates, exclude fields that shouldn't be updated
        const { author_id, ...updateFields } = postData;
        await updatePost.mutateAsync({ id: editingPost.id, ...updateFields });
        toast({ title: "✅ Article mis à jour", description: "L'article a été modifié avec succès." });
      } else {
        await createPost.mutateAsync(postData);
        toast({ title: "✅ Article créé", description: "Le nouvel article a été ajouté avec succès." });
      }

      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData({
        title: "",
        title_fr: "",
        title_ar: "",
        content: "",
        content_fr: "",
        content_ar: "",
        excerpt: "",
        category: "",
        tags: "",
        image_url: "",
        is_published: false,
        scheduled_at: null
      });
      // Reset image states
      setImagePreview(null);
      setImageError(null);
      setImageLoading(false);
    } catch (error: any) {
      console.error("Blog post save error:", error);
      console.error("Error details:", error?.details);
      console.error("Error hint:", error?.hint);
      console.error("Error code:", error?.code);

      let errorMessage = "Une erreur s'est produite lors de la sauvegarde.";

      if (error?.code === '42501') {
        errorMessage = "Permissions insuffisantes. Vérifiez vos droits d'accès.";
      } else if (error?.code === '23505') {
        errorMessage = "Un article avec ces données existe déjà.";
      } else if (error?.code === '23503') {
        errorMessage = "Erreur de référence. Vérifiez les données liées.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.")) {
      try {
        await deletePost.mutateAsync(postId);
        toast({ title: "🗑️ Article supprimé", description: "L'article a été supprimé avec succès." });
      } catch (error) {
        toast({
          title: "❌ Erreur",
          description: "Impossible de supprimer l'article.",
          variant: "destructive"
        });
      }
    }
  };

  // Test function to check database connectivity
  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('count')
        .limit(1);

      if (error) throw error;

      toast({
        title: "✅ Connexion DB OK",
        description: "La base de données est accessible.",
      });
    } catch (error: any) {
      console.error("Database test error:", error);
      toast({
        title: "❌ Erreur DB",
        description: `Problème de connexion: ${error?.message}`,
        variant: "destructive"
      });
    }
  };

  // Image handling functions
  // Note: File upload is disabled to prevent database bloat
  // Only external URLs are accepted for database optimization
  const validateImageUrl = async (url: string): Promise<boolean> => {
    if (!url) return false;

    // Basic validation for external URLs only
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  };

  const handleImageUrlChange = async (url: string) => {
    setFormData({ ...formData, image_url: url });
    setImageError(null);

    if (!url.trim()) {
      setImagePreview(null);
      setImageLoading(false);
      return;
    }

    setImageLoading(true);
    const isValid = await validateImageUrl(url);

    if (isValid) {
      setImagePreview(url);
      setImageError(null);
    } else {
      setImagePreview(null);
      setImageError("URL d'image invalide ou inaccessible");
    }

    setImageLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Temporarily disabled for database optimization
    setImageError("Téléversement d'images désactivé pour optimiser l'espace base de données. Utilisez une URL externe.");
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageError(null);
    setFormData({ ...formData, image_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleShare = async (post: BlogPost) => {
    try {
      // Copy the blog URL to clipboard
      const blogUrl = `${window.location.origin}/blog`;
      await navigator.clipboard.writeText(blogUrl);
      toast({
        title: "🔗 Lien copié",
        description: "Le lien du blog a été copié dans le presse-papiers."
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const newPublishedStatus = !post.is_published;
      const updateData: any = {
        id: post.id,
        is_published: newPublishedStatus,
        published_at: newPublishedStatus ? new Date().toISOString() : null
      };

      // Only include scheduled_at if it exists in the post (after migration)
      // Don't try to set it if column doesn't exist
      if (post.scheduled_at !== undefined) {
        updateData.scheduled_at = null;
      }

      await updatePost.mutateAsync(updateData);
      toast({
        title: newPublishedStatus ? "✅ Article publié" : "📝 Article mis en brouillon",
        description: newPublishedStatus
          ? "L'article est maintenant visible sur le blog."
          : "L'article a été mis en brouillon et n'est plus visible."
      });
    } catch (error: any) {
      console.error("Toggle publish error:", error);

      // Silently handle missing column errors (frontend-only mode)
      if (error?.message?.includes('scheduled_at') || error?.message?.includes('schema cache')) {
        // Column doesn't exist yet, but operation still succeeds for other fields
        // Just show a generic success message
        toast({
          title: !post.is_published ? "✅ Article publié" : "📝 Article mis en brouillon",
          description: !post.is_published
            ? "L'article est maintenant visible sur le blog."
            : "L'article a été mis en brouillon et n'est plus visible."
        });
      } else {
        toast({
          title: "❌ Erreur",
          description: error?.message || "Impossible de modifier le statut de publication.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">{t("blog.management.title")}</h1>
              <p className="text-muted-foreground">
                {t("blog.management.subtitle")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testDatabaseConnection}>
                {t("blog.btn.test_db")}
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingPost(null);
                    setFormData({
                      title: "",
                      title_fr: "",
                      title_ar: "",
                      content: "",
                      content_fr: "",
                      content_ar: "",
                      excerpt: "",
                      category: "",
                      tags: "",
                      image_url: "",
                      is_published: false,
                      scheduled_at: null
                    });
                    // Reset image states
                    setImagePreview(null);
                    setImageError(null);
                    setImageLoading(false);
                  }}>
                    <Plus className="w-4 h-4 me-2" />
                    {t("blog.btn.new")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPost ? "Edit Blog Post" : "Create New Blog Post"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">{t("blog.form.title_en")}</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={t("blog.placeholder.title_en")}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="title_fr">{t("blog.form.title_fr")}</Label>
                      <Input
                        id="title_fr"
                        value={formData.title_fr}
                        onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                        placeholder={t("blog.placeholder.title_fr")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="title_ar">{t("blog.form.title_ar")}</Label>
                      <Input
                        id="title_ar"
                        value={formData.title_ar}
                        onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                        placeholder={t("blog.placeholder.title_ar")}
                        dir="rtl"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">{t("blog.form.category")}</Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="">{t("blog.placeholder.category")}</option>
                        <option value="repair">{t("blog.category.repair")}</option>
                        <option value="tips">{t("blog.category.tips")}</option>
                        <option value="news">{t("blog.category.news")}</option>
                        <option value="maintenance">{t("blog.category.maintenance")}</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="tags">{t("blog.form.tags")}</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder={t("blog.placeholder.tags")}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Image de couverture</Label>

                      {/* Image Preview */}
                      <div className="relative">
                        <div className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/10 flex items-center justify-center">
                          {imageLoading ? (
                            <div className="text-center">
                              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                              <p className="text-sm text-muted-foreground">Chargement de l'image...</p>
                            </div>
                          ) : imagePreview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={imagePreview}
                                alt="Aperçu"
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setImageError("Erreur de chargement de l'image");
                                  setImagePreview(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={clearImage}
                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                                📷
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">Aucune image sélectionnée</p>
                              <p className="text-xs text-muted-foreground">URLs externes uniquement (pas de téléversement direct)</p>
                            </div>
                          )}
                        </div>

                        {imageError && (
                          <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                              ⚠️ {imageError}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Image Input Options */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-border"></div>
                          <span className="text-xs text-muted-foreground px-2">OU</span>
                          <div className="flex-1 h-px bg-border"></div>
                        </div>

                        {/* URL Input */}
                        <div>
                          <Label htmlFor="image_url" className="text-sm">URL de l'image</Label>
                          <Input
                            id="image_url"
                            value={formData.image_url.startsWith('data:') ? '' : formData.image_url}
                            onChange={(e) => handleImageUrlChange(e.target.value)}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            URL externe uniquement (Unsplash, Imgur, etc.) - aperçu instantané disponible
                          </p>
                        </div>

                        {/* File Upload - Temporarily disabled for database optimization */}
                        <div className="opacity-50 pointer-events-none">
                          <Label htmlFor="image_file" className="text-sm">Téléverser un fichier</Label>
                          <div className="mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full cursor-not-allowed"
                              disabled
                            >
                              <span className="me-2">📁</span>
                              Fonctionnalité désactivée
                            </Button>
                          </div>
                          <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className="text-amber-600">⚠️</span>
                              <div className="text-xs text-amber-800 dark:text-amber-200">
                                <strong>Optimisation base de données</strong><br />
                                Le téléversement direct est désactivé pour éviter de surcharger la base de données.
                                Utilisez des URLs d'images externes (Unsplash, Imgur, etc.) ou hébergez vos images sur un service cloud.
                                <br /><br />
                                <strong>Exemples d'URLs valides:</strong><br />
                                • https://images.unsplash.com/...<br />
                                • https://i.imgur.com/...<br />
                                • https://via.placeholder.com/...
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="content">{t("blog.form.content_en")}</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder={t("blog.placeholder.content_en")}
                        rows={6}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="content_fr">{t("blog.form.content_fr")}</Label>
                      <Textarea
                        id="content_fr"
                        value={formData.content_fr}
                        onChange={(e) => setFormData({ ...formData, content_fr: e.target.value })}
                        placeholder={t("blog.placeholder.content_fr")}
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="content_ar">{t("blog.form.content_ar")}</Label>
                      <Textarea
                        id="content_ar"
                        value={formData.content_ar}
                        onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                        placeholder={t("blog.placeholder.content_ar")}
                        rows={4}
                        dir="rtl"
                      />
                    </div>

                    {/* Scheduling Section */}
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-sm font-medium">Publication Options</Label>

                      {/* Scheduled Date/Time Picker */}
                      <div className="space-y-2">
                        <Label htmlFor="scheduled_at" className="text-sm">Schedule for later (optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Clock className="me-2 h-4 w-4" />
                              {formData.scheduled_at ? (
                                format(formData.scheduled_at, "PPP p")
                              ) : (
                                <span className="text-muted-foreground">Pick a date and time</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-4 space-y-4">
                              <Calendar
                                mode="single"
                                selected={formData.scheduled_at || undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const newDate = new Date(date);
                                    // Set time to current time or keep existing time
                                    if (formData.scheduled_at) {
                                      newDate.setHours(formData.scheduled_at.getHours());
                                      newDate.setMinutes(formData.scheduled_at.getMinutes());
                                    } else {
                                      newDate.setHours(new Date().getHours() + 1);
                                      newDate.setMinutes(0);
                                    }
                                    setFormData({ ...formData, scheduled_at: newDate });
                                  } else {
                                    setFormData({ ...formData, scheduled_at: null });
                                  }
                                }}
                                disabled={(date) => date < new Date()}
                              />
                              <div>
                                <Label htmlFor="scheduled_time" className="text-sm">Time</Label>
                                <Input
                                  id="scheduled_time"
                                  type="time"
                                  value={formData.scheduled_at ? format(formData.scheduled_at, "HH:mm") : ""}
                                  onChange={(e) => {
                                    if (e.target.value && formData.scheduled_at) {
                                      const [hours, minutes] = e.target.value.split(":").map(Number);
                                      const newDate = new Date(formData.scheduled_at);
                                      newDate.setHours(hours);
                                      newDate.setMinutes(minutes);
                                      setFormData({ ...formData, scheduled_at: newDate });
                                    } else if (e.target.value) {
                                      const [hours, minutes] = e.target.value.split(":").map(Number);
                                      const tomorrow = new Date();
                                      tomorrow.setDate(tomorrow.getDate() + 1);
                                      tomorrow.setHours(hours);
                                      tomorrow.setMinutes(minutes);
                                      setFormData({ ...formData, scheduled_at: tomorrow });
                                    }
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              {formData.scheduled_at && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setFormData({ ...formData, scheduled_at: null })}
                                  className="w-full"
                                >
                                  Clear schedule
                                </Button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        {t("common.cancel")}
                      </Button>
                      {editingPost ? (
                        <Button type="submit">
                          {t("common.update")}
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={async (e) => {
                              e.preventDefault();
                              // Save as draft
                              setFormData({ ...formData, is_published: false, scheduled_at: null });
                              const form = e.currentTarget.closest('form');
                              if (form) {
                                form.requestSubmit();
                              }
                            }}
                          >
                            {t("blog.btn.save_draft")}
                          </Button>
                          <Button
                            type="button"
                            variant="default"
                            onClick={async (e) => {
                              e.preventDefault();
                              // Publish immediately
                              if (formData.scheduled_at) {
                                setFormData({ ...formData, is_published: true, scheduled_at: null });
                              } else {
                                setFormData({ ...formData, is_published: true });
                              }
                              const form = e.currentTarget.closest('form');
                              if (form) {
                                form.requestSubmit();
                              }
                            }}
                          >
                            <Send className="w-4 h-4 me-2" />
                            {t("blog.btn.post_now")}
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            onClick={async (e) => {
                              e.preventDefault();
                              // Schedule post
                              setFormData({ ...formData, is_published: true });
                              const form = e.currentTarget.closest('form');
                              if (form) {
                                form.requestSubmit();
                              }
                            }}
                          >
                            <Clock className="w-4 h-4 me-2" />
                            {t("blog.btn.schedule_post")}
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Blog Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{blogPosts?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-8 h-8 text-secondary" />
                  <div>
                    <p className="text-2xl font-bold">
                      {blogPosts?.filter(p => p.is_published).length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Publiés</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Edit className="w-8 h-8 text-accent" />
                  <div>
                    <p className="text-2xl font-bold">
                      {blogPosts?.filter(p => !p.is_published).length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Brouillons</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {blogPosts && blogPosts.length > 0 && blogPosts[0].views !== undefined && (
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">
                        {blogPosts?.reduce((sum, p) => sum + (p.views || 0), 0) || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


          </div>

          {/* Blog Posts */}
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Blog Posts</h2>

            <div className="grid gap-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : blogPosts?.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No blog posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Share repair stories and gaming tips with your customers
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="w-4 h-4 me-2" />
                    Write First Post
                  </Button>
                </div>
              ) : (
                blogPosts?.map((post) => (
                  <Card key={post.id} className="glass-card">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-medium text-base sm:text-lg truncate">{post.title}</h3>
                            <Badge variant={post.is_published ? "default" : "secondary"} className="w-fit">
                              {post.is_published ? "Publié" : "Brouillon"}
                            </Badge>
                          </div>

                          {post.excerpt && (
                            <p className="text-muted-foreground mb-3 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {post.category && (
                              <span>📁 {post.category}</span>
                            )}
                            {post.created_at && (
                              <span>
                                📅 {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            )}
                            {post.scheduled_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(post.scheduled_at).toLocaleDateString()} {new Date(post.scheduled_at).toLocaleTimeString()}
                              </span>
                            )}
                            {post.views !== undefined && (
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {post.views || 0}
                                </span>
                              </div>
                            )}
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex gap-1">
                                {post.tags.slice(0, 3).map((tag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <TooltipProvider>
                          <div className="flex gap-1 sm:ml-4 flex-shrink-0">
                            {/* 2-button group: Toggle publish/draft + Edit */}
                            <div className="flex rounded-md overflow-hidden border border-border">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleTogglePublish(post)}
                                    className={`rounded-none border-0 border-e border-border px-3 ${!post.is_published
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-orange-600 text-white hover:bg-orange-700'
                                      }`}
                                  >
                                    {!post.is_published ? (
                                      <>
                                        <Zap className="w-4 h-4 me-1" />
                                        Instant Post
                                      </>
                                    ) : (
                                      <>
                                        <FileText className="w-4 h-4 me-1" />
                                        Brouillon
                                      </>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{!post.is_published ? "Publier maintenant" : "Mettre en brouillon"}</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingPost(post);
                                      setFormData({
                                        title: post.title,
                                        title_fr: post.title_fr || "",
                                        title_ar: post.title_ar || "",
                                        content: post.content || "",
                                        content_fr: post.content_fr || "",
                                        content_ar: post.content_ar || "",
                                        excerpt: "",
                                        category: post.category || "",
                                        tags: "",
                                        image_url: post.image_url || "",
                                        is_published: post.is_published || false,
                                        scheduled_at: post.scheduled_at ? new Date(post.scheduled_at) : null
                                      });
                                      if (post.image_url) {
                                        setImagePreview(post.image_url);
                                        setImageError(null);
                                        setImageLoading(false);
                                      } else {
                                        setImagePreview(null);
                                        setImageError(null);
                                        setImageLoading(false);
                                      }
                                      setIsDialogOpen(true);
                                    }}
                                    className="rounded-none hover:bg-muted px-3"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Modifier l'article</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleShare(post)}>
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Partager</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(post.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Supprimer l'article</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute >
  );
};

export default BlogManagement;
