import { Submission } from "./GameSession";

export interface SettingDefinition {
  key: string;
  type: "boolean" | "number" | "string" | "select";
  label: string;
  default: unknown;
  options?: { label: string; value: unknown }[];
  min?: number;
  max?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface ComputedResult {
  scores: { userId: string; points: number }[];
  data: Record<string, unknown>;
}

export interface GameAdapter {
  slug: string;
  name: string;
  settingsSchema: SettingDefinition[];

  validateSettings(settings: Record<string, unknown>): ValidationResult;
  validateSubmission(submission: unknown): ValidationResult;
  computeResults(
    roundContent: Record<string, unknown>,
    submissions: Submission[],
    config: Record<string, unknown>
  ): ComputedResult;
}
