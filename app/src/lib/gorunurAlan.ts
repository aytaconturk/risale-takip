import { useUi } from '@/src/store';

// Yalnızca web (iOS PWA): klavye açılınca #root görünür alana sığar (--vvh), sekme çubuğu gizlenir.
export function gorunurAlaniIzle() {
  const vv = window.visualViewport;
  if (!vv) return;
  const guncelle = () => {
    document.documentElement.style.setProperty('--vvh', `${vv.height}px`);
    useUi.getState().klavyeSec(window.innerHeight - vv.height > 120);
    if (vv.offsetTop > 0) window.scrollTo(0, 0); // iOS'un sayfayı yukarı itmesini geri al
  };
  vv.addEventListener('resize', guncelle);
  vv.addEventListener('scroll', guncelle);
  guncelle();
}
