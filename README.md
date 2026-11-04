# Improved Data Leakage Detection System (LeakTrace Forensic Platform)

An enterprise-grade secure file distribution, steganographic watermarking, and forensic leak attribution platform built with the MERN/Node architecture.

Connected with Stitch UI Prototype: [LeakTrace Forensic Watermarking Portal (Stitch Project #8064901582218045700)](https://stitch.withgoogle.com/projects/8064901582218045700?pli=1).

---

## 👥 Project Team & Contributors

| Member Name | Student ID | Core Module & Test Case Responsibilities |
| :--- | :--- | :--- |
| **Fahim Bin Zaman** | **24524203055** | File Format Validation `[FR-1]`, Upload Size Boundaries `[FR-1]`, Concurrent Allocation Limit `[FR-2]` |
| **Abid Ajmal Tahmid** | **24524203133** | Steganographic UUID v4 Token `[FR-3]`, Image LSB Dimensions `[FR-3]`, Text Payload Capacity `[FR-3]` |
| **Hojaifa** | **24524203181** | Bit Error Rate Tolerance `[FR-5]`, Forensic Carrier Formats `[FR-5]`, Attribution Match Threshold `[FR-5]` |
| **Team Member** | **24524203023** | Audit Date Filters `[FR-4]`, Access Expiration Limits `[FR-2]`, SMTP Batch Dispatch Limiter `[NFR-3]` |

---

## ⚡ Key Capabilities & Specifications

1. **FR-1: Secure File Upload & Validation**
   - Supports `.txt`, `.jpg`, `.jpeg`, `.bmp` carrier formats.
   - Enforces upload boundaries: Minimum 1 Byte, Maximum 50 MB ($52,428,800\text{ Bytes}$).
   - Computes SHA-256 cryptographic checksums for immutability.

2. **FR-2: Target Agent Allocation & Expiration**
   - Granular multi-agent selection: Enforces boundary of [1 to 20 recipients] per allocation cycle.
   - Configurable access validity duration: [1 to 30 days] before automatic download revocation.
   - Batch notification dispatcher partitioned into maximum 10 recipients per batch (`NFR-3`).

3. **FR-3: Steganographic Watermarking Engine**
   - **Text Steganography**: Zero-width unicode encoding (`\u200B` = 0, `\u200C` = 1, `\uFEFF` sync headers). Enforces a minimum cover text capacity threshold of $\ge 50$ words.
   - **Image Steganography**: LSB pixel matrix watermarking for 24-bit `.bmp` and `.jpg` carriers. Enforces a minimum resolution floor of $\ge 256 \times 256$ pixels.
   - **Tracking Tokens**: Strict validation of RFC 4122 canonical UUID v4 hexadecimal tokens (`8-4-4-4-12`).

4. **FR-4: Audit Trail & Database Logging**
   - Tamper-evident ledger tracking uploads, allocations, downloads, leak analyses, and logins.
   - Date range query engine with boundary validation ($Start \le End$, future dates strictly blocked).

5. **FR-5: Forensic Leak Analysis & Attribution**
   - Intercepted artifact carrier validation (rejects `.zip`, `.mp4`, etc.).
   - Error-correcting decoder tolerates a maximum Bit Error Rate (BER) of $\le 5.0\%$.
   - Bitwise Hamming distance comparison against allocation ledger.
   - Confirms positive agent attribution when match confidence is $\ge 80.0\%$. Classification defaults to *Inconclusive / Tampered* below 80.0%.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+ recommended, tested on v24)
- npm (v9+)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Automated Test Suite (12 EP & BVA Test Cases)
```bash
npm test
```
*Executes all 12 test cases specified in `Equivalence_Partitioning_and_BVA_Test_Cases.md` with 100% pass verification.*

### 4. Start the Application
```bash
npm start
```
The server will boot and serve the full application at:
```
http://localhost:5000
```

---

## 🔑 Default Personnel Credentials

| Role | Name | Email | Password | Clearance |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Fahim Bin Zaman | `admin@leaktrace.internal` | `Password123!` | TOP-SECRET (MFA Token: `123456`) |
| **Security Agent** | Abid Ajmal Tahmid | `abid@leaktrace.internal` | `Password123!` | SECRET |
| **Security Agent** | Hojaifa | `hojaifa@leaktrace.internal` | `Password123!` | SECRET |
| **Security Agent** | Team Member | `member@leaktrace.internal` | `Password123!` | CONFIDENTIAL |
| **Agents 04–25** | Enclave Agents | `agent4@leaktrace.internal` ... | `Password123!` | CONFIDENTIAL |

---

## 🧪 Equivalence Partitioning & Boundary Value Analysis Test Matrix

| TC ID | Member | Feature | Technique | Boundary / Input Condition | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-DLD-EP-01** | Fahim (3055) | FR-1 File Format | EP | Rejects `.pdf`, `.exe`; accepts `.txt`, `.jpg`, `.bmp` | ✅ PASS |
| **TC-DLD-BVA-01** | Fahim (3055) | FR-1 File Size | BVA | 0B (Invalid), 50.0 MB (Valid), 50.1 MB (413 Payload Too Large) | ✅ PASS |
| **TC-DLD-BVA-02** | Fahim (3055) | FR-2 Batch Count | BVA | 0 agents (Invalid), 1–20 agents (Valid), 21 agents (Rejected) | ✅ PASS |
| **TC-DLD-EP-02** | Abid (3133) | FR-3 Tracking Token | EP | Validates 36-char canonical RFC 4122 UUID v4 | ✅ PASS |
| **TC-DLD-BVA-03** | Abid (3133) | FR-3 Image Resolution| BVA | 255x255 px (Rejected), 256x256 px (Accepted) | ✅ PASS |
| **TC-DLD-BVA-04** | Abid (3133) | FR-3 Text Word Count | BVA | 49 words (Capacity rejection), 50 words (Accepted) | ✅ PASS |
| **TC-DLD-BVA-05** | Hojaifa (3181) | FR-5 BER Tolerance | BVA | BER = 5.0% (Tolerable), BER = 5.1% (Corrupted/Damaged error) | ✅ PASS |
| **TC-DLD-EP-03** | Hojaifa (3181) | FR-5 Forensic Upload | EP | Rejects `.zip` archives, accepts `.txt`, `.jpg`, `.bmp` | ✅ PASS |
| **TC-DLD-BVA-06** | Hojaifa (3181) | FR-5 Match Threshold | BVA | 79.9% (Inconclusive), 80.0% (Confirmed Attribution) | ✅ PASS |
| **TC-DLD-EP-04** | Member (3023) | FR-4 Date Range Filter| EP | Rejects Start > End and future dates | ✅ PASS |
| **TC-DLD-BVA-07** | Member (3023) | FR-2 Access Expiry | BVA | 0 days (Invalid), 1–30 days (Valid), 31 days (Rejected) | ✅ PASS |
| **TC-DLD-BVA-08** | Member (3023) | NFR-3 Email Limiter | BVA | 10 emails (1 batch), 11 emails (2 batches: 10 + 1) | ✅ PASS |

---

## 📂 Project Directory Structure

```
Data-leackage/
├── package.json                          # NPM dependencies & scripts
├── README.md                             # Project documentation
├── Equivalence_Partitioning_and_BVA_Test_Cases.md  # Test case specifications
├── Fahim_Test_Cases.tex                  # LaTeX project report
├── project_srs/                          # SRS documentations
├── sample_data/                          # Ready-to-use carrier & test files
├── server/
│   ├── index.js                          # Express application entry
│   ├── config.js                         # Centralized thresholds & constants
│   ├── db/
│   │   └── index.js                      # Database persistence & audit logger
│   ├── middleware/
│   │   ├── auth.js                       # JWT & Role validation
│   │   └── upload.js                     # Multer format & size boundary filter
│   ├── stego/
│   │   ├── tokenValidator.js             # RFC 4122 UUID v4 parser
│   │   ├── textStego.js                  # Zero-width text watermarking & decoder
│   │   ├── imageStego.js                 # LSB image watermarking & decoder
│   │   └── forensicEngine.js             # Hamming distance, BER & attribution
│   ├── controllers/
│   │   ├── authController.js             # Login, MFA challenge & profiles
│   │   ├── fileController.js             # Vault ingestion & stego distribution
│   │   ├── investigateController.js      # Leak extraction & attribution
│   │   ├── auditController.js            # Audit ledger queries & date filters
│   │   ├── agentController.js            # Enclave agent management
│   │   └── notificationService.js        # SMTP rate limit batcher
│   └── routes/                           # API route definitions
├── public/                               # Interactive Single-Page Application (Stitch UI)
│   ├── index.html                        # Cyber-Forensic dark interface
│   ├── app.js                            # Client-side reactivity & API integration
│   └── styles.css                        # Theme extensions & glow styling
└── tests/
    └── testCases.test.js                 # Automated suite for all 12 EP & BVA tests
```

