# Package Format

Muthur packages are optional, self-contained modules that extend terminal
functionality without affecting core operation.

## Manifest

Every package must include a `manifest.json` at its root with the following
required fields:

| Field     | Type   | Description                              |
|-----------|--------|------------------------------------------|
| id        | string | Unique identifier (lowercase, hyphens)   |
| name      | string | Human-readable display name              |
| version   | string | Semver version string                    |
| type      | string | Package type (see allowed types below)   |

### Optional fields

| Field       | Type     | Description                            |
|-------------|----------|----------------------------------------|
| description | string   | Short summary of what the package does |
| author      | string   | Package author                         |
| license     | string   | License identifier                     |
| entrypoint  | string   | Relative path to main module           |
| dependencies| string[] | List of package IDs this depends on    |

## Allowed package types

| Type        | Purpose                                   |
|-------------|-------------------------------------------|
| theme       | Visual themes and color schemes           |
| keyboard    | Keyboard layout definitions               |
| sound       | Audio/sound packs                         |
| widget      | Terminal widgets and panels                |
| command     | Additional CLI commands                   |
| data        | Static data files and datasets            |

Any type not in this list is rejected during manifest validation.

## ID format

Package IDs must:
- Be lowercase
- Use only alphanumeric characters and hyphens
- Start with a letter
- Be between 2 and 64 characters

## Example manifest

```json
{
  "id": "retro-amber-theme",
  "name": "Retro Amber Theme",
  "version": "1.0.0",
  "type": "theme",
  "description": "Amber CRT color scheme",
  "author": "MUTHUR Development",
  "license": "MIT"
}
```

## Validation

Manifests are validated at load time. A package with a missing required field,
invalid ID format, or unknown type will be rejected with a clear error message.

No network, GUI, AI, or cloud access is required for package validation.
