import { NotificationType } from "../../enums";

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  category: "social" | "game" | "system";
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

export interface UnreadNotificationsResponse {
  count: number;
  notifications: NotificationResponse[];
}
