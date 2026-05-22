// lint-staged config — chuyển từ package.json sang đây để filter được design-file/.
// design-file/ là prototype tham khảo (eslint đã ignore trong eslint.config.mjs):
// loại khỏi mọi task lint/format khi commit để không trip --max-warnings=0.

const stripDesignFile = (files) =>
  files.filter((f) => !f.replace(/\\/g, '/').includes('/design-file/'));

const quote = (files) => files.map((f) => `"${f}"`).join(' ');

export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': (files) => {
    const target = stripDesignFile(files);
    if (target.length === 0) return [];
    return [`eslint --fix --max-warnings=0 ${quote(target)}`, `prettier --write ${quote(target)}`];
  },
  '*.{json,md,yaml,yml,css}': (files) => {
    const target = stripDesignFile(files);
    if (target.length === 0) return [];
    return [`prettier --write ${quote(target)}`];
  },
};
