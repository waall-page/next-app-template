import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

/**
 * ICOフォーマット（PNG埋め込み型マルチアイコン）のバイナリ生成
 */
function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = Icon
  header.writeUInt16LE(images.length, 4); // 画像数

  const entrySize = 16;
  let offset = 6 + entrySize * images.length;

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // パレット色数（0: 256色以上）
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // カラープレーン数
    entry.writeUInt16LE(32, 6); // ビット深度
    entry.writeUInt32LE(img.buffer.length, 8); // バイトサイズ
    entry.writeUInt32LE(offset, 12); // ファイル先頭からのオフセット
    offset += img.buffer.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images.map((img) => img.buffer)]);
}

async function main() {
  console.log('🔄 public/ ディレクトリの SVG をソースとしてアイコンアセットを生成します...');

  const iconSvgPath = path.join(publicDir, 'icon.svg');
  const appleSvgPath = path.join(publicDir, 'apple-icon.svg');

  if (!fs.existsSync(iconSvgPath)) {
    throw new Error(`マスターSVGが見つかりません: ${iconSvgPath}`);
  }
  if (!fs.existsSync(appleSvgPath)) {
    throw new Error(`マスターSVGが見つかりません: ${appleSvgPath}`);
  }

  const iconSvgBuf = fs.readFileSync(iconSvgPath);
  const appleSvgBuf = fs.readFileSync(appleSvgPath);

  // 1. Apple Touch Icon (180x180 PNG)
  console.log('📱 Apple Touch Icon (public/apple-touch-icon.png 180x180) を生成中...');
  const applePng180 = await sharp(appleSvgBuf).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), applePng180);

  // 2. Favicon.ico (マルチサイズ: 16x16, 32x32, 48x48)
  console.log('🌐 Favicon (public/favicon.ico) を生成中...');
  const png16 = await sharp(iconSvgBuf).resize(16, 16).png().toBuffer();
  const png32 = await sharp(iconSvgBuf).resize(32, 32).png().toBuffer();
  const png48 = await sharp(iconSvgBuf).resize(48, 48).png().toBuffer();

  const icoBuf = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

  // 3. PWA / 高解像度 PNG (192x192, 512x512)
  console.log('🖼️ 高解像度 PNG (192x192, 512x512) を生成中...');
  const png192 = await sharp(iconSvgBuf).resize(192, 192).png().toBuffer();
  const png512 = await sharp(iconSvgBuf).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);

  console.log('✅ すべてのアイコンアセットが public/ 配下に正常生成されました！');
}

main().catch((err) => {
  console.error('❌ アイコン生成中にエラーが発生しました:', err);
  process.exit(1);
});
