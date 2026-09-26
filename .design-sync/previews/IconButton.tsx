import { IconButton, Icons } from '@okradesu/ui';

const row = { display: 'flex', gap: 12, alignItems: 'center' } as const;

/** White surface buttons for secondary actions; the dot marks unread alerts. */
export const Surface = () => (
  <div style={row}>
    <IconButton icon={Icons.Bell} label="Alerts, 2 new" dot />
    <IconButton icon={Icons.LayoutDashboard} label="Open web dashboard" />
    <IconButton icon={Icons.ChevronLeft} label="Back" />
  </div>
);

/** Orange accent for the one primary icon action, like the pod check camera. */
export const Accent = () => (
  <div style={row}>
    <IconButton icon={Icons.ScanLine} label="Check a pod with the camera" variant="accent" size={48} />
    <IconButton icon={Icons.Send} label="Send question" variant="accent" size={46} />
  </div>
);

/** Sizes from 36 to 52. */
export const Sizes = () => (
  <div style={row}>
    <IconButton icon={Icons.Camera} label="Camera" size={36} />
    <IconButton icon={Icons.Camera} label="Camera" size={44} />
    <IconButton icon={Icons.Camera} label="Camera" size={52} />
  </div>
);
