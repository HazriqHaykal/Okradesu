const DS = window.__DS();

function Phone({ children, bg = 'var(--gradient-hero)' }) {
  return (
    <div style={{ width: 375, height: 790, borderRadius: 'var(--radius-device)', background: bg, boxShadow: '0 30px 60px rgba(30,26,22,.16)',
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
      <div style={{ height: 44, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 28px',
        fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 2 }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 5 }}><DS.Icon name="signal" size={15} /><DS.Icon name="wifi" size={15} /><DS.Icon name="battery-full" size={17} /></span>
      </div>
      {children}
    </div>
  );
}

function FoodRender({ w = '100%', h = 120, label = 'Food render', r = 'var(--radius-lg)' }) {
  return (
    <div style={{ width: w, height: h, borderRadius: r, background: 'repeating-linear-gradient(135deg, var(--orange-150) 0 10px, var(--orange-200) 10px 11px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
      letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--orange-700)' }}>{label}</div>
  );
}

const FOODS = [
  { id: 'udon', name: 'Udon', location: 'Tokyo', price: '¥980', rating: 4.8, restaurant: 'Menya Kaito', range: '¥800–1,200',
    desc: 'Thick wheat noodles in a hot kombu and bonito broth, topped with scallion and a slice of kamaboko. Ask for tempura flakes on the side.' },
  { id: 'oden', name: 'Oden', location: 'Osaka', price: '¥1,200', rating: 4.6, restaurant: 'Suzuki', range: '¥800–1,500',
    desc: 'A comforting winter one-pot: daikon, boiled eggs, konnyaku and fish cakes simmered for hours in a light soy-dashi broth. Best with karashi mustard.' },
  { id: 'sushi', name: 'Sushi', location: 'Tokyo', price: '¥2,400', rating: 4.9, restaurant: 'Sushi Hana', range: '¥1,800–3,000',
    desc: 'Nigiri and maki rolls made to order at the counter. The salmon and tamago sets are the local favorites.' },
  { id: 'yakitori', name: 'Yakitori', location: 'Kyoto', price: '¥1,100', rating: 4.7, restaurant: 'Torikizoku', range: '¥900–1,400',
    desc: 'Chicken skewers grilled over binchotan charcoal, brushed with tare or finished with salt.' },
];
const CATS = ['Ramen', 'Sushi', 'Yakitori', 'Onigiri', 'Mochi'];

Object.assign(window, { DS, Phone, FoodRender, FOODS, CATS });
