import { Notification, INotification } from "../models/Notification";

export class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    return Notification.create(data);
  }

  async findById(id: string): Promise<INotification | null> {
    return Notification.findById(id);
  }

  async findByUser(userId: string, page: number = 1, limit: number = 20): Promise<INotification[]> {
    return Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async findUnread(userId: string, limit: number = 20): Promise<INotification[]> {
    return Notification.find({ userId, read: false })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async countUnread(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, read: false });
  }

  async markRead(id: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(id, { read: true, readAt: new Date() }, { new: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, read: false }, { read: true, readAt: new Date() });
  }

  async deleteById(id: string): Promise<void> {
    await Notification.findByIdAndDelete(id);
  }

  async deleteAllByUser(userId: string): Promise<void> {
    await Notification.deleteMany({ userId });
  }
}

export const notificationRepository = new NotificationRepository();
