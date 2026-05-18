import { useEffect, useState } from 'react';

// Braille-frame spinner port từ design-file/MyBlog Feed.html:483-488.
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function AsciiSpinner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setI((n) => (n + 1) % FRAMES.length), 80);
    return () => clearInterval(iv);
  }, []);
  return <span aria-hidden="true">{FRAMES[i]}</span>;
}
