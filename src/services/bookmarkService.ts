import type { SpeedDialItem } from '../types';

export interface BookmarkNode {
  id?: string;
  title?: string;
  url?: string;
  children?: BookmarkNode[];
  dateAdded?: number;
}

export interface BookmarkFolder {
  title: string;
  nodes: BookmarkNode[];
}

function nodeToSpeedDial(node: BookmarkNode, position: number): SpeedDialItem | null {
  if (!node.url) return null;
  return {
    id: crypto.randomUUID(),
    title: node.title || node.url,
    url: node.url,
    position,
    createdAt: new Date(node.dateAdded ?? Date.now()).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function collectBookmarks(nodes: BookmarkNode[], startPosition: number): { items: SpeedDialItem[]; nextPos: number } {
  const items: SpeedDialItem[] = [];
  let pos = startPosition;
  for (const node of nodes) {
    if (node.url) {
      const item = nodeToSpeedDial(node, pos);
      if (item) {
        items.push(item);
        pos++;
      }
    }
    if (node.children && node.children.length > 0) {
      const child = collectBookmarks(node.children, pos);
      items.push(...child.items);
      pos = child.nextPos;
    }
  }
  return { items, nextPos: pos };
}

export async function getBookmarkTree(): Promise<BookmarkFolder[]> {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((tree) => {
      const folders: BookmarkFolder[] = [];
      function walk(nodes: chrome.bookmarks.BookmarkTreeNode[]) {
        for (const node of nodes) {
          if (node.children && node.children.length > 0) {
            folders.push({ title: node.title || '(No title)', nodes: node.children as BookmarkNode[] });
            walk(node.children);
          }
        }
      }
      walk(tree as unknown as chrome.bookmarks.BookmarkTreeNode[]);
      resolve(folders);
    });
  });
}

export function bookmarksToSpeedDial(nodes: BookmarkNode[]): SpeedDialItem[] {
  const { items } = collectBookmarks(nodes, 0);
  return items;
}
