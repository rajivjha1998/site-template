# Site builder: agents and HIL setup sheet

Everything needed to wire BBPlatform workflows to customer site repos. No BBPlatform backend changes: only API agents, HIL steps and the GitHub Actions already in this template.

Placeholders used below:
- `{OWNER}`: your GitHub user or org.
- `{slug}`: the site slug from the "New Project" HIL step (lowercase letters, digits, dashes). The repo is `site-{slug}`.
- `{request_id}`: any unique value per run, e.g. the workflow run or task id.

---

## 1. One-time setup

1. Push this template to GitHub as `{OWNER}/site-template` (private) and tick **Settings → General → Template repository**.
2. Create a **fine-grained token** (GitHub → Settings → Developer settings → Fine-grained tokens):
   - Resource owner: `{OWNER}` · Repository access: **All repositories**.
   - Permissions: **Administration** read/write · **Contents** read/write · **Actions** read · **Metadata** read.
3. In BBPlatform **API Auth**, save it as **Bearer**, base URL `https://api.github.com`.
4. Every GitHub agent sends these headers:
   ```
   Authorization: Bearer <token>
   Accept: application/vnd.github+json
   X-GitHub-Api-Version: 2022-11-28
   ```

---

## 2. GitHub agents

### Repository Creator
`POST /repos/{OWNER}/site-template/generate`
```json
{
  "owner": "{OWNER}",
  "name": "site-{slug}",
  "description": "{brand_name} website",
  "private": true,
  "include_all_branches": false
}
```
- **201**: created. Use `html_url`.
- **422**: the name is taken. **404**: the template isn't marked as a template, or the token can't see it.

### Get Main SHA *(put in a do-until loop: until 200, max 10, about 3 s apart)*
`GET /repos/{OWNER}/site-{slug}/git/ref/heads/main`
- **200**: read `object.sha`. **404/409**: GitHub is still copying the template, so retry.

### Create Draft Branch
`POST /repos/{OWNER}/site-{slug}/git/refs`
```json
{ "ref": "refs/heads/draft", "sha": "{object.sha from Get Main SHA}" }
```
- **201**: created. **422**: it already exists, which is fine.

### Send Settings
`POST /repos/{OWNER}/site-{slug}/dispatches`
```json
{
  "event_type": "update-settings",
  "client_payload": {
    "request_id": "{request_id}",
    "settings": {
      "brand_name": "{brand_name}",
      "brand_tagline": "{brand_tagline}",
      "brand_description": "{brand_description}",
      "color_primary": "{color_primary}",
      "color_secondary": "{color_secondary}",
      "color_tertiary": "{color_tertiary}",
      "hero_title": "{hero_title}",
      "hero_lede": "{hero_lede}",
      "button1_label": "{button1_label}",
      "button1_link": "{button1_link}",
      "button2_label": "{button2_label}",
      "button2_link": "{button2_link}"
    }
  }
}
```
- **204**: accepted. The `Update site settings` Action then applies the answers, validates, builds and commits `site.json` to `draft`.
- Send only the fields a step collects. Empty values mean "leave as is".
- `settings` may also be the whole HIL output object, or that object as a JSON string. Unknown keys are ignored and listed in the run log.

### Build Watcher *(do-until loop: until the run is completed, max 30, about 10 s apart)*
`GET /repos/{OWNER}/site-{slug}/actions/runs?event=repository_dispatch&per_page=10`
- Find the run in `workflow_runs` whose `display_title` is `update-settings {request_id}`.
- Done when its `status` is `completed`. Success if `conclusion` is `success`.
- If `conclusion` is `failure`, the answers didn't pass validation and nothing was committed. The run's `html_url` shows which field is wrong.

### Settings Reader *(pre-fills HIL forms when editing)*
`GET /repos/{OWNER}/site-{slug}/contents/site.json?ref=draft`
with header `Accept: application/vnd.github.raw+json`. This returns plain JSON, not base64.

| HIL field | Read from |
|---|---|
| brand_name / brand_tagline / brand_description | `brand.name` / `brand.tagline` / `brand.description` |
| color_primary / color_secondary / color_tertiary | `theme.primary` / `theme.secondary` / `theme.tertiary` |
| hero_title / hero_title_accent / hero_lede | `pages["/"].sections[0].title` / `.titleAccent` / `.lede` |
| button1_label / button1_link | `pages["/"].sections[0].ctas[0].label` / `.href` |
| button2_label / button2_link | `pages["/"].sections[0].ctas[1].label` / `.href` |

