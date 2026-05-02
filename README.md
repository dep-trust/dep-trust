# dep-trust

npm supply chain attack detection — CLI, cloud dashboard, and GitHub App.

## Packages

| Package | Description |
|---|---|
| `packages/cli` | Published CLI (`dep-trust`) — offline scanning, auth, cloud sync |
| `packages/types` | Shared TypeScript types (`@dep-trust/types`) — workspace only |
| `apps/web` | Marketing site (`dep-trust.dev`) |
| `apps/dashboard` | Cloud dashboard + REST API (`app.dep-trust.dev`) |

## Getting started

```sh
pnpm install
```

### CLI

```sh
cd packages/cli
pnpm build

dep-trust scan                 # offline scan
dep-trust auth login           # authenticate with cloud
dep-trust auth login --token   # store a token directly
dep-trust auth status
dep-trust allow <package>      # add to allowlist (syncs if authenticated)
dep-trust snapshot             # save lockfile baseline
```

### Dashboard

```sh
cp .env.example apps/dashboard/.env.local
# fill in the values

pnpm --filter dashboard dev    # http://localhost:3001
```

## Environment variables

Copy `.env.example` to `apps/dashboard/.env.local` and fill in each value.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `GITHUB_APP_ID` | GitHub → App Settings → General |
| `GITHUB_APP_PRIVATE_KEY` | GitHub → App Settings → Private keys (PEM, `\n` escaped) |
| `GITHUB_APP_WEBHOOK_SECRET` | Set when creating the GitHub App |
| `GITHUB_APP_CLIENT_ID` | GitHub → App Settings → General |
| `GITHUB_APP_CLIENT_SECRET` | GitHub → App Settings → Client secrets |
| `NEXT_PUBLIC_APP_URL` | Your deployed dashboard URL |

## Database

Apply `supabase/schema.sql` to your Supabase project via the SQL editor:

```
https://supabase.com/dashboard/project/<project-id>/sql/new
```

## GitHub App

1. Create the app at https://github.com/settings/apps/new
2. Set the webhook URL to `https://app.dep-trust.dev/api/github/webhook`
3. Set the callback URL to `https://app.dep-trust.dev/api/github/callback`
4. Request permissions: **Pull requests** (read & write), **Contents** (read)
5. Subscribe to events: **Pull request**
6. Copy App ID, Client ID, Client Secret, Webhook Secret into `.env.local`
7. Generate and download a private key; store the PEM content as `GITHUB_APP_PRIVATE_KEY` with literal `\n` for newlines

## Deployment

Deploy `apps/dashboard` to Vercel. Set all environment variables in the Vercel project settings.

The `apps/web` marketing site deploys independently.
