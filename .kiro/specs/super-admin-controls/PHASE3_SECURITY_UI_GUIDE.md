# Phase 3: Security Dashboard UI Implementation Guide

## Overview

This guide provides complete implementation details for the Security Dashboard UI page. The page displays security alerts, suspicious activity, and failed login attempts, allowing Super Admins to monitor threats and lock/unlock tenant accounts.

## File Location

**Path**: `app/admin/super/security/page.tsx`

## Page Structure

### 1. Summary Cards Section

Three metric cards displaying key security statistics:

```typescript
// Card 1: Active Alerts (Red border)
- Icon: AlertTriangle
- Label: "Active Alerts"
- Value: Count of unresolved security events
- Border: border-l-4 border-red-500

// Card 2: Suspicious Activity (Yellow border)
- Icon: XCircle
- Label: "Suspicious Activity"
- Value: Count of detected threats
- Border: border-l-4 border-yellow-500

// Card 3: Failed Logins (Blue border)
- Icon: Lock
- Label: "Failed Logins"
- Value: Count of tenants with failed attempts
- Border: border-l-4 border-blue-500
```

### 2. Active Security Alerts Section

Displays all unresolved security events with action buttons:

**Layout**: Card-based list with color-coded severity

**Each Alert Card Contains**:
- Severity badge (HIGH/MEDIUM/LOW)
- Event type label
- Tenant name (bold)
- Description text
- Timestamp
- Lock button (red, with Lock icon)

**Severity Color Coding**:
```typescript
HIGH: 'text-red-600 bg-red-50 border-red-200'
MEDIUM: 'text-yellow-600 bg-yellow-50 border-yellow-200'
LOW: 'text-blue-600 bg-blue-50 border-blue-200'
```

**Empty State**:
- Green CheckCircle icon
- Message: "No active security alerts"

### 3. Suspicious Activity Section

Table displaying detected suspicious activities:

**Columns**:
1. Tenant (tenant name)
2. Activity Type (event type)
3. Description (full description)
4. Severity (badge with color)
5. Detected At (formatted timestamp)

**Table Styling**:
- Header: bg-gray-50
- Rows: divide-y divide-gray-200
- Responsive: overflow-x-auto wrapper

**Empty State**:
- Centered text: "No suspicious activity detected"

### 4. Failed Login Attempts Section

Table displaying tenants with failed login attempts:

**Columns**:
1. Tenant (tenant name)
2. Failed Count (badge with count)
3. Last Failed At (formatted timestamp)
4. Actions (Lock Account button)

**Failed Count Badge Colors**:
```typescript
> 10 attempts: 'bg-red-100 text-red-800'
≤ 10 attempts: 'bg-yellow-100 text-yellow-800'
```

**Actions**:
- Lock Account button (text-red-600, with Lock icon)

**Empty State**:
- Centered text: "No failed login attempts"

## TypeScript Interfaces

```typescript
interface SecurityAlert {
  id: string;
  tenantId: string;
  tenantName: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  metadata?: any;
  resolved: boolean;
  createdAt: string;
}

interface SuspiciousActivity {
  tenantId: string;
  tenantName: string;
  activityType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  detectedAt: string;
}

interface FailedLoginSummary {
  tenantId: string;
  tenantName: string;
  failedCount: number;
  lastFailedAt: string | null;
}

interface SecurityDashboard {
  alerts: SecurityAlert[];
  suspiciousActivity: SuspiciousActivity[];
  failedLogins: FailedLoginSummary[];
}
```

## API Integration

### Fetch Dashboard Data

```typescript
// Endpoint: GET /api/admin/super/security/dashboard
const response = await fetch('/api/admin/super/security/dashboard');
const result = await response.json();

// Response format:
{
  success: true,
  data: {
    alerts: SecurityAlert[],
    suspiciousActivity: SuspiciousActivity[],
    failedLogins: FailedLoginSummary[]
  }
}
```

### Lock Tenant Account

```typescript
// Endpoint: PUT /api/admin/super/tenants/:id/lock
const response = await fetch(`/api/admin/super/tenants/${tenantId}/lock`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reason: 'Security concern' })
});

// Response format:
{
  success: true,
  message: 'Tenant account locked successfully'
}
```

