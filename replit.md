# Barcode Scanner Application - Delivery Management System

## Overview

This is a mobile-first barcode scanner application designed for delivery management with email reporting capabilities. Built as a full-stack web application, it allows users to scan multiple barcodes, associate them with delivery note numbers, and automatically send reports via email.

The application is built using a modern React frontend with TypeScript, Express.js backend, and PostgreSQL database with Drizzle ORM. It's optimized for mobile devices and features real-time barcode scanning using the device camera.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for development and production builds
- **Barcode Scanning**: QuaggaJS library for camera-based barcode detection

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Email Service**: Nodemailer for SMTP email delivery
- **Session Storage**: In-memory storage with fallback to PostgreSQL
- **API Design**: RESTful API endpoints for scan session management

### Mobile-First Design
- Responsive design optimized for mobile devices
- Camera access for barcode scanning
- Touch-friendly interface with large buttons
- Swedish language interface for Nordic market

## Key Components

### Database Schema
- **scan_sessions**: Stores delivery sessions with barcode arrays and email status
- **users**: User authentication (prepared for future implementation)
- Uses JSONB for storing barcode arrays in PostgreSQL

### Core Features
1. **Barcode Scanning**: Real-time camera-based scanning with multiple format support
2. **Session Management**: Track delivery sessions with delivery note numbers
3. **Email Reporting**: Automated email delivery of scan results
4. **Mobile Camera Integration**: Direct camera access for barcode scanning

### API Endpoints
- `POST /api/scan-sessions` - Create new scan session
- `GET /api/scan-sessions/:id` - Retrieve scan session
- `PATCH /api/scan-sessions/:id` - Update session with new barcodes
- `POST /api/scan-sessions/:id/send-email` - Send email report

### UI Components
- **MobileCameraScanner**: Optimized camera scanner for mobile devices with flashlight and camera switching capabilities
- **ScannedBarcodesList**: Displays and manages scanned barcode list
- **shadcn/ui**: Comprehensive UI component library for consistent design

## Data Flow

1. **Session Creation**: User enters delivery note number and creates session
2. **Barcode Scanning**: Camera captures and processes barcodes using QuaggaJS
3. **Data Storage**: Barcodes are stored in session with timestamps
4. **Email Generation**: System compiles scan results into email format
5. **Email Delivery**: SMTP service sends formatted report to logistics team

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **quagga**: Barcode scanning library
- **nodemailer**: Email delivery service

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast build tool and dev server
- **typescript**: Type safety and developer experience
- **drizzle-kit**: Database migration management

## Deployment Strategy

### Build Process
- **Client**: Vite builds React app to `dist/public`
- **Server**: esbuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations handle schema changes

### Environment Configuration
- Database connection via `DATABASE_URL`
- SMTP configuration for email delivery
- Production vs development environment handling

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database (Neon serverless recommended)
- SMTP service for email delivery
- HTTPS required for camera access

## Changelog

Changelog:
- July 03, 2025. Initial setup
- July 03, 2025. Added manual barcode input for testing when camera not available
- July 03, 2025. SMTP configuration implemented but experiencing authentication issues
- July 03, 2025. Implemented dedicated mobile camera scanner with proper error handling, flashlight support, and camera switching for reliable mobile camera access
- July 03, 2025. Major bug fixes: Fixed API parameter order issues, login double-click problem, fetch override memory leaks, dialog accessibility warnings, case-insensitive usernames, and extended session duration to 7 days for better user experience
- July 04, 2025. Critical session state bug fixes: Resolved stale closure issues where old barcodes reappeared after email sending, implemented functional state updates for proper React state management, fixed duplicate detection with latest state values, and corrected success modal to show accurate barcode count using persistent state before clearing
- July 04, 2025. Enhanced QR code functionality: Added support for structured QR codes with semicolon-separated data (ordernummer;artikelnummer;batchnummer;vikt), implemented weight calculation and display in UI statistics card, enhanced email reports with order grouping and weight summaries, improved CSV export with proper headers and structured data parsing
- July 04, 2025. Enhanced data entry interface: Created tabbed manual input with support for structured QR data entry, improved table view showing parsed QR components in separate columns, added visual distinction between QR codes and simple barcodes, implemented proper column layout for order/article/batch/weight data display

## User Preferences

Preferred communication style: Simple, everyday language.