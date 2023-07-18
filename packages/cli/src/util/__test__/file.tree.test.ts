import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FileTree } from '../file.tree.js';

function setToList(s?: Set<string>): string[] {
  if (s == null || s.size === 0) return [];
  return [...s.values()];
}

function list(tree: FileTree, path: string): string[] {
  return setToList(tree.nodes.get(path));
}

describe('FileTree', () => {
  it('should add a deep path', async () => {
    const tree = new FileTree(null as any);

    tree.addFile('foo/bar/baz.tiff');

    assert.deepEqual(list(tree, '/'), ['/foo/']);
    assert.deepEqual(list(tree, '/foo/'), ['/foo/bar/']);
    assert.deepEqual(list(tree, '/foo/bar/'), ['/foo/bar/baz.tiff']);
  });

  it('should add a multiple paths', async () => {
    const tree = new FileTree(null as any);

    tree.addFile('foo/bar/baz.tiff');
    tree.addFile('foo/bar/bazB.tiff');
    tree.addFile('foo/baz/bar.tiff');
    tree.addFile('foo/baz/barB.tiff');

    assert.deepEqual(list(tree, '/'), ['/foo/']);
    assert.deepEqual(list(tree, '/foo/'), ['/foo/bar/', '/foo/baz/']);
    assert.deepEqual(list(tree, '/foo/bar/'), ['/foo/bar/baz.tiff', '/foo/bar/bazB.tiff']);
  });

  it('should default root paths', () => {
    const tree = new FileTree(null as any);

    tree.addFile('foo.tiff');
    assert.deepEqual(list(tree, '/'), ['/foo.tiff']);
  });

  it('should add root paths', () => {
    const tree = new FileTree(null as any);

    tree.addFile('/foo.tiff');
    tree.addFile('foo.tiff');
    assert.deepEqual(list(tree, '/'), ['/foo.tiff']);
  });
});
