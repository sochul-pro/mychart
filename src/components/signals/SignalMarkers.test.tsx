import { describe, it, expect } from 'vitest';
import { signalsToMarkers } from './SignalMarkers';
import type { Signal } from '@/lib/signals/types';

describe('signalsToMarkers', () => {
  it('should convert buy signals to markers', () => {
    const signals: Signal[] = [
      { type: 'buy', time: 1704067200000, price: 10000, reason: 'test' },
    ];

    const markers = signalsToMarkers(signals);

    expect(markers).toHaveLength(1);
    expect(markers[0].position).toBe('belowBar');
    expect(markers[0].color).toBe('#26a69a');
    expect(markers[0].shape).toBe('arrowUp');
    expect(markers[0].text).toBe('B');
  });

  it('should convert sell signals to markers', () => {
    const signals: Signal[] = [
      { type: 'sell', time: 1704067200000, price: 11000, reason: 'test' },
    ];

    const markers = signalsToMarkers(signals);

    expect(markers).toHaveLength(1);
    expect(markers[0].position).toBe('aboveBar');
    expect(markers[0].color).toBe('#ef5350');
    expect(markers[0].shape).toBe('arrowDown');
    expect(markers[0].text).toBe('S');
  });

  it('should convert multiple signals', () => {
    const signals: Signal[] = [
      { type: 'buy', time: 1704067200000, price: 10000, reason: 'test' },
      { type: 'sell', time: 1704153600000, price: 11000, reason: 'test' },
      { type: 'buy', time: 1704240000000, price: 10500, reason: 'test' },
    ];

    const markers = signalsToMarkers(signals);

    expect(markers).toHaveLength(3);
    expect(markers[0].shape).toBe('arrowUp');
    expect(markers[1].shape).toBe('arrowDown');
    expect(markers[2].shape).toBe('arrowUp');
  });

  it('should convert timestamp to seconds', () => {
    const signals: Signal[] = [
      { type: 'buy', time: 1704067200000, price: 10000, reason: 'test' },
    ];

    const markers = signalsToMarkers(signals);

    expect(markers[0].time).toBe(1704067200);
  });

  it('should return empty array for no signals', () => {
    const markers = signalsToMarkers([]);

    expect(markers).toEqual([]);
  });
});