### Publisher *(publishes draft to live)*
`POST /repos/{OWNER}/site-{slug}/merges`
```json
{ "base": "main", "head": "draft", "commit_message": "Publish ({request_id})" }
```
- **201**: published. **204**: nothing new to publish. **409**: conflict (someone edited `main` directly).

### Discard Draft *(optional)*
1. Get the SHA of `main`, using the same call as Get Main SHA.
2. `PATCH /repos/{OWNER}/site-{slug}/git/refs/heads/draft` with `{ "sha": "<main sha>", "force": true }`.

---

## 3. Hosting agent (Cloudflare Pages)

One-time setup: create a Cloudflare account, install the **Cloudflare Pages GitHub app** with access to your repos, and create an API token with **Pages: Edit**. Save it in BBPlatform API Auth as Bearer, base URL `https://api.cloudflare.com/client/v4`.

### Site Host Creator *(once per site, after Create Draft Branch)*
`POST /accounts/{account_id}/pages/projects`
```json
{
  "name": "site-{slug}",
  "production_branch": "main",
  "build_config": { "build_command": "pnpm build", "destination_dir": "apps/website/dist" },
  "source": {
    "type": "github",
    "config": {
      "owner": "{OWNER}",
      "repo_name": "site-{slug}",
      "production_branch": "main",
      "deployments_enabled": true,
      "production_deployments_enabled": true,
      "preview_deployment_setting": "custom",
      "preview_branch_includes": ["draft"],
      "pr_comments_enabled": false
    }
  },
  "deployment_configs": {
    "production": { "env_vars": { "NODE_VERSION": { "type": "plain_text", "value": "22" } } },
    "preview": { "env_vars": { "NODE_VERSION": { "type": "plain_text", "value": "22" } } }
  }
}
```
After that, every push builds automatically. No secrets are needed in GitHub.
- Preview (draft): `https://draft.site-{slug}.pages.dev`
- Live (main): `https://site-{slug}.pages.dev`

**To verify on the first test:** that Cloudflare's build image runs pnpm 12 from `packageManager`. If it doesn't, set the build command to `npx pnpm@12.10.1 install && npx pnpm@12.10.1 build`.

---

## 4. HIL steps

All fields are existing field types (`text`), so no backend change is needed. Use these exact field keys: the Action maps them by name.

**New Project**
| Key | Label | Required |
|---|---|---|
| `slug` | Site address name (lowercase, dashes) | yes |
| `brand_name` | Company name | yes |

**Brand & Buttons**
| Key | Label | Notes |
|---|---|---|
| `brand_name` | Company name | max 60 |
| `brand_tagline` | Tagline | max 120 |
| `brand_description` | One-sentence description | max 155 |
| `color_primary` | Primary colour | hex, e.g. `#2563eb` |
| `color_secondary` | Secondary colour | hex |
| `color_tertiary` | Tertiary colour | hex |
| `hero_title` | Headline | max 34 |
| `hero_title_accent` | Headline second part (coloured) | max 24, optional |
| `hero_lede` | Sub-headline | max 100 |
| `button1_label` | Main button text | also used in the header |
| `button1_link` | Main button link | `/page`, `#section`, `www.site.com` or an email |
| `button2_label` | Second button text | optional |
| `button2_link` | Second button link | optional |

Links are cleaned up automatically: `/pricing` → `/pricing/`, `www.x.com` → `https://www.x.com`, `hello@x.com` → `mailto:hello@x.com`. Colours accept `2563eb` or `#2563EB`.

**Review**: `preview_only`, showing the preview link, plus a dropdown `decision` (`approve` / `reject`).

---

## 5. Workflows

**Build Website**
```
HIL New Project → Repository Creator → [loop] Get Main SHA → Create Draft Branch
→ Site Host Creator → HIL Brand & Buttons → Send Settings → [loop] Build Watcher
→ HIL Review → conditional(decision = approve) → Publisher → notify
```

**Edit Website**
```
Settings Reader → HIL Brand & Buttons (defaults from Settings Reader) → Send Settings
→ [loop] Build Watcher → HIL Review → conditional(approve) → Publisher
```
