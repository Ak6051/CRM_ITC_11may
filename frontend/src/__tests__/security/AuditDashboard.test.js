import React from 'react';
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock the config module
jest.mock('../../config/api.config', () => ({
  API_BASE_URL: 'http://localhost:5000/api',
}));

// Mock AdminNavbar and AdminSidebar to avoid rendering issues
jest.mock('../../components/admin components/AdminNavbar', () => () => (
  <div data-testid="admin-navbar" />
));
jest.mock('../../components/admin components/AdminSidebar', () => () => (
  <div data-testid="admin-sidebar" />
));

// Mock MUI DatePicker components to avoid complex date picker setup
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, onChange, value }) => (
    <input
      data-testid={`date-picker-${label.replace(/\s+/g, '-').toLowerCase()}`}
      aria-label={label}
      value={value ? value.toString() : ''}
      onChange={(e) => onChange(e.target.value || null)}
    />
  ),
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <>{children}</>,
}));

jest.mock('@mui/x-date-pickers/AdapterDayjs', () => ({
  AdapterDayjs: class AdapterDayjs {},
}));

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
const AuditDashboard = require('../../pages/admin pages/AuditDashboard').default;

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeLog = (overrides = {}) => ({
  _id: overrides._id || 'log-id-1',
  email: overrides.email || 'hr@test.com',
  ip: overrides.ip || '192.168.1.10',
  deviceInfo: overrides.deviceInfo || 'Mozilla/5.0 (Windows NT 10.0)',
  createdAt: overrides.createdAt || '2024-06-01T09:30:00.000Z',
  status: overrides.status || 'success',
  userId: overrides.userId !== undefined
    ? overrides.userId
    : { _id: 'user-id-1', firstName: 'Jane', lastName: 'Doe' },
  ...overrides,
});

const makeApiResponse = (logs = [], overrides = {}) => ({
  data: {
    logs,
    total: logs.length,
    page: 1,
    totalPages: overrides.totalPages || 1,
    ...overrides,
  },
});

/**
 * Wait for the component to finish its initial double-fetch on mount.
 * AuditDashboard fires two useEffect calls on mount (initial load + filter effect),
 * so we wait until axios.get has been called at least twice before proceeding.
 */
