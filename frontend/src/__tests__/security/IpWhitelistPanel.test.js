import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock the config module
jest.mock('../../config/api.config', () => ({
  API_BASE_URL: 'http://localhost:5000/api',
}));

// Mock AdminNavbar and AdminSidebar to avoid rendering issues
jest.mock('../../components/admin components/AdminNavbar', () => () => <div data-testid="admin-navbar" />);
jest.mock('../../components/admin components/AdminSidebar', () => () => <div data-testid="admin-sidebar" />);

// Mock dayjs to return predictable output
jest.mock('dayjs', () => {
  const actual = jest.requireActual('dayjs');
  return actual;
});

// Mock sessionStorage
beforeEach(() => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'token') return 'test-token-123';
    return null;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

// Import after mocks are set up
const IpWhitelistPanel = require('../../pages/admin pages/IpWhitelistPanel').default;

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeEntry = (overrides = {}) => ({
  _id: overrides._id || 'entry-id-1',
  ip: overrides.ip || '192.168.1.1',
  addedBy: overrides.addedBy || { firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
  createdAt: overrides.createdAt || '2024-01-15T10:00:00.000Z',
  ...overrides,
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('IpWhitelistPanel', () => {
  // ── 9.2 Test 1: renders all entries returned by the API ──────────────────
  describe('renders all entries returned by the API', () => {
    it('displays each IP entry in the table', async () => {
      const entries = [
        makeEntry({ _id: 'id-1', ip: '10.0.0.1' }),
        makeEntry({ _id: 'id-2', ip: '192.168.1.0/24' }),
        makeEntry({ _id: 'id-3', ip: '203.0.113.42' }),
      ];

      axios.get.mockResolvedValueOnce({ data: entries });

      render(<IpWhitelistPanel />);

      // Wait for the entries to load
      await waitFor(() => {
        expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
      });

      expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument();
      expect(screen.getByText('203.0.113.42')).toBeInTheDocument();
    });

    it('shows empty state message when API returns no entries', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      render(<IpWhitelistPanel />);

      await waitFor(() => {
        expect(screen.getByText(/No entries in whitelist/i)).toBeInTheDocument();
      });
    });

    it('calls the whitelist API with the auth token on mount', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      render(<IpWhitelistPanel />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          'http://localhost:5000/api/security/whitelist',
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer test-token-123' }),
          })
        );
      });
    });
  });

  // ── 9.2 Test 2: add entry success → entry appears in list, success message shown ──
  describe('add entry success', () => {
    it('appends the new entry to the list and shows a success message', async () => {
      const existingEntry = makeEntry({ _id: 'id-1', ip: '10.0.0.1' });
      const newEntry = makeEntry({ _id: 'id-new', ip: '172.16.0.1' });

      axios.get.mockResolvedValueOnce({ data: [existingEntry] });
      axios.post.mockResolvedValueOnce({ data: newEntry });

      render(<IpWhitelistPanel />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
      });

      // Type a new IP and click Add
      const input = screen.getByLabelText(/IP Address or CIDR Range/i);
      fireEvent.change(input, { target: { value: '172.16.0.1' } });

      const addButton = screen.getByRole('button', { name: /add/i });
      fireEvent.click(addButton);

      // New entry should appear in the list
      await waitFor(() => {
        expect(screen.getByText('172.16.0.1')).toBeInTheDocument();
      });

      // Success message should be shown
      expect(screen.getByText(/IP address added successfully/i)).toBeInTheDocument();
    });

    it('clears the input field after a successful add', async () => {
      const newEntry = makeEntry({ _id: 'id-new', ip: '172.16.0.1' });

      axios.get.mockResolvedValueOnce({ data: [] });
      axios.post.mockResolvedValueOnce({ data: newEntry });

      render(<IpWhitelistPanel />);

      await waitFor(() => {
        expect(screen.getByText(/No entries in whitelist/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/IP Address or CIDR Range/i);
      fireEvent.change(input, { target: { value: '172.16.0.1' } });
      expect(input.value).toBe('172.16.0.1');

      fireEvent.click(screen.getByRole('button', { name: /add/i }));

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  // ── 9.2 Test 3: add entry error → API error message displayed, list unchanged ──
  describe('add entry error', () => {
    it('displays the API error message and does not change the list', async () => {
      const existingEntry = makeEntry({ _id: 'id-1', ip: '10.0.0.1' });

      axios.get.mockResolvedValueOnce({ data: [existingEntry] });
      axios.post.mockRejectedValueOnce({
        response: { data: { message: 'IP address already exists in whitelist' } },
      });

      render(<IpWhitelistPanel />);

      await waitFor(() => {
        expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/IP Address or CIDR Range/i);
      fireEvent.change(input, { target: { value: '10.0.0.1' } });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));

      // Error message should appear
      await waitFor(() => {
        expect(screen.getByText(/IP address already exists in whitelist/i)).toBeInTheDocument();
      });

      // List should still have only the original entry (the table row with the IP)
      const tableRows = screen.getAllByRole('row').filter((row) => row.querySelector('td') !== null);
      expect(tableRows).toHaveLength(1);
    });

    it('displays a fallback error message when API returns no message', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });
      axios.post.mockRejectedValueOnce(new Error('Network Error'));

      render(<IpWhitelistPanel />);

      await waitFor(() => {
        expect(screen.getByText(/No entries in whitelist/i)).toBeInTheDocument();
      });

      const input = screen.getByLabelText(/IP Address or CIDR Range/i);
      fireEvent.change(input, { target: { value: '999.999.999.999' } });
      fireEvent.click(screen.getByRole('button', { name: /add/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed to add IP address/i)).toBeInTheDocument();
      });
    });

    it('shows a validation error when the input is empty', async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      render(<IpWhitelistPanel />);

      await waitFor(() => {
        expect(screen.getByText(/No entries in whitelist/i)).toBeInTheDocument();
      });

      // Click Add without entering anything
      fireEvent.click(screen.getByRole('button', { name: /add/i }));

      expect(screen.getByText(/Please enter an IP address or CIDR range/i)).toBeInTheDocument();
      // axios.post should NOT have been called
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  // ── 9.2 Test 4: remove entry success → entry removed from list ──
  describe('remove entry success', () => {
    it('removes the entry from the displayed list after a successful delete', async () => {
      const entries = [
        makeEntry({ _id: 'id-1', ip: '10.0.0.1' }),
        makeEntry({ _id: 'id-2', ip: '192.168.1.1' }),
      ];

      axios.get.mockResolvedValueOnce({ data: entries });
      axios.delete.mockResolvedValueOnce({});

      render(<IpWhitelistPanel />);

      await waitFor(() => {
        expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      });

      // Click the remove button for the first entry
      const removeButtons = screen.getAllByTitle(/Remove/i);
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('10.0.0.1')).not.toBeInTheDocument();
      });

      // Second entry should still be present
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });

    it('calls the delete API with the correct entry ID and auth token', async () => {
      const entry = makeEntry({ _id: 'entry-abc-123', ip: '10.0.0.1' });

      axios.get.mockResolvedValueOnce({ data: [entry] });
      axios.delete.mockResolvedValueOnce({});

      render(<IpWhitelistPanel />);

      await waitFor(() => {
        expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
      });

      const removeButton = screen.getByTitle(/Remove 10\.0\.0\.1/i);
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          'http://localhost:5000/api/security/whitelist/entry-abc-123',
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer test-token-123' }),
          })
        );
      });
    });
  });
});
