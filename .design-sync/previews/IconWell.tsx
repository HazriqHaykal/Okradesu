import { Colors, IconWell, Icons } from '@okradesu/ui';

const row = { display: 'flex', gap: 12, alignItems: 'center' } as const;

/** Default orange tint, used for farm and device icons. */
export const Default = () => (
  <div style={row}>
    <IconWell icon={Icons.Tractor} />
    <IconWell icon={Icons.School} />
    <IconWell icon={Icons.Droplets} />
    <IconWell icon={Icons.RadioTower} size={36} radius={10} />
  </div>
);

/** Status colours: success for LINE connected, danger for alerts. */
export const StatusColours = () => (
  <div style={row}>
    <IconWell icon={Icons.MessageCircle} size={48} bg={Colors.successBg} fg={Colors.successFg} />
    <IconWell icon={Icons.TriangleAlert} size={48} bg={Colors.dangerBg} fg={Colors.dangerFg} />
  </div>
);
