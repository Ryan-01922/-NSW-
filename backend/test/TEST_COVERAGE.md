# Test Coverage Documentation

## 1. LandRegistry Contract Tests

### Role Management
- Verification of correct role assignment (AGENT_ROLE and ADMIN_ROLE)
- Access control for different operations

### Property Registration
- **Positive Tests:**
  - Agents can register new properties
  - Verification of property details after registration
  - Event emission for property registration

- **Negative Tests:**
  - Non-agents cannot register properties
  - Prevention of duplicate property registration
  - Access control validation

### Property Transfer
- **Request Phase:**
  - Agents can initiate transfer requests
  - Proper event emission with correct parameters
  - State updates after request creation

- **Approval Phase:**
  - Admins can approve transfers
  - Property ownership updates correctly
  - Event emission for approved transfers

- **Restrictions:**
  - Inactive properties cannot be transferred
  - Access control for transfer operations

### Property Renewal
- **Request Phase:**
  - Agents can initiate renewal requests
  - Event emission for renewal requests

- **Approval Phase:**
  - Admins can approve renewals
  - Expiry timestamp updates correctly
  - Event emission for approved renewals

## 2. RenewalApproval Contract Tests

### Request Management
- **Creation:**
  - Agents can create renewal requests
  - Request details are stored correctly
  - Event emission with correct parameters

- **Access Control:**
  - Non-agents cannot create requests
  - Role-based access validation

### Approval Process
- **Approval Flow:**
  - Admins can approve renewal requests
  - Property expiry updates in main contract
  - Event emission for approvals

- **Rejection Flow:**
  - Admins can reject renewal requests
  - Rejection reason handling
  - Request cleanup after rejection

### History Management
- Maintenance of renewal request history
- History record completeness
- Verification of historical data accuracy

## 3. TransferApproval Contract Tests

### Request Management
- **Creation:**
  - Agents can create transfer requests
  - Request details storage
  - Document reference handling
  - Event emission

- **Validation:**
  - Prevention of transfer to current owner
  - Access control enforcement
  - Request state validation

### Approval Process
- **Approval Flow:**
  - Admins can approve transfers
  - Property ownership updates
  - Event emission for approvals

- **Rejection Flow:**
  - Admins can reject transfers
  - Rejection reason handling
  - Request cleanup

### Request Cancellation
- **Cancellation Rights:**
  - Request initiator can cancel
  - Current property owner can cancel
  - Request cleanup after cancellation

### History Management
- Transfer history maintenance
- History record completeness
- Historical data accuracy verification

## 4. Cross-Contract Integration Tests

### Contract Interaction
- Proper interaction between LandRegistry and RenewalApproval
- Proper interaction between LandRegistry and TransferApproval
- State synchronization across contracts

### Permission Management
- Cross-contract role verification
- Permission propagation
- Access control across contract boundaries

## 5. Event Verification
- Correct event emission
- Accurate event parameter values
- Event sequence validation

## 6. Error Handling
- Access control violations
- Invalid state transitions
- Business rule violations
- Request validation failures

## Test Execution

To run all tests:
```bash
npx hardhat test
```

To run specific test file:
```bash
npx hardhat test test/LandRegistry.test.js
npx hardhat test test/RenewalApproval.test.js
npx hardhat test test/TransferApproval.test.js
```

## Test Coverage Ensures:
- Complete functional verification
- Proper access control
- Data integrity
- Business rule compliance
- Cross-contract interaction validity
- Event handling accuracy
- Error handling robustness 