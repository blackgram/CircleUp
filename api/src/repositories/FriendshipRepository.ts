import { Friendship, IFriendship } from "../models/Friendship";
import { FriendshipStatus } from "../enums";

export class FriendshipRepository {
  async findById(id: string): Promise<IFriendship | null> {
    return Friendship.findById(id);
  }

  async findBetweenUsers(userA: string, userB: string): Promise<IFriendship | null> {
    return Friendship.findOne({
      $or: [
        { requesterId: userA, recipientId: userB },
        { requesterId: userB, recipientId: userA },
      ],
    });
  }

  async findFriends(userId: string): Promise<IFriendship[]> {
    return Friendship.find({
      $or: [{ requesterId: userId }, { recipientId: userId }],
      status: FriendshipStatus.ACCEPTED,
    });
  }

  async findPendingReceived(userId: string): Promise<IFriendship[]> {
    return Friendship.find({
      recipientId: userId,
      status: FriendshipStatus.PENDING,
    });
  }

  async findPendingSent(userId: string): Promise<IFriendship[]> {
    return Friendship.find({
      requesterId: userId,
      status: FriendshipStatus.PENDING,
    });
  }

  async create(requesterId: string, recipientId: string): Promise<IFriendship> {
    return Friendship.create({ requesterId, recipientId, status: FriendshipStatus.PENDING });
  }

  async updateStatus(id: string, status: FriendshipStatus): Promise<IFriendship | null> {
    return Friendship.findByIdAndUpdate(id, { status }, { new: true });
  }

  async deleteById(id: string): Promise<void> {
    await Friendship.findByIdAndDelete(id);
  }
}

export const friendshipRepository = new FriendshipRepository();
