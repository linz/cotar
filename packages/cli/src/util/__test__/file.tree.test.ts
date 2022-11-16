import o from 'ospec';
import { FileTree } from '../file.tree.js';

function setToList(s?: Set<string>): string[] {
  if (s == null || s.size === 0) return [];
  return [...s.values()];
}

function list(tree: FileTree, path: string): string[] {
  return setToList(tree.nodes.get(path));
}

o.spec('FileTree', () => {
  o('should add a deep path', async () => {
    const tree = new FileTree(null as any);

    tree.addFile('foo/bar/baz.tiff');

    o(list(tree, '/')).deepEquals(['/foo/']);
    o(list(tree, '/foo/')).deepEquals(['/foo/bar/']);
    o(list(tree, '/foo/bar/')).deepEquals(['/foo/bar/baz.tiff']);
  });

  o('should add a multiple paths', async () => {
    const tree = new FileTree(null as any);

    tree.addFile('foo/bar/baz.tiff');
    tree.addFile('foo/bar/bazB.tiff');
    tree.addFile('foo/baz/bar.tiff');
    tree.addFile('foo/baz/barB.tiff');

    o(list(tree, '/')).deepEquals(['/foo/']);
    o(list(tree, '/foo/')).deepEquals(['/foo/bar/', '/foo/baz/']);
    o(list(tree, '/foo/bar/')).deepEquals(['/foo/bar/baz.tiff', '/foo/bar/bazB.tiff']);
  });

  o('should add root paths', () => {
    const tree = new FileTree(null as any);

    tree.addFile('foo.tiff');
    o(list(tree, '/')).deepEquals(['/foo.tiff']);
  });

  o('should add root paths', () => {
    const tree = new FileTree(null as any);

    tree.addFile('/foo.tiff');
    tree.addFile('foo.tiff');
    o(list(tree, '/')).deepEquals(['/foo.tiff']);
  });
});
