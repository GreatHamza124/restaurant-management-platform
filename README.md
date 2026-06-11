# Restaurant Management Platform

A full-stack restaurant management web app with a live analytics dashboard, table booking system, and dynamic menu with real-time price management.

## Overview

Built to give restaurant owners a single platform to manage their business — track performance through live charts, handle customer bookings with time-slot management, and update menu prices in real time. Market prices are integrated into the menu so ingredient costs and selling prices stay in sync automatically.

## Technologies Used

- Next.js
- React
- TypeScript
- Supabase (PostgreSQL + Auth)
- Recharts
- Tailwind CSS

## Features

- Analytics Dashboard — live charts showing sales, revenue, and booking trends powered by Recharts
- Booking System — customers can book a time slot; staff can view and manage all reservations
- Dynamic Menu — menu prices editable directly in the app, with live market price integration
- Authentication — user auth handled by Supabase with role-based access

## How to Run

1. Clone the repo
   git clone https://github.com/yourusername/restaurant-management-platform

2. Install dependencies
   npm install

3. Set up environment variables — create a .env.local file in the root with:
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Run the development server
   npm run dev

5. Open http://localhost:3000

## What I Learned

This project gave me hands-on experience building a full-stack application end to end — designing a relational database schema in Supabase, managing auth, fetching and displaying live data with Recharts, and building a clean UI with Tailwind CSS and TypeScript.
## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

