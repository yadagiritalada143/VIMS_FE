import { UniqueKeyPipe } from './unique-key.pipe';

describe('UniqueKeyPipe', () => {
  it('create an instance', () => {
    const pipe = new UniqueKeyPipe();
    expect(pipe).toBeTruthy();
  });
});
