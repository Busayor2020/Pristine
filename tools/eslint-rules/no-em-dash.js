/**
 * Fails on U+2014 EM DASH anywhere in a source file, including comments,
 * string literals and JSX text.
 *
 * House style: an em dash is always replaceable by a period, comma, colon or
 * parenthesis, and the replacement is more explicit about what the clause is
 * doing. A hyphen is not an acceptable substitute, so this rule deliberately
 * offers no autofix. The author has to pick the right punctuation.
 */

// Built from its code point on purpose. The literal character must never
// appear in this repo, and that includes the rule that bans it.
const EM_DASH = String.fromCharCode(0x2014);

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow the em dash. Use a period, comma, colon or parenthesis instead.',
    },
    schema: [],
    messages: {
      emDash:
        'Em dash found. Replace it with a period, comma, colon or parenthesis (not a hyphen).',
    },
  },
  create(context) {
    return {
      Program() {
        const source = context.sourceCode ?? context.getSourceCode();
        const text = source.getText();

        for (
          let index = text.indexOf(EM_DASH);
          index !== -1;
          index = text.indexOf(EM_DASH, index + 1)
        ) {
          context.report({
            messageId: 'emDash',
            loc: {
              start: source.getLocFromIndex(index),
              end: source.getLocFromIndex(index + 1),
            },
          });
        }
      },
    };
  },
};

export default rule;
