<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ghFjmQkyMMjzVEZsZA7tT6XXVtoqe2CV

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Database setup (Supabase)

If your Supabase project is empty, run `database/schema.sql` in the Supabase SQL editor first.
This script first drops existing app tables/functions/types, then recreates everything from scratch (including RPCs `hr_login`, `upsert_employee`, `upsert_salary`, audit logs, HR session tracking, account lockout fields, triggers, and development RLS policies).
