import { render, screen, fireEvent } from '@testing-library/react';
import PriceRangeSlider from './PriceRangeSlider';

describe('PriceRangeSlider', () => {
  it('renders two accessible thumbs seeded with the given values', () => {
    render(
      <PriceRangeSlider
        min={0}
        max={500}
        step={10}
        valueMin={100}
        valueMax={300}
        onChange={jest.fn()}
      />,
    );
    // jsdom exposes range input values as strings.
    expect(screen.getByLabelText(/minimum price/i)).toHaveValue('100');
    expect(screen.getByLabelText(/maximum price/i)).toHaveValue('300');
  });

  it('reports the new lower bound when the min thumb moves', () => {
    const onChange = jest.fn();
    render(
      <PriceRangeSlider
        min={0}
        max={500}
        step={10}
        valueMin={0}
        valueMax={500}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/minimum price/i), {
      target: { value: '120' },
    });
    expect(onChange).toHaveBeenCalledWith({ min: 120, max: 500 });
  });

  it('reports the new upper bound when the max thumb moves', () => {
    const onChange = jest.fn();
    render(
      <PriceRangeSlider
        min={0}
        max={500}
        step={10}
        valueMin={0}
        valueMax={500}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/maximum price/i), {
      target: { value: '380' },
    });
    expect(onChange).toHaveBeenCalledWith({ min: 0, max: 380 });
  });

  it('clamps the min thumb so it cannot cross the max thumb', () => {
    const onChange = jest.fn();
    render(
      <PriceRangeSlider
        min={0}
        max={500}
        step={10}
        valueMin={0}
        valueMax={200}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/minimum price/i), {
      target: { value: '400' },
    });
    expect(onChange).toHaveBeenCalledWith({ min: 200, max: 200 });
  });

  it('clamps the max thumb so it cannot cross the min thumb', () => {
    const onChange = jest.fn();
    render(
      <PriceRangeSlider
        min={0}
        max={500}
        step={10}
        valueMin={300}
        valueMax={500}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText(/maximum price/i), {
      target: { value: '100' },
    });
    expect(onChange).toHaveBeenCalledWith({ min: 300, max: 300 });
  });
});
