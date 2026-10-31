/**
 * setLike() must be idempotent, exactly as on mobile: it reads the like
 * doc inside the transaction first and writes NOTHING when the state is
 * already right, so a stale "not liked" flag can never create a second
 * like doc or move likeCount twice (the rules would reject it anyway).
 */
import { createFirebaseBackend } from '../services/backend/firebase';

type FakeRef = { path: string; id: string };

const mockTx = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../services/firebase/app', () => ({
  services: () => ({ auth: { currentUser: null }, db: { fake: 'db' }, storage: {} }),
}));

jest.mock('firebase/firestore', () => {
  const ref = (...parts: string[]): FakeRef => ({
    path: parts.join('/'),
    id: parts[parts.length - 1],
  });
  return {
    doc: (base: { path?: string } | object, ...parts: string[]) =>
      'path' in base && base.path ? ref(base.path, ...parts) : ref(...parts),
    collection: (_db: unknown, ...parts: string[]) => ({ path: parts.join('/') }),
    runTransaction: (_db: unknown, fn: (t: typeof mockTx) => unknown) => fn(mockTx),
    increment: (n: number) => ({ op: 'increment', n }),
    serverTimestamp: () => ({ op: 'serverTimestamp' }),
    collectionGroup: jest.fn(),
    deleteField: jest.fn(),
    documentId: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    where: jest.fn(),
    writeBatch: jest.fn(),
  };
});

jest.mock('firebase/storage', () => ({}));
jest.mock('firebase/auth', () => ({ updateProfile: jest.fn() }));

const ME = 'uid-me';
const post = { id: 'post1', authorId: 'uid-author', imageUrl: 'https://img/1.jpg' };

beforeEach(() => {
  jest.clearAllMocks();
});

test('liking an already-liked post writes nothing', async () => {
  mockTx.get.mockResolvedValue({ exists: () => true });
  const backend = createFirebaseBackend(ME);

  const result = await backend.setLike(post, true);

  expect(result).toEqual({ value: true, changed: false });
  expect(mockTx.get).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'posts/post1/likes/uid-me' }),
  );
  expect(mockTx.set).not.toHaveBeenCalled();
  expect(mockTx.update).not.toHaveBeenCalled();
  expect(mockTx.delete).not.toHaveBeenCalled();
});

test('unliking a post that is not liked writes nothing', async () => {
  mockTx.get.mockResolvedValue({ exists: () => false });
  const backend = createFirebaseBackend(ME);

  await expect(backend.setLike(post, false)).resolves.toEqual({
    value: false,
    changed: false,
  });
  expect(mockTx.set).not.toHaveBeenCalled();
  expect(mockTx.update).not.toHaveBeenCalled();
  expect(mockTx.delete).not.toHaveBeenCalled();
});

test('a new like writes the like doc, increment(+1) and the deterministic activity doc', async () => {
  mockTx.get.mockResolvedValue({ exists: () => false });
  const backend = createFirebaseBackend(ME);

  await expect(backend.setLike(post, true)).resolves.toEqual({
    value: true,
    changed: true,
  });

  expect(mockTx.set).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'posts/post1/likes/uid-me' }),
    { uid: ME, createdAt: { op: 'serverTimestamp' } },
  );
  expect(mockTx.update).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'posts/post1' }),
    {
      likeCount: { op: 'increment', n: 1 },
    },
  );
  expect(mockTx.set).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'users/uid-author/activity/like_post1_uid-me' }),
    {
      kind: 'like',
      actorId: ME,
      postId: 'post1',
      thumbUrl: 'https://img/1.jpg',
      createdAt: { op: 'serverTimestamp' },
      read: false,
    },
  );
});

test('liking my own post writes no activity item', async () => {
  mockTx.get.mockResolvedValue({ exists: () => false });
  const backend = createFirebaseBackend(ME);

  await backend.setLike({ id: 'mine', authorId: ME }, true);

  const paths = mockTx.set.mock.calls.map(([ref]) => (ref as FakeRef).path);
  expect(paths).toEqual(['posts/mine/likes/uid-me']);
});
