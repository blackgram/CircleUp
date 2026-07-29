import { GameAdapter, SettingDefinition, ValidationResult, ComputedResult } from "../../types";
import { Submission } from "../../types/GameSession";

export const mostLikelyToAdapter: GameAdapter = {
  slug: "m-l-t",
  name: "Most Likely To",
  settingsSchema: [
    {
      key: "timeLimit",
      type: "number",
      label: "Time per Round (seconds)",
      default: 30,
      min: 10,
      max: 120,
    },
    {
      key: "anonymous",
      type: "boolean",
      label: "Anonymous Voting",
      default: false,
    },
  ] as SettingDefinition[],

  validateSettings(settings: Record<string, unknown>): ValidationResult {
    const timeLimit = settings.timeLimit as number | undefined;
    if (timeLimit !== undefined && (timeLimit < 10 || timeLimit > 120)) {
      return { valid: false, errors: ["timeLimit must be between 10 and 120 seconds"] };
    }
    return { valid: true };
  },

  validateSubmission(submission: unknown): ValidationResult {
    const payload = submission as Record<string, unknown>;
    if (!payload.votedFor || typeof payload.votedFor !== "string") {
      return { valid: false, errors: ["Must vote for a player (votedFor required)"] };
    }
    return { valid: true };
  },

  computeResults(
    roundContent: Record<string, unknown>,
    submissions: Submission[],
    config: Record<string, unknown>
  ): ComputedResult {
    const anonymous = config.anonymous === true;
    const playerIds = (roundContent.playerIds as string[]) || [];

    // Tally votes
    const tally = new Map<string, { count: number; voters: string[] }>();
    for (const sub of submissions) {
      const votedFor = sub.payload.votedFor as string;
      const entry = tally.get(votedFor) || { count: 0, voters: [] };
      entry.count++;
      entry.voters.push(sub.userId);
      tally.set(votedFor, entry);
    }

    // Build results for ALL players (including those with 0 votes)
    const allResults = playerIds.map((userId) => {
      const entry = tally.get(userId);
      return {
        userId,
        votes: entry?.count || 0,
        voters: anonymous ? undefined : (entry?.voters || []),
      };
    });

    // Sort by votes descending
    allResults.sort((a, b) => b.votes - a.votes);

    // Award 1 point to the top-voted player(s)
    const maxVotes = allResults.length > 0 ? allResults[0].votes : 0;
    const scores: { userId: string; points: number }[] = [];
    if (maxVotes > 0) {
      for (const entry of allResults) {
        if (entry.votes === maxVotes) {
          scores.push({ userId: entry.userId, points: 1 });
        }
      }
    }

    return {
      scores,
      data: {
        question: roundContent.question,
        results: allResults,
        totalVotes: submissions.length,
        anonymous,
      },
    };
  },
};
