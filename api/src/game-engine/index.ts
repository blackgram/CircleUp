export { gameEngine } from "./GameEngine";

// Register all game adapters
import { gameEngine } from "./GameEngine";
import { mostLikelyToAdapter } from "./adapters";

gameEngine.register(mostLikelyToAdapter);
