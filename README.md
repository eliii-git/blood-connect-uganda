# Blood Connect Uganda

BLOODNET+ – PRODUCTION MASTER PROMPT (UGANDA EDITION)

PROJECT OVERVIEW

Build a production-ready, AI-powered healthcare platform called BloodNet+, designed specifically for Uganda.

BloodNet+ is a nationwide digital blood donation ecosystem that connects:

Donors

Hospitals

Blood Banks

Administrators

in real time to reduce the time required to locate compatible blood during emergencies.

This application must function like a real-world SaaS product, not a prototype or static demo.

Every feature should interact with the database.

Every role must be fully functional.

Every page must contain working CRUD operations using Supabase.

The application should feel comparable to premium software like Stripe, Linear, Notion, Airbnb, or Apple.

TARGET COUNTRY

This platform is built ONLY FOR UGANDA.

Every feature should reflect Uganda's healthcare ecosystem.

Use Uganda as the default country everywhere.

Supported cities and districts should include realistic Ugandan locations such as:

Kampala

Wakiso

Mukono

Jinja

Mbarara

Gulu

Mbale

Arua

Masaka

Fort Portal

Kabale

Lira

Soroti

Hoima

Entebbe

Phone numbers must use:

+256

Currency:

UGX (Ugandan Shillings)

Time Zone:

East Africa Time (EAT)

Maps should open in Uganda by default.

TECH STACK

Use:

React

TypeScript

Tailwind CSS

React Router

Supabase Authentication

Supabase PostgreSQL

Supabase Realtime

TanStack Query

React Hook Form

Zod

Framer Motion

Lucide Icons

Create placeholders for:

OpenAI API

Google Maps API

Firebase Cloud Messaging

Twilio

Email Service

The project must compile and run without API keys.

Clearly comment where API keys belong.

APPLICATION REQUIREMENTS

This must NOT behave like a frontend-only demo.

Instead:

• Every form saves data.

• Every edit updates data.

• Every delete removes records.

• Every notification is generated dynamically.

• Every dashboard loads real data from Supabase.

• Authentication is real.

• Permissions are enforced.

• Realtime updates use Supabase Realtime.

AUTHENTICATION

Implement secure authentication.

Support:

Login

Registration

Forgot Password

Email Verification (placeholder)

Session Persistence

Logout

After login automatically redirect users to their own dashboard.

USER ROLES

There are exactly four user roles.

Donor

Hospital

Blood Bank

Admin

Each role has:

Separate dashboard

Separate sidebar

Separate navigation

Separate permissions

Separate profile

Separate settings

Separate notifications

Users must NEVER access another role's pages.

Implement full Role-Based Access Control (RBAC).

DONOR

Donors must be able to:

Register

Edit profile

Upload profile photo

Upload National ID

Manage health information

Manage emergency contact

Enable GPS

Update availability

Accept donation requests

Reject donation requests

Book appointments

Cancel appointments

Reschedule appointments

View nearby hospitals

View nearby blood banks

Receive emergency alerts

Receive notifications

View donation history

Download digital donor card

Earn rewards

Earn badges

Track lives saved

View certificates

Chat with hospitals

Chat with blood banks

Bookmark hospitals

Rate hospitals

View achievements

Manage account settings

Delete account

HOSPITAL

Hospitals must be fully functional.

Hospitals can:

Register hospital

Upload license

Manage hospital profile

Create emergency requests

Cancel emergency requests

View nearby donors

View nearby blood banks

Search compatible donors

View AI recommendations

Track request status

Approve appointments

Reject appointments

Chat with donors

Chat with blood banks

Manage patient requests

Manage blood demand

Manage staff account

Export reports

View analytics

Receive live notifications

Manage emergency queue

Bookmark donors

Rate blood banks

View maps

View dashboard analytics

BLOOD BANK

Blood Banks must have full functionality.

Blood Banks can:

Register

