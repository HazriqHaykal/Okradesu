function Detail({ food, onBack, fav, toggleFav }) {
  const { IconButton, InfoStat, Button, AvatarStack, Badge } = DS;
  return (
    <Phone>
      <div style={{ padding: '4px 24px 0', display: 'flex', justifyContent: 'space-between' }}>
        <IconButton icon="chevron-left" label="Back" onClick={onBack} />
        <IconButton icon="heart" active={fav} label="Favorite" onClick={toggleFav} />
      </div>
      <div style={{ padding: '12px 40px 0' }}><FoodRender h={230} label={food.name + ' render'} r="var(--radius-xl)" /></div>
      <div style={{ flex: 1, marginTop: 20, background: 'var(--surface-card)', borderRadius: '28px 28px 0 0', padding: '24px 24px 28px',
        display: 'flex', flexDirection: 'column', gap: 16, boxShadow: 'var(--shadow-float)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-title)', fontWeight: 800 }}>{food.name}</span>
          <Badge tone="success" icon="clock">Open now</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '12px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <InfoStat label="Restaurant" value={food.restaurant} />
          <InfoStat label="Price" value={food.range} />
          <InfoStat label="Location" value={food.location} />
        </div>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--ink-700)' }}>{food.desc}</p>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <AvatarStack people={[{ initials: 'AK' }, { initials: 'MS' }, { initials: 'YT' }, { initials: 'RN' }, { initials: 'HS' }]} caption="Visited" />
          <Button size="lg">Let's go eat</Button>
        </div>
      </div>
    </Phone>
  );
}
window.Detail = Detail;
