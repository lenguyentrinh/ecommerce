import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('SearchBar', () => {
  beforeEach(() => push.mockClear());

  it('navigates to /search?q=<encoded> on submit', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.type(
      screen.getByRole('searchbox', { name: /search products/i }),
      'linen shirt',
    );
    await user.keyboard('{Enter}');
    expect(push).toHaveBeenCalledWith('/search?q=linen%20shirt');
  });

  it('does nothing on an empty submit', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{Enter}');
    expect(push).not.toHaveBeenCalled();
  });

  it('shows the clear button only with text and empties the field', async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    expect(
      screen.queryByRole('button', { name: /clear search/i }),
    ).not.toBeInTheDocument();

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    await user.type(input, 'abc');
    await user.click(screen.getByRole('button', { name: /clear search/i }));
    expect(input.value).toBe('');
  });
});
