export type MediaItem = { url: string; kind: 'image' | 'video' };
export default function Media({ item, controls = false }: { item?: MediaItem; controls?: boolean }) {
  if (!item) return <img src="/logo.png" alt="" style={{ width: 72, height: 72, borderRadius: '50%', opacity: .5 }} />;
  return item.kind === 'video'
    ? <video src={item.url} controls={controls} muted={!controls} playsInline preload="metadata" />
    : <img src={item.url} alt="" loading="lazy" />;
}
