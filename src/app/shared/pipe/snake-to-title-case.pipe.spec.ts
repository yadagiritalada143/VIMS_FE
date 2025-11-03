import { SnakeToTitleCasePipe } from './snake-to-title-case.pipe';

describe('SnakeToTitleCasePipe', () => {
  it('create an instance', () => {
    const pipe = new SnakeToTitleCasePipe();
    expect(pipe).toBeTruthy();
  });
});
