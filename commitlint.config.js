module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc)
        'refactor', // Code changes that neither fix bugs nor add features
        'perf', // Performance improvements
        'test', // Adding tests
        'chore', // Maintenance tasks
        'ci', // CI/CD related changes
        'build', // Build system changes
        'revert', // Reverting previous commits
      ],
    ],
    'subject-case': [0, 'never'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 500],
  },
};
