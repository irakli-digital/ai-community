import { visit } from 'unist-util-visit';

const COLORS = ['yellow', 'green', 'blue', 'red', 'purple'] as const;
type MarkColor = (typeof COLORS)[number];

/**
 * Remark plugin that converts ==text== syntax to <mark> HTML elements.
 *
 * Supports optional color prefix:
 *   ==text==           → default highlight (terracotta tint)
 *   ==yellow:text==    → yellow highlight
 *   ==red:text==       → red highlight
 *   ==blue:text==      → blue highlight
 *   ==green:text==     → green highlight
 *   ==purple:text==    → purple highlight
 */
export default function remarkMark() {
  const colorPattern = COLORS.join('|');
  // Matches ==text== or ==color:text==
  const regex = new RegExp(`==(?:(${colorPattern}):)?(.+?)==`, 'g');

  return (tree: any) => {
    visit(tree, 'text', (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) return;

      const value = node.value as string;
      if (!value.includes('==')) return;

      regex.lastIndex = 0;
      if (!regex.test(value)) return;

      regex.lastIndex = 0;

      const children: any[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(value)) !== null) {
        // Text before the match
        if (match.index > lastIndex) {
          children.push({
            type: 'text',
            value: value.slice(lastIndex, match.index),
          });
        }

        const color = match[1] as MarkColor | undefined;
        const text = match[2];
        const cls = color ? ` class="mark-${color}"` : '';

        children.push({
          type: 'html',
          value: `<mark${cls}>${text}</mark>`,
        });

        lastIndex = match.index + match[0].length;
      }

      // Remaining text after last match
      if (lastIndex < value.length) {
        children.push({
          type: 'text',
          value: value.slice(lastIndex),
        });
      }

      parent.children.splice(index, 1, ...children);
    });
  };
}
