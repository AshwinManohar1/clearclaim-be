# API Testing - cURL Commands

## Base URL
```
http://localhost:8000
```

## 1. Health Check

```bash
curl --location 'http://localhost:8000/health'
```

## 2. Create a Claim

```bash
curl --location 'http://localhost:8000/api/claims' \
--header 'Content-Type: application/json' \
--data '{
    "patientDetails": {
        "name": "Bikash Ranjan"
    },
    "prescriptionsUrls": [
        {
            "url": "https://api.getvisitapp.com/v3/reimbursements/6091928/b3c6b0f793da7964b3445253c94c593a.jpg"
        }
    ],
    "invoiceUrls": [
        {
            "url": "https://api.getvisitapp.com/v3/reimbursements/6091928/fff150710134ad80526827b5b5a94990.jpg"
        }
    ],
    "supportDocumentsUrl": [],
    "userRaisedAmount": "618.00",
    "requestDate": "15/12/2025",
    "policyDocuments": [
        {
            "policyName": "Niva Bupa"
        }
    ]
}'
```

**Note:** 
- `policyName` must be either `"Niva Bupa"` or `"Aditya Birla Health Insurance"`
- `supportDocumentsUrl` is optional (used for lab reports)
- Background processing will automatically: digitize documents → match items → adjudicate → update status

**Response:** Returns the created claim with status "pending". Background processing will start automatically.

## 3. Get All Claims

```bash
curl --location 'http://localhost:8000/api/claims?page=1&limit=10'
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Number of items per page

## 4. Get Claim by ID

```bash
curl --location 'http://localhost:8000/api/claims/{CLAIM_ID}'
```

**Example:**
```bash
curl --location 'http://localhost:8000/api/claims/65a1b2c3d4e5f6a7b8c9d0e1'
```

Replace `{CLAIM_ID}` with the actual claim ID from the create claim response.

## 5. Submit a Claim

```bash
curl --location --request POST 'http://localhost:8000/api/claims/{CLAIM_ID}/submit' \
--header 'Content-Type: application/json'
```

**Example:**
```bash
curl --location --request POST 'http://localhost:8000/api/claims/65a1b2c3d4e5f6a7b8c9d0e1/submit' \
--header 'Content-Type: application/json'
```

**Note:** This endpoint will only work if the claim status is "adjudicated". The claim must have completed background processing (digitization and adjudication) before it can be submitted.

---

## Testing Flow

1. **Create a claim** - Use endpoint #2 with the new input structure. Save the `_id` from the response.
2. **Check claim status** - Use endpoint #4 with the saved ID. The status will progress through:
   - `pending` → `digitizing` → `adjudicating` → `adjudicated`
   - Background processing includes: digitization → matching → adjudication
3. **Get all claims** - Use endpoint #3 to see all claims.
4. **Submit claim** - Once status is `adjudicated`, use endpoint #5 to submit.

## Example with Aditya Birla Policy

```bash
curl --location 'http://localhost:8000/api/claims' \
--header 'Content-Type: application/json' \
--data '{
    "patientDetails": {
        "name": "John Doe"
    },
    "prescriptionsUrls": [
        {
            "url": "https://example.com/prescription.pdf"
        }
    ],
    "invoiceUrls": [
        {
            "url": "https://example.com/invoice.pdf"
        }
    ],
    "supportDocumentsUrl": [
        {
            "url": "https://example.com/lab-report.pdf"
        }
    ],
    "userRaisedAmount": "1500.00",
    "requestDate": "20/12/2025",
    "policyDocuments": [
        {
            "policyName": "Aditya Birla Health Insurance"
        }
    ]
}'
```

---

## Example Response Formats

### Create Claim Response
```json
{
    "success": true,
    "data": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "patientDetails": {
            "name": "Bikash Ranjan"
        },
        "prescriptionsUrls": [
            {
                "url": "https://..."
            }
        ],
        "invoiceUrls": [
            {
                "url": "https://..."
            }
        ],
        "supportDocumentsUrl": [],
        "userRaisedAmount": "618.00",
        "requestDate": "15/12/2025",
        "policyDocuments": [
            {
                "policyName": "Niva Bupa"
            }
        ],
        "policyName": "Niva Bupa",
        "status": "pending",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "message": "Claim created successfully"
}
```

### Get All Claims Response
```json
{
    "success": true,
    "data": {
        "claims": [...],
        "total": 10,
        "page": 1,
        "totalPages": 1
    }
}
```

### Get Claim by ID Response (After Processing)
```json
{
    "success": true,
    "data": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "patientDetails": {
            "name": "Bikash Ranjan"
        },
        "prescriptionsUrls": [...],
        "invoiceUrls": [...],
        "supportDocumentsUrl": [],
        "userRaisedAmount": "618.00",
        "requestDate": "15/12/2025",
        "policyDocuments": [...],
        "policyName": "Niva Bupa",
        "status": "adjudicated",
        "prescriptionData": {...},
        "invoiceData": {...},
        "labReportData": {...},
        "medicineMatches": [...],
        "labTestMatches": [...],
        "othersMatches": [...],
        "adjudicationResult": {
            "approved": true,
            "rejectionReasons": [],
            "notes": "Adjudication completed successfully - all checks passed",
            "processedAt": "2024-01-15T10:35:00.000Z",
            "matchingResults": {
                "medicines": [...],
                "labTests": [...],
                "others": [...]
            },
            "policyValidation": {
                "isActive": true,
                "isDateValid": true,
                "benefitCoverage": true,
                "coverageLimits": true
            }
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:35:00.000Z"
    }
}
```

### Submit Claim Response
```json
{
    "success": true,
    "data": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "status": "submitted",
        ...
    },
    "message": "Claim submitted successfully"
}
```

---

## Error Responses

### 400 Bad Request (Missing Required Fields)
```json
{
    "success": false,
    "message": "patientDetails.name is required"
}
```

### 400 Bad Request (Invalid Policy)
```json
{
    "success": false,
    "message": "Invalid policy name: InvalidPolicy. Must be \"Niva Bupa\" or \"Aditya Birla Health Insurance\""
}
```

### 400 Bad Request (Missing Arrays)
```json
{
    "success": false,
    "message": "prescriptionsUrls (non-empty array) is required"
}
```

### 404 Not Found
```json
{
    "success": false,
    "message": "Claim not found"
}
```

### 400 Bad Request (Submit without adjudication)
```json
{
    "success": false,
    "message": "Claim must be in 'adjudicated' status to submit. Current status: pending"
}
```
