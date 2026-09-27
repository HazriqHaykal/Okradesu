/**
 * The signed-in farmer. Placeholder until LINE login fills it in.
 */
export const FARMER = {
  name: 'Sato',
  honorific: 'san',
  initials: 'S',
  area: 'Hinode',
};

export const displayName = () => `${FARMER.name}-${FARMER.honorific}`;

export function greeting(hour: number) {
  if (hour >= 5 && hour < 11) return 'Good morning';
  if (hour >= 11 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}
