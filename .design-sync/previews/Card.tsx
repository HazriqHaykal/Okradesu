import { Badge, Card, Colors, Divider, Txt, type BadgeTone } from '@okradesu/ui';

const buyers: [string, string, string, BadgeTone][] = [
  ['Izakaya Tanpopo', 'Restaurant · 12 kg · Mon & Thu', 'Confirmed', 'success'],
  ['Kawabe Pickles', 'Processor · 30 kg overgrown pods', 'Offer sent', 'accent'],
  ['Shokudo Asahi', 'Restaurant · 5 kg · Fridays', 'Pending', 'accent'],
];

/** A white card holding a short list, as used for buyers and batches. */
export const BuyerList = () => (
  <Card style={{ width: 340, paddingHorizontal: 16, paddingVertical: 4 }}>
    {buyers.map(([name, detail, status, tone], i) => (
      <div key={name}>
        {i > 0 ? <Divider /> : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Txt variant="bodyLg" weight={800}>
              {name}
            </Txt>
            <Txt variant="small" color={Colors.textSecondary}>
              {detail}
            </Txt>
          </div>
          <Badge label={status} tone={tone} />
        </div>
      </div>
    ))}
  </Card>
);

/** A padded card with one message. */
export const Simple = () => (
  <Card style={{ width: 340, padding: 16, gap: 8 }}>
    <Txt variant="heading">Row 2 · Plant 3</Txt>
    <Txt variant="body" color={Colors.textBody}>
      3 pods are 8–10 cm and ready now. Pick before 14:00, or they turn tough by tomorrow.
    </Txt>
  </Card>
);
