function Home({ onOpen, favs, toggleFav, tab, setTab }) {
  const { SearchField, SectionHeader, CategoryTile, FoodCard, BottomNav, IconButton, Icon } = DS;
  const [cat, setCat] = React.useState('Sushi');
  return (
    <Phone>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px 110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}><Icon name="map-pin" size={14} color="var(--accent)" />Tokyo</span>
          <IconButton icon="bell" size={36} label="Notifications" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-display)', lineHeight: 1, letterSpacing: 'var(--tracking-display)' }}>JAPAN EATERIES</div>
          <div style={{ fontSize: 'var(--text-micro)', fontWeight: 800, letterSpacing: 'var(--tracking-label)', color: 'var(--text-secondary)' }}>LOCAL TIME</div>
          <div style={{ fontSize: 'var(--text-small)', fontWeight: 800, fontVariantNumeric: 'tabular-nums', display: 'inline-flex', gap: 5, alignItems: 'center' }}><Icon name="clock" size={13} />10:52 AM</div>
        </div>
        <SearchField style={{ marginTop: 20 }} trailingIcon="sliders-horizontal" />
        <SectionHeader title="Browse by Food" style={{ marginTop: 24 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          {CATS.map(c => <CategoryTile key={c} label={c} selected={c === cat} onClick={() => setCat(c)} />)}
        </div>
        <SectionHeader title="Recommendation" style={{ marginTop: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {FOODS.map(x => <FoodCard key={x.id} name={x.name} location={x.location} price={x.price} rating={x.rating}
            favorite={favs.includes(x.id)} onFavorite={() => toggleFav(x.id)} onClick={() => onOpen(x)} />)}
        </div>
      </div>
      <BottomNav active={tab} onChange={setTab} style={{ position: 'absolute', left: 24, right: 24, bottom: 22 }} />
    </Phone>
  );
}
window.Home = Home;
