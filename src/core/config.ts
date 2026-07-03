import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface MuthurAiConfig {
  readonly model: string;
  readonly baseUrl: string;
}

export interface MuthurConfig {
  readonly ai: MuthurAiConfig;
}

export interface MuthurConfigLoadOk {
  readonly ok: true;
  readonly path: string;
  readonly exists: boolean;
  readonly config: MuthurConfig;
  readonly sources: readonly string[];
}

export interface MuthurConfigLoadError {
  readonly ok: false;
  readonly path: string;
  readonly error: string;
}

export type MuthurConfigLoadResult = MuthurConfigLoadOk | MuthurConfigLoadError;

const DEFAULT_CONFIG: MuthurConfig = {
  ai: {
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434',
  },
};

function configHome(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME;
  if (xdgConfigHome) return xdgConfigHome;
  return path.join(os.homedir(), '.config');
}

export function resolveMuthurConfigPath(): string {
  const explicitPath = process.env.MUTHUR_CONFIG;
  if (explicitPath) return explicitPath;
  return path.join(configHome(), 'muthur', 'config.json');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(source: Record<string, unknown>, key: string, fallback: string): string {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function mergeConfig(raw: unknown): MuthurConfig {
  if (!isObject(raw)) return DEFAULT_CONFIG;

  const ai = isObject(raw.ai) ? raw.ai : {};
  return {
    ai: {
      model: readString(ai, 'model', DEFAULT_CONFIG.ai.model),
      baseUrl: readString(ai, 'baseUrl', DEFAULT_CONFIG.ai.baseUrl),
    },
  };
}

function applyEnvOverrides(config: MuthurConfig): { config: MuthurConfig; sources: string[] } {
  const sources: string[] = [];
  let ai = config.ai;

  const modelOverride = process.env.MUTHUR_AI_MODEL;
  if (modelOverride) {
    ai = { ...ai, model: modelOverride };
    sources.push('MUTHUR_AI_MODEL');
  }

  const baseUrlOverride = process.env.MUTHUR_AI_BASE_URL;
  if (baseUrlOverride) {
    ai = { ...ai, baseUrl: baseUrlOverride };
    sources.push('MUTHUR_AI_BASE_URL');
  }

  return { config: { ...config, ai }, sources };
}

export function readMuthurConfig(configPath = resolveMuthurConfigPath()): MuthurConfigLoadResult {
  const sources: string[] = ['defaults'];

  if (!fs.existsSync(configPath)) {
    const withEnv = applyEnvOverrides(DEFAULT_CONFIG);
    return {
      ok: true,
      path: configPath,
      exists: false,
      config: withEnv.config,
      sources: [...sources, ...withEnv.sources],
    };
  }

  let rawConfig: unknown;
  try {
    rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    return {
      ok: false,
      path: configPath,
      error: `Malformed config at ${configPath}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const withEnv = applyEnvOverrides(mergeConfig(rawConfig));
  return {
    ok: true,
    path: configPath,
    exists: true,
    config: withEnv.config,
    sources: [...sources, 'file', ...withEnv.sources],
  };
}

export function renderMuthurConfig(result: MuthurConfigLoadResult): string {
  if (!result.ok) {
    return [`Muthur config error`, '', result.error].join('\n');
  }

  return [
    'Muthur config',
    '',
    `Path: ${result.path}`,
    `Status: ${result.exists ? 'loaded' : 'missing, using defaults'}`,
    `Sources: ${result.sources.join(', ')}`,
    '',
    'AI:',
    `  model: ${result.config.ai.model}`,
    `  baseUrl: ${result.config.ai.baseUrl}`,
  ].join('\n');
}
