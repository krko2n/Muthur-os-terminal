# Plugin Format

Muthur plugins (packages of type `command` or `widget`) may request permissions
to access system resources. Permissions are declared in the package manifest
and validated before the plugin is loaded.

## Permission declaration

Add a `permissions` array to your `manifest.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "type": "command",
  "permissions": ["fs.read", "system.info"]
}
```

## Known permissions

| Permission          | Description                          |
|---------------------|--------------------------------------|
| fs.read             | Read files from disk                 |
| fs.write            | Write files to disk                  |
| fs.delete           | Delete files from disk               |
| process.spawn       | Start child processes                |
| process.signal      | Send signals to processes            |
| net.local           | Connect to local network services    |
| net.outbound        | Make outbound network requests       |
| env.read            | Read environment variables           |
| env.write           | Modify environment variables         |
| clipboard.read      | Read from clipboard                  |
| clipboard.write     | Write to clipboard                   |
| audio.play          | Play audio                           |
| notifications.show  | Show system notifications            |
| system.info         | Read system information              |

## Validation behavior

- If a manifest declares only known permissions, validation passes.
- If a manifest declares any unknown permission, validation fails with
  a list of unrecognized permission names.
- A plugin with no `permissions` field is treated as requesting zero
  permissions (safe by default).

## Display

When a plugin is inspected or loaded, its requested permissions are displayed
in a readable list so the user can review what access is being granted.

## Security notes

- Permission checks are local-only. No network, cloud, or AI is required.
- Permissions are enforced at the package system boundary, not at the
  OS kernel level. They describe what the plugin declares, not what the
  OS sandbox enforces (sandboxing is a future task).
- Unknown permissions are always rejected to prevent typos from silently
  granting unintended access.
