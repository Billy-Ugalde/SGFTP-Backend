# Newsletter/Mass Email Module

## Overview
This module allows administrators to send mass emails to different audiences using a standardized HTML template.

## Features
- ✅ Send mass emails to multiple audience types
- ✅ Language-based filtering (Spanish/English)
- ✅ Active users filtering
- ✅ Campaign tracking and statistics
- ✅ Beautiful HTML email templates
- ✅ Role-based access control (SUPER_ADMIN, GENERAL_ADMIN, CONTENT_ADMIN)

## Audience Types

### 1. Registered Users (`registered`)
All registered and active users in the system with verified emails.

### 2. Donors (`donors`)
Users with the "donor" role in the system.

### 3. Newsletter Subscribers (`newsletter`)
People subscribed to the newsletter (filtered by language preference).

### 4. All (`all`)
Combination of all audience types.

## API Endpoints

### 1. GET `/api/newsletters/audiences`
Get available audiences with counts.

**Query Parameters:**
- `language` (optional): `spanish` | `english` | `both` (default: `both`)

**Response:**
```json
{
  "audiences": [
    {
      "type": "registered",
      "name": "Registered Users",
      "count": 150,
      "description": "All registered and active users in the system"
    },
    {
      "type": "donors",
      "name": "Donors",
      "count": 45,
      "description": "Users marked as donors"
    },
    {
      "type": "newsletter",
      "name": "Newsletter Subscribers",
      "count": 320,
      "description": "Newsletter subscription list"
    }
  ]
}
```

### 2. POST `/api/newsletters/send`
Send a mass email campaign.

**Request Body:**
```json
{
  "subject": "Important Update",
  "content": "Email content here...",
  "language": "spanish",
  "audienceTypes": ["registered", "newsletter"],
  "activeUsersOnly": true
}
```

**Response:**
```json
{
  "id": 1,
  "totalRecipients": 470,
  "successfulSends": 468,
  "failedSends": 2,
  "status": "partial",
  "errors": [
    "Failed to send to user@example.com: Connection timeout"
  ]
}
```

### 3. GET `/api/newsletters/campaigns`
Get paginated list of sent campaigns.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "campaigns": [
    {
      "id": 1,
      "subject": "Important Update",
      "language": "spanish",
      "audienceTypes": ["registered", "newsletter"],
      "totalRecipients": 470,
      "successfulSends": 468,
      "failedSends": 2,
      "status": "partial",
      "sentAt": "2025-10-06T10:30:00Z",
      "sentBy": {
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "totalPages": 3
}
```

### 4. GET `/api/newsletters/campaigns/:id`
Get detailed information about a specific campaign.

**Response:**
```json
{
  "id": 1,
  "subject": "Important Update",
  "content": "Full email content...",
  "language": "spanish",
  "audienceTypes": ["registered", "newsletter"],
  "activeUsersOnly": true,
  "totalRecipients": 470,
  "successfulSends": 468,
  "failedSends": 2,
  "status": "partial",
  "sentAt": "2025-10-06T10:30:00Z",
  "errors": ["Failed to send to user@example.com: Connection timeout"],
  "sentBy": {
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

## Campaign Status
- `completed`: All emails sent successfully
- `failed`: All emails failed to send
- `partial`: Some emails sent, some failed

## Language Options
- `spanish`: Spanish language emails
- `english`: English language emails

## Permissions
The following roles have access to newsletter features:
- `SUPER_ADMIN`: Full access
- `GENERAL_ADMIN`: Full access
- `CONTENT_ADMIN`: Full access

## Email Template
The module uses a beautiful, responsive HTML template that includes:
- Foundation branding and colors
- Responsive design for mobile devices
- Professional styling
- Bilingual support (Spanish/English)
- Social media links section
- Unsubscribe link

## Database Schema

### `newsletter_campaigns` Table
| Column | Type | Description |
|--------|------|-------------|
| id | int (PK) | Campaign ID |
| subject | varchar(100) | Email subject |
| content | text | Email body content |
| language | enum | spanish or english |
| audienceTypes | simple-array | Array of audience types |
| activeUsersOnly | boolean | Filter for active users only |
| sent_by | int (FK) | User ID who sent the campaign |
| sent_at | timestamp | When campaign was sent |
| totalRecipients | int | Total number of recipients |
| successfulSends | int | Number of successful sends |
| failedSends | int | Number of failed sends |
| status | enum | completed, failed, or partial |
| errors | json | Array of error messages |

## Dependencies
- `nodemailer`: Email sending
- `typeorm`: Database ORM
- Existing modules: `subscribers`, `users`, `auth`

## Configuration
Ensure these environment variables are set:
- `EMAIL_USER`: SMTP username (Gmail)
- `EMAIL_PASS`: SMTP password/app password
- `EMAIL_FROM`: Sender email address

## Notes
- The module automatically deduplicates email addresses across different audiences
- Language filtering applies to newsletter subscribers based on their `preferredLanguage`
- Registered users and donors don't currently have language preference (sends to all)
- Email sending includes retry logic on failure
- All email operations are tracked in the database for audit purposes