### Unlock Tenant Account

```typescript
// Endpoint: PUT /api/admin/super/tenants/:id/unlock
const response = await fetch(`/api/admin/super/tenants/${tenantId}/unlock`, {
  method: 'PUT'
});

// Response format:
{
  success: true,
  message: 'Tenant account unlocked successfully'
}
```

## Interactive Features

### 1. Lock Tenant Flow

```typescript
const handleLockTenant = async (tenantId: string, tenantName: string) => {
  // Step 1: Prompt for reason
  const reason = prompt(`Enter reason for locking "${tenantName}":`);
  if (!reason) return; // User cancelled
  
  // Step 2: Set loading state
  setLockingTenant(tenantId);
  
  // Step 3: Call API
  const response = await fetch(`/api/admin/super/tenants/${tenantId}/lock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  
  // Step 4: Handle response
  const result = await response.json();
  if (result.success) {
    alert(`Tenant "${tenantName}" locked successfully`);
    fetchDashboard(); // Refresh data
  } else {
    alert(`Failed to lock tenant: ${result.error}`);
  }
  
  // Step 5: Clear loading state
  setLockingTenant(null);
};
```

### 2. Unlock Tenant Flow

```typescript
const handleUnlockTenant = async (tenantId: string, tenantName: string) => {
  // Step 1: Confirm action
  if (!confirm(`Are you sure you want to unlock "${tenantName}"?`)) return;
  
  // Step 2: Set loading state
  setLockingTenant(tenantId);
  
  // Step 3: Call API
  const response = await fetch(`/api/admin/super/tenants/${tenantId}/unlock`, {
    method: 'PUT'
  });
  
  // Step 4: Handle response
  const result = await response.json();
  if (result.success) {
    alert(`Tenant "${tenantName}" unlocked successfully`);
    fetchDashboard(); // Refresh data
  } else {
    alert(`Failed to unlock tenant: ${result.error}`);
  }
  
  // Step 5: Clear loading state
  setLockingTenant(null);
};
```

### 3. Auto-Refresh on Load

```typescript
useEffect(() => {
  fetchDashboard();
}, []); // Runs once on component mount
```

## State Management

```typescript
const [dashboard, setDashboard] = useState<SecurityDashboard | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [lockingTenant, setLockingTenant] = useState<string | null>(null);
```

**State Descriptions**:
- `dashboard`: Stores fetched security data
- `loading`: Shows loading spinner while fetching
- `error`: Displays error message if fetch fails
- `lockingTenant`: Tracks which tenant is being locked/unlocked (for button disabled state)

## Loading States

### Initial Loading

```tsx
if (loading) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading security dashboard...</div>
      </div>
    </div>
  );
}
```

### Error State

```tsx
if (error) {
  return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
```

### Button Loading State

```tsx
<button
  onClick={() => handleLockTenant(tenantId, tenantName)}
  disabled={lockingTenant === tenantId}
  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
>
  <Lock className="w-4 h-4" />
  Lock
</button>
```

## Styling Guidelines

### Color Palette

**Severity Colors**:
- HIGH: Red (#DC2626, #FEE2E2, #FECACA)
- MEDIUM: Yellow (#D97706, #FEF3C7, #FDE68A)
- LOW: Blue (#2563EB, #DBEAFE, #BFDBFE)

**UI Colors**:
- Background: White (#FFFFFF)
- Border: Gray-200 (#E5E7EB)
- Text Primary: Gray-900 (#111827)
- Text Secondary: Gray-600 (#4B5563)
- Text Muted: Gray-500 (#6B7280)

### Typography

**Headings**:
- Page Title: text-3xl font-bold
- Section Title: text-xl font-semibold
- Card Title: font-semibold text-gray-900

**Body Text**:
- Primary: text-sm text-gray-900
- Secondary: text-sm text-gray-500
- Muted: text-xs text-gray-500

### Spacing

**Padding**:
- Page container: p-8
- Card padding: p-6
- Card header: px-6 py-4
- Table cells: px-6 py-4

**Margins**:
- Section spacing: mb-8
- Card spacing: space-y-4
- Element spacing: gap-2, gap-4, gap-6

### Responsive Design

```tsx
// Grid layout for summary cards
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Table wrapper for horizontal scroll
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* Table content */}
  </table>
