function Welcome({ onStart }) {
  const { Button } = DS;
  return (
    <Phone>
      <div style={{ flex: 1, position: 'relative', padding: '8px 24px 0' }}>
        <div style={{ position: 'absolute', left: 20, top: 10 }}><FoodRender w={170} h={150} label="Ramen bowl" r="50%" /></div>
        <div style={{ position: 'absolute', right: 20, top: 40 }}><FoodRender w={140} h={120} label="Sushi board" /></div>
        <div style={{ position: 'absolute', left: 80, top: 190 }}><FoodRender w={200} h={150} label="Katsu bento" /></div>
      </div>
      <div style={{ padding: '0 32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-display-xl)', lineHeight: 1,
          letterSpacing: 'var(--tracking-display)', textTransform: 'uppercase', textWrap: 'balance' }}>Leave your Japan tastes to us</h1>
        <p style={{ margin: 0, fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--text-secondary)', maxWidth: 280 }}>
          Find the dishes you came to Japan for, from ramen stalls to hidden izakaya, and we'll get you there.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 12 }}>
          <Button size="lg" block onClick={onStart}>Get started</Button>
          <Button size="lg" variant="secondary" block onClick={onStart}>Log in</Button>
        </div>
      </div>
    </Phone>
  );
}
window.Welcome = Welcome;
