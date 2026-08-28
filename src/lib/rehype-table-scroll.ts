/**
 * Markdown の表を、横スクロールできる箱で包む。
 *
 * 表だけは列数しだいでいくらでも広くなる。素のままだと狭い画面で
 * ページ全体に横スクロールが生まれ、本文まで左右にずれてしまう。
 * 包んだ箱の中だけで完結させれば、版面は動かない。
 *
 * 箱には tabindex を付ける。スクロールできる領域はキーボードでも
 * たどり着けないと中身が読めないため。
 */

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

export function rehypeTableScroll() {
  return (tree: HastNode): void => {
    const visit = (node: HastNode): void => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        visit(child);
        if (child.type !== 'element' || child.tagName !== 'table') return child;
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['scroll-x'], tabindex: 0, role: 'region', 'aria-label': '表' },
          children: [child],
        };
      });
    };
    visit(tree);
  };
}
