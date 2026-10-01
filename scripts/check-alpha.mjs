import sharp from 'sharp';
async function check() {
  const meta = await sharp('public/newlogo.png').metadata();
  console.log('Channels:', meta.channels, 'Has Alpha:', meta.hasAlpha, 'Format:', meta.format);
}
check();
