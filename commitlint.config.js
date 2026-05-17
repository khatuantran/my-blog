// Enforce Conventional Commits — xem CLAUDE.md §Commit Convention
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'refactor',
        'test',
        'chore',
        'style',
        'perf',
        'build',
        'ci',
        'revert',
      ],
    ],
    'subject-case': [0], // allow Vietnamese subject — không enforce case
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0], // long body OK
  },
};
