import noEmDash from './no-em-dash.js';

/**
 * Local ESLint plugin. Not published: referenced directly from the flat config
 * at the repo root.
 */
const plugin = {
  meta: {
    name: 'pristine',
    version: '0.0.0',
  },
  rules: {
    'no-em-dash': noEmDash,
  },
};

export default plugin;