Upload verification documents

Manage profile

Manage inventory

Add blood units

Remove blood units

Update expiry dates

Track stock

Track incoming donations

Track outgoing blood

Receive hospital requests

Accept requests

Reject requests

Chat with hospitals

Chat with donors

Manage appointments

View analytics

Receive emergency alerts

Rate hospitals

Generate inventory reports

Manage notifications

Manage staff

ADMIN

Admin has complete control.

Admin can:

Approve donors

Reject donors

Approve hospitals

Reject hospitals

Approve blood banks

Reject blood banks

Suspend users

Delete users

View analytics

Manage platform settings

View audit logs

View emergencies

Monitor system health

Manage FAQs

Manage announcements

Export reports

Monitor realtime activity

View all users

Manage notifications

Reset accounts

Manage roles

Manage permissions

AI ASSISTANT

Hospitals have an AI assistant.

Hospital types:

"I need 5 units of O Negative in Kampala."

AI returns:

Compatible donors

Nearby blood banks

Estimated arrival

Compatibility score

Distance

Travel time

Contact buttons

Navigation

Chat

Call

Accept

Use placeholder OpenAI integration.

SMART MATCHING ENGINE

Automatically calculate donor ranking using:

Blood compatibility

Distance

Current availability

Eligibility

Hospital priority

Traffic estimate

Travel time

GPS

Age of request

Display Match Score (0–100%).

EMERGENCY MODE

Hospitals create emergencies.

Required fields:

Blood Type

Units Needed

Patient Condition

Urgency

Hospital

Notes

Submitting automatically:

Creates database record

Sends notifications

Updates emergency feed

Updates maps

Starts countdown

Shows realtime responses

REALTIME CHAT

Realtime messaging.

Support:

Hospital ↔ Donor

Hospital ↔ Blood Bank

Blood Bank ↔ Donor

Features:

Typing

Read receipts

Attachments placeholder

Voice placeholder

Location sharing

Search

Reactions

Online indicator

Pinned chats

LIVE MAP

Default country:

Uganda

Display:

Hospitals

Blood Banks

Donors

Emergency requests

Routes

Travel time

Filtering

Radius search

Blood type

Availability

DATABASE

Design a normalized relational database.

Tables include:

Users

Profiles

Donors

Hospitals

BloodBanks

Appointments

EmergencyRequests

EmergencyResponses

Notifications

Messages

Chats

Inventory

BloodUnits

Rewards

Achievements

Certificates

Bookmarks

Ratings

AuditLogs

Settings

Reports

All foreign keys must be correctly related.

Enable Row Level Security (RLS) with policies enforcing RBAC.

SAMPLE DATA

Populate the database with realistic Ugandan data:

Hospitals

Blood banks

Districts

Donors

Emergency requests

Appointments

Messages

Blood inventory

Achievements

Notifications

All names, phone numbers, and locations should resemble realistic Ugandan data.

SECURITY

Implement:

Supabase Auth

Protected routes

Role guards

RLS

Session management

Permission middleware

Secure API placeholders

Audit logging

USER EXPERIENCE

Modern healthcare UI using:

Glassmorphism

Rounded corners

Dark mode

Light mode

Framer Motion animations

Responsive layouts

Loading skeletons

Toast notifications

Error boundaries

Accessibility (WCAG)

Keyboard navigation

Progressive Web App (PWA) support

Offline placeholders

FINAL GOAL

BloodNet+ must behave like a real healthcare management platform rather than a presentation-only prototype.

Every role (Donor, Hospital, Blood Bank, and Admin) must have a complete, working experience with authenticated access, role-based permissions, functional dashboards, real CRUD operations backed by Supabase, realtime updates, realistic Ugandan workflows, and seamless navigation.

The application should be polished enough for a university capstone, hackathon, investor presentation, or deployment after integrating the external APIs.

This project is built and maintained as an open-source healthcare platform.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
