import { ipcMain } from 'electron';
import { getDB } from '../db/database';
import { ollamaManager } from '../ollama-manager';
import type { Insight } from '../db/types';

const ANALYSIS_SYSTEM_PROMPT = `You are a product analyst for CrewCircle. You analyse application logs, error reports and user feedback, then extract actionable product intelligence. You always respond with valid JSON only, no markdown fences, matching this exact shape:
{"summary": "one paragraph overview", "issues": ["issue 1", "issue 2"], "suggestions": ["suggestion 1", "suggestion 2"]}
Rules: issues = concrete problems found in the input (errors, failures, recurring complaints). suggestions = product design or feature improvements that would address the issues. Keep each item a single sentence. If the input contains no problems, return an empty issues array and suggestions for general improvement.`;

interface AnalysisResult {
  summary: string;
  issues: string[];
  suggestions: string[];
}

interface AnalyzeResponse {
  success: boolean;
  error?: string;
  insight?: Insight;
  result?: AnalysisResult;
}

/** Leniently parse the LLM JSON response, tolerating markdown fences or prose around it. */
function parseAnalysis(raw: string): AnalysisResult | null {
  let text = raw.trim();
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();
  // Extract the outermost JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (!objMatch) return null;

  try {
    const parsed = JSON.parse(objMatch[0]) as Partial<AnalysisResult>;
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.filter((i): i is string => typeof i === 'string')
        : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter((s): s is string => typeof s === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

export function registerInsightsHandlers(): void {
  ipcMain.handle(
    'insights:analyze',
    async (_event, input: { logs: string; source?: string }): Promise<AnalyzeResponse> => {
      if (!input?.logs?.trim()) {
        return { success: false, error: 'No logs provided' };
      }

      const status = await ollamaManager.checkStatus();
      if (!status.running) {
        return {
          success: false,
          error:
            'Ollama is not running. Start Ollama (ollama serve) to analyse logs locally.',
        };
      }

      // Truncate very long log dumps to keep prompts within small-model context
      const logs = input.logs.slice(0, 8000);
      const prompt = `Analyse these logs / feedback entries and respond with JSON only:\n\n${logs}`;

      let raw: string;
      try {
        raw = await ollamaManager.chat(prompt, undefined, {
          system: ANALYSIS_SYSTEM_PROMPT,
          json: true,
        });
      } catch (err) {
        return { success: false, error: `Ollama query failed: ${String(err)}` };
      }

      const result = parseAnalysis(raw);
      if (!result) {
        return {
          success: false,
          error: 'Could not parse analysis from model response',
        };
      }

      const db = getDB();
      const insert = db
        .prepare(
          `INSERT INTO insights (source, input_excerpt, summary, issues, suggestions)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(
          input.source?.trim() || 'manual',
          logs.slice(0, 500),
          result.summary,
          JSON.stringify(result.issues),
          JSON.stringify(result.suggestions)
        );

      const insight = db
        .prepare(`SELECT * FROM insights WHERE id = ?`)
        .get(insert.lastInsertRowid) as Insight;

      return { success: true, insight, result };
    }
  );

  ipcMain.handle('insights:list', async () => {
    const db = getDB();
    return db
      .prepare(`SELECT * FROM insights ORDER BY created_at DESC LIMIT 100`)
      .all() as Insight[];
  });

  ipcMain.handle('insights:delete', async (_event, input: { id: number }) => {
    if (!input?.id) {
      throw new Error('Insight id is required');
    }
    const db = getDB();
    db.prepare(`DELETE FROM insights WHERE id = ?`).run(input.id);
    return { success: true };
  });
}
