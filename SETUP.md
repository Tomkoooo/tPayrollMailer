# Setup Guide - Bérlap Distribution System

Complete setup instructions for deploying the payroll distribution application.

## Prerequisites

- **Node.js**: v18 or later
- **MongoDB**: Local or Atlas connection
- **QPDF**: Required for PDF encryption
  - **macOS**: `brew install qpdf`
  - **Linux**: `sudo apt install qpdf`
- Azure account with admin privileges
- SMTP server credentials OR Microsoft 365 with Global Admin access

---

## 1. Authentication (Local Email/Password)

The system uses local email and password authentication stored in MongoDB.

### First Admin Registration
When you first run the application and navigate to `/login`, if the database is empty, you will be presented with a **"Register First Admin"** form.
Use this to create your initial administrator account.

### Subsequent Logins
Once an admin exists, the login page will show a standard email/password login form.

### Managing Admins
Logged-in administrators can create or delete other admin accounts via the **"Adminok"** section in the dashboard.

---

## 2. Microsoft Graph API Setup (Optional - for Graph Email)

If using `EMAIL_PROVIDER=graph` (Microsoft Graph for email sending):

### Step 2.1: Create Separate App Registration

1. **Microsoft Entra ID** → **App registrations** → **New registration**
2. Configure:
   - **Name**: Bérlap Distribution - Graph API
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: None (not needed for app permissions)
3. Click **Register**
4. Copy from Overview:
   - **Application (client) ID** → `AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → `AZURE_TENANT_ID`
5. **Certificates & secrets** → **New client secret**
   - Copy **Value** → `AZURE_CLIENT_SECRET`

### Step 2.2: Configure API Permissions

1. Go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph** → **Application permissions**
3. Find and add: **Mail.Send**
4. Click **Add permissions**
5. **IMPORTANT**: Click **Grant admin consent for [Your Organization]**
   - This requires Global Administrator role
   - Status must show green checkmark

### Step 2.3: Configure Sending Mailbox

The app will send emails FROM a specific mailbox (e.g., penzugy@company.hu):

- Ensure the mailbox exists in Microsoft 365
- Set `FINANCE_EMAIL=penzugy@company.hu` in `.env.local`
- No additional permissions needed (application permissions cover this)

---

## 3. SMTP Setup (Alternative - Easier for Testing)

If using `EMAIL_PROVIDER=smtp` (recommended for development):

### Option A: Local Testing (MailHog/MailCatcher)

```bash
# Install MailHog (macOS)
brew install mailhog
mailhog

# Or use Docker
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

**.env.local** configuration:
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
FINANCE_EMAIL=penzugy@company.hu
```

View sent emails at: http://localhost:8025

### Option B: Production SMTP (e.g., Gmail, SendGrid)

**Gmail Example:**
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.forpsi.com
SMTP_PORT=465
SMTP_USER=noreply@tdarts.hu
SMTP_PASS=your-password
FINANCE_EMAIL=noreply@tdarts.hu
```

**Note**: Gmail requires App Password (not regular password)

---

## 4. MongoDB Setup

### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. **Database Access**: Create user with read/write access
4. **Network Access**: Add your IP (or `0.0.0.0/0` for testing)
5. Get connection string from **Connect** → **Connect your application**
6. Format: `mongodb+srv://username:password@cluster.mongodb.net/berlap?retryWrites=true&w=majority`

### Option B: Local MongoDB

```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Connection string
MONGODB_URI=mongodb://localhost:27017/berlap
```

---

## 5. Environment Variables Configuration

Create `.env.local` in project root:

```env
# Database
MONGODB_URI=your-mongodb-connection-string

# Auth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Microsoft Azure AD (Login)
AUTH_AZURE_AD_CLIENT_ID=from-step-1
AUTH_AZURE_AD_CLIENT_SECRET=from-step-1
AUTH_AZURE_AD_TENANT_ID=from-step-1

# Email Provider ('smtp' or 'graph')
EMAIL_PROVIDER=smtp

# SMTP (if using smtp)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=

# Graph API (if using graph)
AZURE_CLIENT_ID=from-step-2
AZURE_CLIENT_SECRET=from-step-2
AZURE_TENANT_ID=from-step-2

# Sender Email
FINANCE_EMAIL=penzugy@company.hu
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

## 6. Application Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 7. First Time Setup

1. **Login**: Click "Bejelentkezés Microsoft fiókkal"
2. **Add Test Employee**:
   - Go to Dolgozók → Új dolgozó
   - Fill in details (important: add a password for PDF encryption)
3. **Test Email Send**:
   - Go to Küldés
   - Select employee, upload a test PDF
   - Click send
   - Check SMTP inbox (MailHog at http://localhost:8025) or recipient email

---

### Employee Mass Upload

You can upload employees in bulk using an XLSX file with the following columns:

| Column | Name | Description |
| :--- | :--- | :--- |
| **A** | Név | Full name |
| **B** | Email | Email address |
| **C** | Jelszó emlékeztető | Hint sent in email (e.g. "Tax ID last 4 digits") |
| **D** | PDF fájlnév | Expected PDF filename (must match exactly) |
| **E** | Jelszó | Actual password for PDF encryption |

Download [example template](file:///Users/tomko/programing/berlap/templates/employees_template.xlsx) (Coming soon - use the format above).

---

## 9. Production Deployment

### Environment Updates

1. Update `NEXTAUTH_URL` to production domain
2. Add production callback URL to Azure App Registration:
   - `https://your-domain.com/api/auth/callback/azure-ad`
3. Use `EMAIL_PROVIDER=graph` for production (recommended)
4. Enable HTTPS (required for Auth.js)

### Security Checklist

- ✅ Use strong `NEXTAUTH_SECRET`
- ✅ MongoDB password is strong
- ✅ Azure client secrets are secured
- ✅ HTTPS enabled
- ✅ Environment variables not committed to git
- ✅ MongoDB network access restricted
- ✅ Consider encrypting employee passwords at rest

### Build & Deploy

```bash
# Build
npm run build

# Start production server
npm start
```

Or deploy to Vercel/Railway/DigitalOcean:
```bash
vercel deploy --prod
```

---

## 10. Troubleshooting

### Login Issues

- **Error: redirect_uri_mismatch**
  - Ensure Azure redirect URI exactly matches `NEXTAUTH_URL/api/auth/callback/azure-ad`
  
- **Error: AADSTS700016**
  - App registration not found → check `AUTH_AZURE_AD_CLIENT_ID`

### Email Issues

- **SMTP: Connection refused**
  - Check `SMTP_HOST` and `SMTP_PORT`
  - Ensure SMTP server is running
  
- **Graph: Unauthorized**
  - Verify admin consent granted for Mail.Send
  - Check `AZURE_CLIENT_ID` and `AZURE_CLIENT_SECRET`

### Database Issues

- **MongoNetworkError**
  - Check MongoDB is running
  - Verify `MONGODB_URI` connection string
  - Check network access (Atlas IP whitelist)

---

## Support

For issues, contact IT department or refer to:
- [Auth.js Documentation](https://authjs.dev)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph)
- [Next.js Documentation](https://nextjs.org/docs)
