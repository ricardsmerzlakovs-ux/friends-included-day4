# Friends Included — Day 4

## Completed work

- Created a Google Cloud project and enabled the Google Sheets API.
- Created a dedicated service account with read-only access to the project spreadsheet.
- Stored the service-account configuration securely in Supabase Edge Function secrets.
- Created Supabase tables for `sales` and `expenses`, with Row Level Security enabled.
- Created the `read-friends-included-sheet` Edge Function to read Google Sheets and upsert data into Supabase.
- Configured a daily scheduled synchronization at **09:00 Guatemala time** (15:00 UTC).
- Added financial-report views:
  - `public.daily_financial_summary`
  - `public.financial_totals`
  - `public.sync_status`

## Verification

The Edge Function test completed successfully:

```json
{
  "ok": true,
  "synced": {
    "sales": 2,
    "expenses": 2
  }
}
```

Current financial totals from Supabase:

| Metric | Value |
| --- | ---: |
| Revenue | 110.00 |
| Expenses | 45.00 |
| Profit | 65.00 |
| Orders | 2 |
| Units sold | 3 |

## Links

- Google Sheet: https://docs.google.com/spreadsheets/d/1IoJjcWUys6XG6GuKhVqf8w03XFIWDj9pnITcRjZf08s/edit
- Supabase Edge Function: https://btyutrnvwhclnpjqduat.supabase.co/functions/v1/read-friends-included-sheet

## Submission note

The integration is complete: Google Sheets data is imported into Supabase automatically once per day, and the database provides ready-to-query revenue, expenses, and profit reports. No API keys, passwords, or private credentials are included in this file.
