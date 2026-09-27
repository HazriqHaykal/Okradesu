import { Colors, LegendSwatch, Palette } from '@okradesu/ui';

/** The harvest map legend. */
export const HarvestLegend = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
    <LegendSwatch color={Colors.danger} label="Must pick" />
    <LegendSwatch color={Colors.accent} label="Ready" />
    <LegendSwatch color={Colors.successFg} label="Picked" />
    <LegendSwatch color={Colors.surfaceSunken} label="Not yet" outlined />
  </div>
);

/** The sales chart legend. */
export const SalesLegend = () => (
  <div style={{ display: 'flex', gap: 16 }}>
    <LegendSwatch color={Colors.success} label="Sold ahead" />
    <LegendSwatch color={Palette.orange300} label="Not yet matched" />
  </div>
);
