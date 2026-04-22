import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { healthHandler } from '../src/server';

describe('healthHandler', () => {
  it('returns status ok with an uptime value', () => {
    const json = vi.fn();
    const res = { json } as unknown as Response;

    healthHandler({} as never, res, {} as never);

    expect(json).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        uptime: expect.any(Number),
      }),
    );
  });
});
