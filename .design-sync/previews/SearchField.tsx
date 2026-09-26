import { Icons, SearchField } from '@okradesu/ui';

const box = { width: 340, display: 'flex' } as const;

/** Empty, with a filter icon. */
export const Empty = () => (
  <div style={box}>
    <SearchField
      icon={Icons.Search}
      trailingIcon={Icons.SlidersHorizontal}
      label="Search farms"
      placeholder="Search farms or buildings"
    />
  </div>
);

/** With a typed value. */
export const Filled = () => (
  <div style={box}>
    <SearchField icon={Icons.Search} label="Search farms" defaultValue="Hinode" />
  </div>
);

/** As the advisor's question box. */
export const AskAdvisor = () => (
  <div style={box}>
    <SearchField icon={Icons.MessageCircle} label="Ask the advisor" placeholder="Ask about your farm" />
  </div>
);
