/**
 * Property-Based Tests for IpWhitelistPanel
 *
 * Property 18: Whitelist UI displays all entries
 * Validates: Requirements 6.4
 *
 * Feature: hr-login-security, Property 18: Whitelist UI displays all entries
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import * as fc from 'fast-check';

// Mock axios
jest.mock('axios');

// Mock the config module
jest.mock('../../config/api.config', () => ({
  API_BASE_URL: 'http://localhost:5000/api',
}));

// Mock AdminNavbar and AdminSidebar to avoid rendering issues
jest.mock('../../components/admin components/AdminNavbar', () => () => <div data-testid="admin-navbar" />);
jest.mock('../../components/admin components/AdminSidebar', () => () => <div data-testid="admin-sidebar" />);

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

// Property tests with many iterations need a longer timeout
jest.setTimeout(60000);

const IpWhitelistPanel = require('../../pages/admin pages/IpWhitelistPanel').default;

/**
 * Build a whitelist entry object from an IP string.
 * Mirrors the shape returned by the real API.
 */
const buildEntry = (ip, index) => ({
  _id: `entry-id-${index}`,
  ip,
  addedBy: { firstName: 'Admin', lastName: 'User', email: 'admin@test.com' },
  createdAt: new Date(Date.now() - index * 1000).toISOString(),
});

// ─── Property 18 ─────────────────────────────────────────────────────────────

describe('Property 18: Whitelist UI displays all entries', () => {
  /**
   * **Validates: Requirements 6.4**
   *
   * For any set of N whitelist entries returned by the API, the IpWhitelistPanel
   * component should render exactly N entries in the displayed list.
   */
  it('renders exactly N rows for N entries returned by the mocked API', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.ipV4(), { minLength: 0, maxLength: 50 }),
        async (ipAddresses) => {
          // Build entry objects from the generated IP addresses
          const entries = ipAddresses.map((ip, i) => buildEntry(ip, i));

          // Mock the GET /whitelist call to return the generated entries
          axios.get.mockResolvedValueOnce({ data: entries });

          const { unmount } = render(<IpWhitelistPanel />);

          if (entries.length === 0) {
            // Empty state: no table rows, empty-state message shown
            await waitFor(() => {
              expect(screen.getByText(/No entries in whitelist/i)).toBeInTheDocument();
            });

            // No table rows should be present
            const rows = screen.queryAllByRole('row');
            // Only the header row may exist (or none at all when table is not rendered)
            const dataRows = rows.filter((row) => {
              // Header row contains th elements; data rows contain td elements
              return row.querySelector('td') !== null;
            });
            expect(dataRows).toHaveLength(0);
          } else {
            // Non-empty: wait for the first IP to appear, then count all data rows
            await waitFor(() => {
              expect(screen.getByText(entries[0].ip)).toBeInTheDocument();
            });

            const rows = screen.getAllByRole('row');
            const dataRows = rows.filter((row) => row.querySelector('td') !== null);

            // Exactly N data rows for N entries
            expect(dataRows).toHaveLength(entries.length);
          }

          unmount();
          jest.clearAllMocks();
        }
      ),
      { numRuns: 50 } // 50 runs is sufficient for UI property tests
    );
  });

  it('each rendered row displays the correct IP address from the API response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.ipV4(), { minLength: 1, maxLength: 20 }),
        async (ipAddresses) => {
          // Deduplicate IPs to avoid ambiguous DOM queries
          const uniqueIps = [...new Set(ipAddresses)];
          const entries = uniqueIps.map((ip, i) => buildEntry(ip, i));

          axios.get.mockResolvedValueOnce({ data: entries });

          const { unmount } = render(<IpWhitelistPanel />);

          // Wait for the first entry to appear
          await waitFor(() => {
            expect(screen.getByText(entries[0].ip)).toBeInTheDocument();
          });

          // Every IP from the API response must appear in the rendered output
          for (const entry of entries) {
            expect(screen.getByText(entry.ip)).toBeInTheDocument();
          }

          unmount();
          jest.clearAllMocks();
        }
      ),
      { numRuns: 30 }
    );
  });
});
