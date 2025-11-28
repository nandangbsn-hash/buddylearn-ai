import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Brain, Upload, FileText, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { updateStreak } from "@/lib/updateStreak";

const Materials = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("text");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchSubjects();
        fetchMaterials();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching subjects:", error);
    } else {
      setSubjects(data || []);
    }
  };

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from("materials")
      .select("*, subjects(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching materials:", error);
    } else {
      setMaterials(data || []);
    }
  };

  const handleCreateSubject = async () => {
    const subjectName = prompt("Enter subject name:");
    if (!subjectName || !session) return;

    const { error } = await supabase
      .from("subjects")
      .insert({
        name: subjectName,
        user_id: session.user.id,
      });

    if (error) {
      toast.error("Failed to create subject");
    } else {
      toast.success("Subject created!");
      fetchSubjects();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setIsUploading(true);

    try {
      const { data: material, error } = await supabase.from("materials").insert({
        title,
        content,
        subject_id: subjectId || null,
        topic: topic || null,
        difficulty: difficulty || null,
        file_type: fileType,
        file_url: fileUrl || null,
        user_id: session.user.id,
      }).select().single();

      if (error) throw error;

      // Process with AI if there's content
      if (content && material) {
        supabase.functions.invoke('process-material', {
          body: { materialId: material.id, content }
        });
      }

      // Award XP for uploading material
      await awardXP(10);

      toast.success("Study material added successfully!");
      setTitle("");
      setContent("");
      setTopic("");
      setDifficulty("");
      setFileUrl("");
      setFileType("text");
      fetchMaterials();
    } catch (error: any) {
      toast.error(error.message || "Failed to add material");
    } finally {
      setIsUploading(false);
    }
  };

  const awardXP = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (progress) {
      const newXP = progress.total_xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;

      await supabase
        .from("user_progress")
        .update({
          total_xp: newXP,
          level: newLevel,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq("user_id", user.id);

      // Update streak
      await updateStreak(user.id);
    }
  };

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Study Materials</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <CardTitle>Add Study Material</CardTitle>
              </div>
              <CardDescription>Upload notes, summaries, or study content</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FileUpload
                  onUploadComplete={(url, type) => {
                    setFileUrl(url);
                    setFileType(type);
                  }}
                />

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Chapter 5: Photosynthesis"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="subject">Subject</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCreateSubject}
                    >
                      + New Subject
                    </Button>
                  </div>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Light-dependent reactions"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Additional Notes (Optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Add any extra notes or context. AI will analyze your uploaded file directly.
                  </p>
                  <Textarea
                    id="content"
                    placeholder="Add optional notes to complement your uploaded file..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Add Material
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Materials List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Materials</h2>
            {materials.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No materials yet. Add your first study material to get started!</p>
                </CardContent>
              </Card>
            ) : (
              materials.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <CardDescription>
                      {material.subjects?.name && (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-primary/10 text-primary mr-2">
                          {material.subjects.name}
                        </span>
                      )}
                      {material.difficulty && (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-secondary/50">
                          {material.difficulty}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                   <CardContent>
                     {material.topic && (
                       <p className="text-sm text-muted-foreground mb-2">
                         Topic: {material.topic}
                       </p>
                     )}
                     {material.content && (
                       <p className="text-sm line-clamp-3 mb-4">{material.content}</p>
                     )}
                     <div className="flex gap-2">
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => navigate(`/quizzes?materialId=${material.id}`)}
                       >
                         <Sparkles className="h-4 w-4 mr-2" />
                         Generate Quiz
                       </Button>
                       <Button 
                         size="sm" 
                         variant="ghost"
                         onClick={() => navigate(`/ai-chat?materialId=${material.id}`)}
                       >
                         <Brain className="h-4 w-4 mr-2" />
                         Ask AI
                       </Button>
                     </div>
                   </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Materials;
