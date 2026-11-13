import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ result: [] }),
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders movie recommendation system title', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText(/Movie Recommendation System/i)).toBeInTheDocument();
  });
});
