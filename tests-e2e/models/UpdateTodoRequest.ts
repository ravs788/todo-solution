export interface UpdateTodoRequest {
  id: number;
  title?: string;
  activityType?: "regular" | "definite";
  startDate?: string;
  completed?: boolean;
  endDate?: string;
}
