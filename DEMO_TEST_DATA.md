# Property Demo Test Data - Additional Information

## Correct Property ID Format

Property IDs should follow the format: `STATE-CITY-YEAR-NUMBER`

Examples:
- `NSW-SYD-2025-001` (New South Wales, Sydney, 2025, Property 001)
- `VIC-MEL-2025-001` (Victoria, Melbourne, 2025, Property 001)
- `QLD-BNE-2025-001` (Queensland, Brisbane, 2025, Property 001)
- `WA-PER-2025-001` (Western Australia, Perth, 2025, Property 001)

## Recommended Test Property IDs

### Primary Test Property
**Property ID**: `NSW-SYD-2025-001`
- **Owner**: `0x44902901fD5C220B9c2D562850F02D538a05D5d1`
- **Agent**: `0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb`
- **Location**: `123 Main Street, Sydney, NSW 2000`
- **Status**: `Active`
- **Area**: `500 sqm`

### Secondary Test Property
**Property ID**: `VIC-MEL-2025-001`
- **Owner**: `0x2bB9CF5C0786a3f592317949Aa102D16d83464C3`
- **Agent**: `0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb`
- **Location**: `456 Collins Street, Melbourne, VIC 3000`
- **Status**: `Active`
- **Area**: `750 sqm`

### Additional Test Property
**Property ID**: `QLD-BNE-2025-001`
- **Owner**: `0x123456789aBcDeF123456789aBcDeF123456789a`
- **Agent**: `0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb`
- **Location**: `789 Queen Street, Brisbane, QLD 4000`
- **Status**: `Pending`
- **Area**: `300 sqm`

## Complete Test Property Data

### NSW-SYD-2025-001 (Primary Demo Property)

**Basic Information**:
- **Folio Number**: NSW-SYD-2025-001
- **Owner Address**: 0x44902901fD5C220B9c2D562850F02D538a05D5d1
- **Agent Address**: 0x742d35Cc6634C0532925a3b8D57C3e0C6C6394fb
- **Location**: 123 Main Street, Sydney, NSW 2000, Australia
- **Area Size**: 500 sqm
- **Property Type**: Residential
- **Status**: Active
- **Registration Date**: 2025-01-01
- **Expiry Date**: 2030-01-01

**Documents Required**:
1. **Property Deed** (deed.pdf)
2. **Survey Report** (survey.pdf)
3. **Title Certificate** (title.pdf)
4. **Building Plans** (plans.pdf)
5. **Compliance Certificate** (compliance.pdf)

**IPFS Metadata Example**:
```json
{
  "property_type": "residential",
  "bedrooms": 4,
  "bathrooms": 2,
  "garage": 2,
  "land_area": "500 sqm",
  "building_area": "250 sqm",
  "year_built": 2020,
  "council": "City of Sydney",
  "zoning": "R2 - Low Density Residential"
}
```

## State Code Explanations

**Australia State Codes**:
- **NSW**: New South Wales (Sydney, Newcastle, Wollongong)
- **VIC**: Victoria (Melbourne, Geelong, Ballarat)
- **QLD**: Queensland (Brisbane, Gold Coast, Cairns)
- **WA**: Western Australia (Perth, Fremantle)
- **SA**: South Australia (Adelaide)
- **TAS**: Tasmania (Hobart)
- **ACT**: Australian Capital Territory (Canberra)
- **NT**: Northern Territory (Darwin)

## Demo Considerations

### File Preparation Requirements
1. **File Format**: Only PDF files accepted
2. **File Size**: Maximum 10MB per file
3. **File Names**: Should be descriptive (e.g., "property_deed.pdf")
4. **Required Documents**: At least 3 documents required for registration
5. **IPFS Upload**: Files automatically uploaded to IPFS during registration

### If Format Errors Occur
1. **Check Property ID Format**: Must follow STATE-CITY-YEAR-NUMBER pattern
2. **Verify File Types**: Only PDF files are accepted
3. **Check File Sizes**: Each file must be under 10MB
4. **Ensure Required Fields**: All mandatory fields must be filled
5. **Verify Ethereum Addresses**: Must be valid 42-character addresses starting with 0x

### Demo Flow Recommendations
1. **Start with Primary Property**: Use NSW-SYD-2025-001 for main demo
2. **Use Test Accounts**: Pre-configured addresses work best
3. **Upload Sample Files**: Prepare PDF files in advance
4. **Check Agent Authorization**: Ensure agent is authorized before transfers
5. **Verify MetaMask**: Ensure correct network and sufficient gas

### Common Demo Issues
1. **MetaMask Not Connected**: Ensure MetaMask is installed and connected
2. **Wrong Network**: Verify using correct Ethereum network (localhost/testnet)
3. **Insufficient Gas**: Ensure accounts have enough ETH for transactions
4. **Agent Not Authorized**: Agent must be authorized before managing properties
5. **File Upload Fails**: Check IPFS connection and file formats

This test data provides a comprehensive foundation for demonstrating all system features including property registration, agent authorization, transfers, and renewals. 