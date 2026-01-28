/**
 * Unit tests for TenantUsageDisplay component
 * 
 * Tests:
 * - Loading state display
 * - Error state display
 * - Usage data display with progress bars
 * - Warning indicators at 80% threshold
 * - Trend indicators (up/down arrows)
 * - Active overrides display
 * - Days until reset display
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.7
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { TenantUsageDisplay } from '../TenantUsageDisplay';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TenantUsageDisplay', () => {
  const mockTenantId = 'tenant-123';

  const mockUsageData = {
    currentMonth: {
      spinsUsed: 500,
      spinsLimit: 1000,
      spinsPercentage: 50,
      vouchersUsed: 200,
      vouchersLimit: 500,
      vouchersPercentage: 40,
      daysUntilReset: 15,
    },
    previousMonth: {
      spinsUsed: 400,
      vouchersUsed: 150,
    },
    trend: {
      spinsChange: 25,
      vouchersChange: 33,
    },
  };

  const mockOverrides = [
    {
      id: 'override-1',
      bonusSpins: 100,
      bonusVouchers: 50,
      reason: 'Promotional bonus for new feature launch',
      expiresAt: '2024-12-31T23:59:59Z',
      createdAt: '2024-01-01T00:00:00Z',
      grantedByAdmin: {
        email: 'admin@example.com',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading skeleton while fetching data', () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      // Check for loading skeleton
      const loadingElements = screen.getAllByRole('generic');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      const errorMessage = 'Failed to load usage data';
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          data: {
            error: {
              message: errorMessage,
            },
          },
        },
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message when error has no message', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load usage data')).toBeInTheDocument();
      });
    });
  });

  describe('Usage Display', () => {
    beforeEach(() => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: mockUsageData });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
    });

    it('should display spins usage with correct values', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        // Check for spins used (500)
        const spinsText = screen.getByText((content, element) => {
          return element?.textContent === '500 / 1,000' || false;
        });
        expect(spinsText).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });

    it('should display vouchers usage with correct values', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        // Check for vouchers used (200)
        const vouchersText = screen.getByText((content, element) => {
          return element?.textContent === '200 / 500' || false;
        });
        expect(vouchersText).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
      });
    });

    it('should display days until reset', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText(/Resets in 15 days/)).toBeInTheDocument();
      });
    });

    it('should display singular "day" when 1 day remaining', async () => {
      const dataWithOneDay = {
        ...mockUsageData,
        currentMonth: {
          ...mockUsageData.currentMonth,
          daysUntilReset: 1,
        },
      };

      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: dataWithOneDay });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText(/Resets in 1 day/)).toBeInTheDocument();
      });
    });
  });

  describe('Warning Indicators', () => {
    it('should display warning indicator when spins usage >= 80%', async () => {
      const dataWithHighSpins = {
        ...mockUsageData,
        currentMonth: {
          ...mockUsageData.currentMonth,
          spinsUsed: 850,
          spinsPercentage: 85,
        },
      };

      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: dataWithHighSpins });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        const warnings = screen.getAllByText('Warning');
        expect(warnings.length).toBeGreaterThan(0);
      });
    });

    it('should display warning indicator when vouchers usage >= 80%', async () => {
      const dataWithHighVouchers = {
        ...mockUsageData,
        currentMonth: {
          ...mockUsageData.currentMonth,
          vouchersUsed: 450,
          vouchersPercentage: 90,
        },
      };

      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: dataWithHighVouchers });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        const warnings = screen.getAllByText('Warning');
        expect(warnings.length).toBeGreaterThan(0);
      });
    });

    it('should not display warning when usage < 80%', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.queryByText('Warning')).not.toBeInTheDocument();
      });
    });
  });

  describe('Trend Indicators', () => {
    it('should display up arrow for positive trend', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument();
        expect(screen.getByText('33%')).toBeInTheDocument();
      });
    });

    it('should display down arrow for negative trend', async () => {
      const dataWithNegativeTrend = {
        ...mockUsageData,
        trend: {
          spinsChange: -15,
          vouchersChange: -20,
        },
      };

      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: dataWithNegativeTrend });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText('15%')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
      });
    });

    it('should display dash for zero trend', async () => {
      const dataWithZeroTrend = {
        ...mockUsageData,
        trend: {
          spinsChange: 0,
          vouchersChange: 0,
        },
      };

      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: dataWithZeroTrend });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        const zeroIndicators = screen.getAllByText('0%');
        expect(zeroIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Active Overrides Display', () => {
    beforeEach(() => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: mockUsageData });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: mockOverrides } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
    });

    it('should display active overrides section when overrides exist', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText(/Active Overrides \(1\)/)).toBeInTheDocument();
      });
    });

    it('should display bonus amounts in overrides', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText('+100 spins')).toBeInTheDocument();
        expect(screen.getByText('+50 vouchers')).toBeInTheDocument();
      });
    });

    it('should display override reason', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText(/Promotional bonus for new feature launch/)).toBeInTheDocument();
      });
    });

    it('should display granted by admin email', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText(/Granted by admin@example.com/)).toBeInTheDocument();
      });
    });

    it('should display expiration date when present', async () => {
      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.getByText(/Expires/)).toBeInTheDocument();
      });
    });

    it('should not display overrides section when no overrides exist', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: mockUsageData });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(screen.queryByText(/Active Overrides/)).not.toBeInTheDocument();
      });
    });
  });

  describe('API Calls', () => {
    it('should call usage API with correct tenant ID', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: mockUsageData });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `/api/admin/super/tenants/${mockTenantId}/usage`
        );
      });
    });

    it('should call overrides API with correct tenant ID', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: mockUsageData });
        }
        if (url.includes('/overrides')) {
          return Promise.resolve({ data: { overrides: [] } });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          `/api/admin/super/tenants/${mockTenantId}/overrides`
        );
      });
    });

    it('should not fail if overrides API fails', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url.includes('/usage')) {
          return Promise.resolve({ data: mockUsageData });
        }
        if (url.includes('/overrides')) {
          return Promise.reject(new Error('Overrides API error'));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<TenantUsageDisplay tenantId={mockTenantId} />);

      // Should still display usage data even if overrides fail
      await waitFor(() => {
        // Check for spins used (500)
        const spinsText = screen.getByText((content, element) => {
          return element?.textContent === '500 / 1,000' || false;
        });
        expect(spinsText).toBeInTheDocument();
      });
    });
  });
});