</div>
```

## Icons

**Required Icons** (from lucide-react):
- `AlertTriangle` - Active alerts card
- `Shield` - Page title
- `Lock` - Failed logins card, lock buttons
- `Unlock` - Unlock functionality
- `CheckCircle` - Empty state (no alerts)
- `XCircle` - Suspicious activity card

**Icon Sizing**:
- Page title: w-8 h-8
- Summary cards: w-12 h-12
- Buttons: w-4 h-4

## Helper Functions

### Get Severity Color

```typescript
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'HIGH':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'LOW':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
```

### Get Severity Badge

```typescript
const getSeverityBadge = (severity: string) => {
  const colors = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-blue-100 text-blue-800'
  };
  return colors[severity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};
```

## Date Formatting

```typescript
// Format timestamp for display
new Date(timestamp).toLocaleString()

// Example output: "1/28/2026, 10:30:00 AM"
```

## Accessibility Considerations

1. **Semantic HTML**: Use proper table structure with thead/tbody
2. **Button States**: Disable buttons during loading with visual feedback
3. **Color Contrast**: Ensure text meets WCAG AA standards
4. **Focus States**: Buttons have hover and focus states
5. **Screen Readers**: Use descriptive button text and labels

## Error Handling

### API Error Handling

```typescript
try {
  const response = await fetch(url);
  const result = await response.json();
  
  if (result.success) {
    // Handle success
  } else {
    // Handle API error
    alert(`Error: ${result.error}`);
  }
} catch (err: any) {
  // Handle network error
  alert(`Error: ${err.message}`);
}
```

### User Feedback

- **Success**: Alert with success message + refresh data
- **Error**: Alert with error message
- **Loading**: Disable buttons with opacity-50
- **Empty States**: Friendly messages with icons

## Testing Checklist

- [ ] Page loads without errors
- [ ] Summary cards display correct counts
- [ ] Security alerts render with correct severity colors
- [ ] Lock button prompts for reason
- [ ] Lock API call succeeds and refreshes data
- [ ] Unlock button shows confirmation
- [ ] Unlock API call succeeds and refreshes data
- [ ] Loading states work correctly
- [ ] Error states display properly
- [ ] Empty states show appropriate messages
- [ ] Tables are responsive on mobile
- [ ] Buttons are disabled during operations
- [ ] Date formatting is correct
- [ ] Icons render properly

## Navigation Integration

Add link to security dashboard in Super Admin navigation:

```tsx
// In app/admin/super/page.tsx or navigation component
<Link href="/admin/super/security">
  <Shield className="w-5 h-5" />
  Security Dashboard
</Link>
```

## Complete Component Code

The complete implementation is available in:
- **File**: `app/admin/super/security/page.tsx`
- **Lines**: Full component with all features

## Requirements Validated

This UI implementation satisfies the following requirements:

✅ **Requirement 14.2**: Display security alert for >10 failed logins in 1 hour
✅ **Requirement 14.3**: Display suspicious activity alert for >1000 spins in 1 hour
✅ **Requirement 14.4**: Display suspicious activity alert for >500 users in 1 day
✅ **Requirement 14.5**: Lock tenant account functionality
✅ **Requirement 14.6**: Unlock tenant account functionality
✅ **Requirement 14.8**: Security dashboard with all active alerts and suspicious activity

## Next Steps

After implementing this UI:

1. Test all interactive features (lock/unlock)
2. Verify API integration works correctly
3. Test responsive design on mobile devices
4. Add navigation link from main Super Admin dashboard
5. Consider adding auto-refresh functionality (polling every 30 seconds)
6. Add filtering/sorting capabilities for large datasets
7. Implement alert resolution functionality
8. Add export functionality for security reports

## Support

For questions or issues with this implementation:
- Review the API documentation in `PHASE3_SECURITY_MONITORING.md`
- Check existing Phase 2 UI pages for reference patterns
- Refer to the design document for additional context
