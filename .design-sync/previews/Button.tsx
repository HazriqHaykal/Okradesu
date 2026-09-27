import { Button, Icons } from '@okradesu/ui';

const row = { display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' } as const;

/** The main variants. Labels on orange stay ink. */
export const Variants = () => (
  <div style={row}>
    <Button label="Start picking" icon={Icons.ListChecks} />
    <Button label="Log in with LINE" variant="secondary" />
    <Button label="See all 6" variant="ghost" icon={Icons.ChevronDown} />
  </div>
);

/** Surface buttons sit on the orange hero card. */
export const OnHeroCard = () => (
  <div
    style={{
      width: 340,
      padding: 20,
      borderRadius: 22,
      background: '#F29A1E',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
    <Button label="Start harvest" variant="surface" icon={Icons.ArrowRight} block />
  </div>
);

/** Small, medium and large. */
export const Sizes = () => (
  <div style={row}>
    <Button label="Accept" size="sm" />
    <Button label="Apply to fans" size="md" />
    <Button label="Get started" size="lg" />
  </div>
);

/** Full width, and disabled when there is nothing left to do. */
export const BlockAndDisabled = () => (
  <div style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <Button label="Offer 78 kg to buyers" icon={Icons.Store} block />
    <Button label="All picked" icon={Icons.ListChecks} block disabled />
  </div>
);
