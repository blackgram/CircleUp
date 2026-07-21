export interface GameResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  minPlayers: number;
  maxPlayers: number;
  enabled: boolean;
}
