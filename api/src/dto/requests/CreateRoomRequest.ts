export interface CreateRoomRequest {
  gameSlug: string;
  maxPlayers: number;
  privateRoom: boolean;
}
