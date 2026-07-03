import { readMuthurStatus, renderMuthurStatus } from '../../core/status';

export function runStatusCommand(): number {
  console.log(renderMuthurStatus(readMuthurStatus()));
  return 0;
}
