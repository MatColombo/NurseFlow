import { expect, it, vi } from 'vitest';
import { pendingOperations, subscribeOperations, trackCommands } from './activity';

it('counts overlapping command promises until success or rejection, including pre-transaction preparation', async () => {
  let finish: () => void = () => {}; let fail: (reason: Error) => void = () => {};
  const commands = trackCommands({
    save: () => new Promise<void>((resolve) => { finish = resolve; }),
    prepare: () => new Promise<void>((_resolve, reject) => { fail = reject; }),
  });
  const changes: number[] = []; const stop = subscribeOperations(() => changes.push(pendingOperations()));
  const first = commands.save(); const second = commands.prepare(); const rejected = expect(second).rejects.toThrow('quota');
  expect(pendingOperations()).toBe(2); finish(); await first; expect(pendingOperations()).toBe(1);
  fail(new Error('quota')); await rejected; expect(pendingOperations()).toBe(0); expect(changes).toEqual([1, 2, 1, 0]); stop();
});
it('synchronous failure releases the idle barrier and unsubscribed observers are not notified', () => {
  const listener = vi.fn(); const stop = subscribeOperations(listener); stop();
  const commands = trackCommands({ save() { throw new Error('prepare'); } });
  expect(() => commands.save()).toThrow('prepare'); expect(pendingOperations()).toBe(0); expect(listener).not.toHaveBeenCalled();
});
