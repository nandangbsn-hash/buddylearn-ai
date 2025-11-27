import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Calendar as CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";

const StudyPlanner = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject_id: "",
    due_date: new Date(),
    priority: "medium",
  });

  useEffect(() => {
    fetchPlans();
    fetchSubjects();
  }, []);

  const fetchPlans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("study_plans")
      .select(`
        *,
        subjects(name, color_code)
      `)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load study plans");
    } else {
      setPlans(data || []);
    }
  };

  const fetchSubjects = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id);
    setSubjects(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("study_plans").insert({
      ...formData,
      user_id: user.id,
      due_date: formData.due_date.toISOString(),
    });

    if (error) {
      console.error("Error creating plan:", error);
      toast.error("Failed to create study plan");
    } else {
      toast.success("Study plan created!");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        subject_id: "",
        due_date: new Date(),
        priority: "medium",
      });
      fetchPlans();
    }
  };

  const toggleComplete = async (planId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("study_plans")
      .update({ completed: !currentStatus })
      .eq("id", planId);

    if (error) {
      toast.error("Failed to update plan");
    } else {
      toast.success(currentStatus ? "Marked as incomplete" : "Completed! 🎉");
      fetchPlans();
    }
  };

  const getDaysPlans = (date: Date) => {
    return plans.filter(plan => {
      const planDate = new Date(plan.due_date);
      return format(planDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-destructive";
      case "medium": return "text-primary";
      case "low": return "text-muted-foreground";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Study Planner</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Plan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Task title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject (optional)" />
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
                <div>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    type="datetime-local"
                    value={format(formData.due_date, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setFormData({ ...formData, due_date: new Date(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Create Plan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Plans for selected date */}
          <Card>
            <CardHeader>
              <CardTitle>Plans for {format(selectedDate, "MMM dd, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getDaysPlans(selectedDate).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No plans for this date
                  </p>
                ) : (
                  getDaysPlans(selectedDate).map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-lg border ${
                        plan.completed ? "bg-muted opacity-60" : "bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${plan.completed ? "line-through" : ""}`}>
                              {plan.title}
                            </h3>
                            <span className={`text-xs ${getPriorityColor(plan.priority)}`}>
                              {plan.priority}
                            </span>
                          </div>
                          {plan.subjects && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {plan.subjects.name}
                            </p>
                          )}
                          {plan.description && (
                            <p className="text-sm mt-2">{plan.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(plan.due_date), "h:mm a")}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComplete(plan.id, plan.completed)}
                        >
                          <CheckCircle2 className={`h-5 w-5 ${plan.completed ? "text-primary" : ""}`} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* All upcoming plans */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>All Upcoming Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plans.filter(p => !p.completed).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No upcoming tasks. Create one to get started!
                  </p>
                ) : (
                  plans.filter(p => !p.completed).map((plan) => (
                    <div
                      key={plan.id}
                      className="p-4 rounded-lg border bg-card flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{plan.title}</h3>
                          <span className={`text-xs ${getPriorityColor(plan.priority)}`}>
                            {plan.priority}
                          </span>
                        </div>
                        {plan.subjects && (
                          <p className="text-sm text-muted-foreground">{plan.subjects.name}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {format(new Date(plan.due_date), "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComplete(plan.id, plan.completed)}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudyPlanner;