# Payroll Distribution System

Secure payroll distribution web application built with Next.js 16+, MongoDB, and Microsoft authentication.

## Features

- **Microsoft Authentication**: Login with company Microsoft 365 accounts
- **Employee Management**: Add, edit, delete employees, mass upload via XLSX
- **PDF Encryption**: Automatic password protection with employee-specific codes
- **Email Delivery**: Send encrypted PDFs via SMTP or Microsoft Graph API
- **Individual & Mass Send**: Send single payrolls or batch process multiple files
- **Tracking**: Complete history of sent payrolls with status monitoring

## Tech Stack

- **Framework**: Next.js 16+ (App Router, Server Actions)
- **Database**: MongoDB with Mongoose
- **Authentication**: Auth.js v5 with Microsoft Entra ID
- **Email**: Nodemailer (SMTP) or Microsoft Graph API
- **PDF**: pdf-lib for encryption
- **UI**: Shadcn/ui components with Tailwind CSS
- **Validation**: Zod schemas with TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or cloud)
- Azure AD App Registration (see SETUP.md)
- SMTP server OR Microsoft Graph API access

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd berlap
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your credentials (see SETUP.md for details)

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Login page
│   ├── dashboard/         # Protected dashboard
│   │   ├── page.tsx       # Overview with statistics
│   │   ├── employees/     # Employee management
│   │   └── send/          # Payroll sending
│   └── api/auth/          # Auth.js routes
├── actions/               # Server Actions
│   ├── employeeActions.ts # Employee CRUD, XLSX upload
│   └── payrollActions.ts  # Send individual/mass
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── EmployeeDialog.tsx
│   ├── EmployeesClient.tsx
│   └── SendPageClient.tsx
├── lib/                   # Utilities
│   ├── auth.ts           # Auth.js configuration
│   ├── mongodb.ts        # Database connection
│   ├── email.ts          # Unified email interface
│   ├── graph.ts          # Microsoft Graph client
│   └── pdf.ts            # PDF encryption
└── models/                # Mongoose models
    ├── Employee.ts
    └── SentPayroll.ts
```

## XLSX Format for Mass Upload

Excel file with columns (A-E):

| Name | Email | Password Hint | PDF Name | Password |
|------|-------|------|----------|----------|
| John Doe | john@company.hu | Last 4 digits of tax ID | berlap_jan2026_john.pdf | secret123 |

Password hint is sent to the employee's email address.
PDF name is used to match the PDF file to the employee on mass upload.

## Usage

1. **Login**: Use your Microsoft 365 account
2. **Add Employees**: Manually or via XLSX upload
3. **Send Payrolls**: 
   - Individual: Select employee, upload PDF → encrypted & sent
   - Mass: Upload multiple PDFs → auto-match by filename → send all
4. **Track**: View sent payrolls in dashboard overview

## Security

- All routes protected except login
- PDFs encrypted with employee-specific passwords
- Passwords stored in MongoDB (consider encryption at rest)
- HTTPS required in production
- Microsoft authentication for access control

## Documentation

- **SETUP.md**: Detailed Azure AD and environment setup
- **.env.example**: Environment variable template

## License

MIT