const waitForInitialLoad = async () => {
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('AuditDashboard', () => {
  // ── Test 1: renders log entries with all required columns ─────────────────
  describe('renders log entries with all required columns', () => {
    it('displays all required column headers when logs are present', async () => {
      const log = makeLog();
      axios.get.mockResolvedValue(makeApiResponse([log]));

      render(<AuditDashboard />);

      // Wait for the table to appear
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Scope column header checks to the table header row
      const table = screen.getByRole('table');
      const columnHeaders = within(table).getAllByRole('columnheader');
      const headerTexts = columnHeaders.map((th) => th.textContent);

      expect(headerTexts).toContain('Full Name');
      expect(headerTexts).toContain('Email');
      expect(headerTexts).toContain('IP Address');
      expect(headerTexts).toContain('Device Info');
      expect(headerTexts).toContain('Timestamp');
      expect(headerTexts).toContain('Status');
    });

    it('renders log entry data in the correct columns', async () => {
      const log = makeLog({
        _id: 'log-abc',
        email: 'alice@company.com',
        ip: '10.0.0.5',
        deviceInfo: 'Chrome/120.0',
        // Use a fixed UTC timestamp; dayjs formats in local time so we just check
        // the date portion which is unambiguous
        createdAt: '2024-06-15T00:00:00.000Z',
        status: 'success',
        userId: { _id: 'user-abc', firstName: 'Alice', lastName: 'Smith' },
      });

      axios.get.mockResolvedValue(makeApiResponse([log]));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });

      expect(screen.getByText('alice@company.com')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.5')).toBeInTheDocument();
      expect(screen.getByText('Chrome/120.0')).toBeInTheDocument();
      // Status chip
      expect(screen.getByText('success')).toBeInTheDocument();
      // Timestamp contains the date portion (timezone-safe check)
      expect(screen.getByText(/2024-06-1/)).toBeInTheDocument();
    });

    it('renders multiple log entries', async () => {
      const logs = [
        makeLog({ _id: 'log-1', email: 'hr1@test.com', userId: { _id: 'u1', firstName: 'Bob', lastName: 'Jones' } }),
        makeLog({ _id: 'log-2', email: 'hr2@test.com', userId: { _id: 'u2', firstName: 'Carol', lastName: 'White' } }),
        makeLog({ _id: 'log-3', email: 'hr3@test.com', userId: { _id: 'u3', firstName: 'Dave', lastName: 'Brown' } }),
      ];

      axios.get.mockResolvedValue(makeApiResponse(logs, { total: 3 }));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      });

      expect(screen.getByText('Carol White')).toBeInTheDocument();
      expect(screen.getByText('Dave Brown')).toBeInTheDocument();
    });

    it('shows "—" in the full name cell when userId is null', async () => {
      const log = makeLog({ _id: 'log-blocked', userId: null, status: 'blocked' });

      axios.get.mockResolvedValue(makeApiResponse([log]));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('blocked')).toBeInTheDocument();
      });

      // Multiple "—" elements exist (full name + action cell), so use getAllByText
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Test 2: empty state displays "No login records found" ─────────────────
  describe('empty state', () => {
    it('displays "No login records found" when API returns empty logs', async () => {
      axios.get.mockResolvedValue(makeApiResponse([]));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No login records found')).toBeInTheDocument();
      });
    });

    it('does not render the table when there are no logs', async () => {
      axios.get.mockResolvedValue(makeApiResponse([]));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No login records found')).toBeInTheDocument();
      });

      // Table should not be present
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  // ── Test 3: filter controls trigger re-fetch with correct query params ─────
  describe('filter controls', () => {
    it('re-fetches with status param when status filter is changed', async () => {
      axios.get.mockResolvedValue(makeApiResponse([]));

      render(<AuditDashboard />);

      // Wait for the initial double-fetch to settle
      await waitForInitialLoad();

      // Change the status filter
      const statusSelect = screen.getByTestId('status-filter');
      fireEvent.change(statusSelect, { target: { value: 'blocked' } });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(3);
      });

      const lastCall = axios.get.mock.calls[2];
      expect(lastCall[0]).toBe('http://localhost:5000/api/security/audit-logs');
      expect(lastCall[1].params).toMatchObject({ status: 'blocked', page: 1 });
    });

    it('sends the auth token in the Authorization header', async () => {
      axios.get.mockResolvedValue(makeApiResponse([]));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          'http://localhost:5000/api/security/audit-logs',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token-123',
            }),
          })
        );
      });
    });

    it('re-fetches with page reset to 1 when status filter changes', async () => {
      axios.get.mockResolvedValue(makeApiResponse([]));

      render(<AuditDashboard />);

      await waitForInitialLoad();

      const statusSelect = screen.getByTestId('status-filter');
      fireEvent.change(statusSelect, { target: { value: 'failed' } });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(3);
      });

      const lastCall = axios.get.mock.calls[2];
      expect(lastCall[1].params.page).toBe(1);
    });

    it('omits status param when "All Statuses" is selected', async () => {
      axios.get.mockResolvedValue(makeApiResponse([]));

      render(<AuditDashboard />);

      await waitForInitialLoad();

      // Set a status filter
      const statusSelect = screen.getByTestId('status-filter');
      fireEvent.change(statusSelect, { target: { value: 'success' } });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(3);
      });

      // Clear it back to empty (All Statuses)
      fireEvent.change(statusSelect, { target: { value: '' } });

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(4);
      });

      const lastCall = axios.get.mock.calls[3];
      // status should not be in params when empty
      expect(lastCall[1].params.status).toBeUndefined();
    });
  });

  // ── Test 4: pagination controls render and navigate correctly ──────────────
  describe('pagination', () => {
    it('renders pagination when totalPages > 1', async () => {
      const logs = [makeLog()];
      axios.get.mockResolvedValue(
        makeApiResponse(logs, { total: 60, totalPages: 2 })
      );

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });
    });

    it('does not render pagination when totalPages is 1', async () => {
      axios.get.mockResolvedValue(makeApiResponse([], { total: 0, totalPages: 1 }));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No login records found')).toBeInTheDocument();
      });

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('fetches the next page when a pagination button is clicked', async () => {
      const logs = [makeLog()];
      axios.get.mockResolvedValue(
        makeApiResponse(logs, { total: 60, page: 1, totalPages: 2 })
      );

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      // Wait for initial double-fetch to settle
      await waitForInitialLoad();

      // Click page 2
      const page2Button = screen.getByRole('button', { name: /page 2/i });
      fireEvent.click(page2Button);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(3);
      });

      const lastCall = axios.get.mock.calls[2];
      expect(lastCall[1].params.page).toBe(2);
    });

    it('shows page count info in the login records section', async () => {
      const logs = [makeLog()];
      axios.get.mockResolvedValue(
        makeApiResponse(logs, { total: 60, page: 1, totalPages: 2 })
      );

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
      });
    });
  });

  // ── Test 5: Force Logout button calls the correct API endpoint ─────────────
  describe('Force Logout button', () => {
    it('calls the force-logout API with the correct userId', async () => {
      const log = makeLog({
        _id: 'log-xyz',
        userId: { _id: 'user-hr-456', firstName: 'Tom', lastName: 'Hardy' },
        status: 'success',
      });

      axios.get.mockResolvedValue(makeApiResponse([log]));
      axios.post.mockResolvedValueOnce({ data: { message: 'User logged out' } });

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Tom Hardy')).toBeInTheDocument();
      });

      const forceLogoutBtn = screen.getByRole('button', { name: /force logout/i });
      fireEvent.click(forceLogoutBtn);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://localhost:5000/api/security/force-logout/user-hr-456',
          {},
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token-123',
            }),
          })
        );
      });
    });

    it('shows success message after force logout succeeds', async () => {
      const log = makeLog({
        _id: 'log-xyz',
        userId: { _id: 'user-hr-456', firstName: 'Tom', lastName: 'Hardy' },
        status: 'success',
      });

      axios.get.mockResolvedValue(makeApiResponse([log]));
      axios.post.mockResolvedValueOnce({ data: { message: 'User logged out' } });

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Tom Hardy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /force logout/i }));

      await waitFor(() => {
        expect(screen.getByText(/user has been logged out successfully/i)).toBeInTheDocument();
      });
    });

    it('shows error message when force logout fails', async () => {
      const log = makeLog({
        _id: 'log-err',
        userId: { _id: 'user-hr-789', firstName: 'Sara', lastName: 'Lee' },
        status: 'success',
      });

      axios.get.mockResolvedValue(makeApiResponse([log]));
      axios.post.mockRejectedValueOnce({
        response: { data: { message: 'Force logout failed. Please try again.' } },
      });

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Sara Lee')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /force logout/i }));

      await waitFor(() => {
        expect(screen.getByText(/force logout failed/i)).toBeInTheDocument();
      });
    });

    it('disables the Force Logout button for entries with status force_logout', async () => {
      const log = makeLog({
        _id: 'log-fl',
        userId: { _id: 'user-hr-999', firstName: 'Max', lastName: 'Power' },
        status: 'force_logout',
      });

      axios.get.mockResolvedValue(makeApiResponse([log]));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Max Power')).toBeInTheDocument();
      });

      const forceLogoutBtn = screen.getByRole('button', { name: /force logout/i });
      expect(forceLogoutBtn).toBeDisabled();
    });

    it('renders "—" instead of Force Logout button when userId is null', async () => {
      const log = makeLog({
        _id: 'log-no-user',
        userId: null,
        status: 'blocked',
      });

      axios.get.mockResolvedValue(makeApiResponse([log]));

      render(<AuditDashboard />);

      await waitFor(() => {
        expect(screen.getByText('blocked')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /force logout/i })).not.toBeInTheDocument();
    });
  });
});
