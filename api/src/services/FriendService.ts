import { friendshipRepository } from "../repositories/FriendshipRepository";
import { userRepository } from "../repositories/UserRepository";
import { FriendshipStatus } from "../enums";
import { FriendResponse, FriendRequestResponse } from "../dto/responses";
import { IFriendship } from "../models/Friendship";
import { notificationService } from "./NotificationService";

export class FriendService {
  async listFriends(userId: string): Promise<FriendResponse[]> {
    const friendships = await friendshipRepository.findFriends(userId);
    return this.toFriendResponses(userId, friendships);
  }

  async sendRequest(requesterId: string, recipientId: string): Promise<void> {
    if (requesterId === recipientId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const recipient = await userRepository.findById(recipientId);
    if (!recipient) {
      throw new Error("User not found");
    }

    const existing = await friendshipRepository.findBetweenUsers(requesterId, recipientId);
    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new Error("Already friends");
      }
      if (existing.status === FriendshipStatus.PENDING) {
        throw new Error("Friend request already pending");
      }
      if (existing.status === FriendshipStatus.BLOCKED) {
        throw new Error("Cannot send request");
      }
    }

    await friendshipRepository.create(requesterId, recipientId);

    const requester = await userRepository.findById(requesterId);
    if (requester) {
      await notificationService.notifyFriendRequest(recipientId, requester.displayName, requesterId);
    }
  }

  async acceptRequest(userId: string, friendshipId: string): Promise<void> {
    const friendship = await friendshipRepository.findById(friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    if (friendship.recipientId !== userId) {
      throw new Error("Not authorized to accept this request");
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new Error("Request is no longer pending");
    }

    await friendshipRepository.updateStatus(friendshipId, FriendshipStatus.ACCEPTED);

    const accepter = await userRepository.findById(userId);
    if (accepter) {
      await notificationService.notifyFriendAccepted(friendship.requesterId, accepter.displayName, userId);
    }
  }

  async rejectRequest(userId: string, friendshipId: string): Promise<void> {
    const friendship = await friendshipRepository.findById(friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    if (friendship.recipientId !== userId) {
      throw new Error("Not authorized to reject this request");
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new Error("Request is no longer pending");
    }

    await friendshipRepository.updateStatus(friendshipId, FriendshipStatus.REJECTED);
  }

  async removeFriend(userId: string, friendshipId: string): Promise<void> {
    const friendship = await friendshipRepository.findById(friendshipId);
    if (!friendship) {
      throw new Error("Friendship not found");
    }

    if (friendship.requesterId !== userId && friendship.recipientId !== userId) {
      throw new Error("Not authorized");
    }

    await friendshipRepository.deleteById(friendshipId);
  }

  async getPendingRequests(userId: string): Promise<FriendRequestResponse[]> {
    const [received, sent] = await Promise.all([
      friendshipRepository.findPendingReceived(userId),
      friendshipRepository.findPendingSent(userId),
    ]);

    const responses: FriendRequestResponse[] = [];

    for (const f of received) {
      const user = await userRepository.findById(f.requesterId);
      if (user) {
        responses.push({
          id: f.id,
          type: "incoming",
          displayName: user.displayName,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: f.createdAt,
        });
      }
    }

    for (const f of sent) {
      const user = await userRepository.findById(f.recipientId);
      if (user) {
        responses.push({
          id: f.id,
          type: "outgoing",
          displayName: user.displayName,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          createdAt: f.createdAt,
        });
      }
    }

    return responses;
  }

  private async toFriendResponses(userId: string, friendships: IFriendship[]): Promise<FriendResponse[]> {
    const responses: FriendResponse[] = [];

    for (const f of friendships) {
      const friendId = f.requesterId === userId ? f.recipientId : f.requesterId;
      const user = await userRepository.findById(friendId);
      if (user) {
        responses.push({
          id: f.id,
          displayName: user.displayName,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          status: f.status,
        });
      }
    }

    return responses;
  }
}

export const friendService = new FriendService();
