export const ALLOWED_PACKAGE_TYPES = [
  'theme',
  'keyboard',
  'sound',
  'widget',
  'command',
  'data',
] as const;

export type PackageType = (typeof ALLOWED_PACKAGE_TYPES)[number];

export interface PackageManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly type: PackageType;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  readonly entrypoint?: string;
  readonly dependencies?: string[];
}

export interface ManifestValidationOk {
  readonly ok: true;
  readonly manifest: PackageManifest;
}

export interface ManifestValidationError {
  readonly ok: false;
  readonly errors: string[];
}

export type ManifestValidationResult = ManifestValidationOk | ManifestValidationError;

const ID_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;

export function validatePackageManifest(raw: unknown): ManifestValidationResult {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ['Manifest must be a JSON object.'] };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== 'string' || !obj.id) {
    errors.push("Required field 'id' must be a non-empty string.");
  } else if (!ID_PATTERN.test(obj.id)) {
    errors.push(
      `Invalid id '${obj.id}': must be lowercase, start with a letter, use only [a-z0-9-], 2-64 chars.`
    );
  }

  if (typeof obj.name !== 'string' || !obj.name) {
    errors.push("Required field 'name' must be a non-empty string.");
  }

  if (typeof obj.version !== 'string' || !obj.version) {
    errors.push("Required field 'version' must be a non-empty string.");
  }

  if (typeof obj.type !== 'string' || !obj.type) {
    errors.push("Required field 'type' must be a non-empty string.");
  } else if (!(ALLOWED_PACKAGE_TYPES as readonly string[]).includes(obj.type)) {
    errors.push(
      `Unknown package type '${obj.type}'. Allowed: ${ALLOWED_PACKAGE_TYPES.join(', ')}.`
    );
  }

  if (obj.description !== undefined && typeof obj.description !== 'string') {
    errors.push("Optional field 'description' must be a string if present.");
  }

  if (obj.author !== undefined && typeof obj.author !== 'string') {
    errors.push("Optional field 'author' must be a string if present.");
  }

  if (obj.license !== undefined && typeof obj.license !== 'string') {
    errors.push("Optional field 'license' must be a string if present.");
  }

  if (obj.entrypoint !== undefined && typeof obj.entrypoint !== 'string') {
    errors.push("Optional field 'entrypoint' must be a string if present.");
  }

  if (obj.dependencies !== undefined) {
    if (!Array.isArray(obj.dependencies)) {
      errors.push("Optional field 'dependencies' must be an array if present.");
    } else if (!obj.dependencies.every((d: unknown) => typeof d === 'string')) {
      errors.push("All entries in 'dependencies' must be strings.");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    manifest: {
      id: obj.id as string,
      name: obj.name as string,
      version: obj.version as string,
      type: obj.type as PackageType,
      ...(obj.description !== undefined && { description: obj.description as string }),
      ...(obj.author !== undefined && { author: obj.author as string }),
      ...(obj.license !== undefined && { license: obj.license as string }),
      ...(obj.entrypoint !== undefined && { entrypoint: obj.entrypoint as string }),
      ...(obj.dependencies !== undefined && { dependencies: obj.dependencies as string[] }),
    },
  };
}
