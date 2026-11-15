import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchInput } from './SearchInput';

describe('SearchInput Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders input with default placeholder and value', () => {
    render(<SearchInput defaultValue="initial" placeholder="Search records..." />);
    const input = screen.getByPlaceholderText('Search records...') as HTMLInputElement;
    expect(input.value).toBe('initial');
  });

  it('debounces onChange events before invoking onDebounce callback', () => {
    const handleDebounce = vi.fn();
    render(<SearchInput onDebounce={handleDebounce} debounceMs={300} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'cardio' } });

    expect(handleDebounce).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(handleDebounce).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(handleDebounce).toHaveBeenCalledWith('cardio');
  });

  it('clears input value when clear button is clicked', () => {
    const handleDebounce = vi.fn();
    render(<SearchInput defaultValue="heart" onDebounce={handleDebounce} debounceMs={100} />);

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearButton);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(handleDebounce).toHaveBeenCalledWith('');
  });

  it('does not invoke onDebounce on mount or on re-render when user has not typed', () => {
    const handleDebounce = vi.fn();
    const { rerender } = render(<SearchInput defaultValue="" onDebounce={handleDebounce} debounceMs={300} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(handleDebounce).not.toHaveBeenCalled();

    // Re-render with new callback reference (simulating parent component re-render)
    const newHandleDebounce = vi.fn();
    rerender(<SearchInput defaultValue="" onDebounce={newHandleDebounce} debounceMs={300} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(newHandleDebounce).not.toHaveBeenCalled();
    expect(handleDebounce).not.toHaveBeenCalled();
  });
});
