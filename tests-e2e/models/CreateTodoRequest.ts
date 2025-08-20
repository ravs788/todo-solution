export interface CreateTodoRequest {
  title: string;
  activityType: "regular" | "definite";
  startDate?: string; // YYYY-MM-DDTHH:mm
  completed?: boolean;
  endDate?: string;
}
