import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { format, isPast, isFuture, differenceInDays } from "date-fns";

interface StudyPlan {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: string;
  completed: boolean;
  subjects?: {
    name: string;
  } | null;
}

interface PendingWorkReportProps {
  plans: StudyPlan[];
}

export const PendingWorkReport = ({ plans }: PendingWorkReportProps) => {
  const now = new Date();
  
  const incompleteTasks = plans.filter(p => !p.completed && isFuture(new Date(p.due_date)));
  const overdueTasks = plans.filter(p => !p.completed && isPast(new Date(p.due_date)));
  const upcomingToday = incompleteTasks.filter(p => 
    differenceInDays(new Date(p.due_date), now) === 0
  );
  const upcomingThisWeek = incompleteTasks.filter(p => {
    const days = differenceInDays(new Date(p.due_date), now);
    return days > 0 && days <= 7;
  });

  const highPriorityTasks = incompleteTasks.filter(p => p.priority === 'high');

  const renderTaskList = (tasks: StudyPlan[], title: string, icon: React.ReactNode) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          <span>{title} ({tasks.length})</span>
        </div>
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="p-3 rounded-lg border bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  {task.subjects && (
                    <p className="text-xs text-muted-foreground mt-1">{task.subjects.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={
                      task.priority === 'high' ? 'destructive' : 
                      task.priority === 'medium' ? 'default' : 
                      'secondary'
                    } className="text-xs">
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Due: {format(new Date(task.due_date), "MMM dd, h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Work Report</CardTitle>
        <p className="text-sm text-muted-foreground">
          Your comprehensive task overview
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-muted/50">
            <p className="text-2xl font-bold">{incompleteTasks.length}</p>
            <p className="text-xs text-muted-foreground">Pending Tasks</p>
          </div>
          <div className="p-4 rounded-lg border bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{overdueTasks.length}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
          <div className="p-4 rounded-lg border bg-primary/10">
            <p className="text-2xl font-bold text-primary">{upcomingToday.length}</p>
            <p className="text-xs text-muted-foreground">Due Today</p>
          </div>
          <div className="p-4 rounded-lg border bg-secondary">
            <p className="text-2xl font-bold">{highPriorityTasks.length}</p>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </div>
        </div>

        {/* Overdue Tasks */}
        {renderTaskList(
          overdueTasks,
          "Overdue Tasks",
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}

        {/* Due Today */}
        {renderTaskList(
          upcomingToday,
          "Due Today",
          <Clock className="h-4 w-4 text-primary" />
        )}

        {/* This Week */}
        {renderTaskList(
          upcomingThisWeek,
          "Due This Week",
          <CalendarIcon className="h-4 w-4 text-secondary-foreground" />
        )}

        {/* High Priority */}
        {renderTaskList(
          highPriorityTasks,
          "High Priority Tasks",
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}

        {incompleteTasks.length === 0 && overdueTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg">🎉 All caught up!</p>
            <p className="text-sm mt-2">No pending tasks at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
