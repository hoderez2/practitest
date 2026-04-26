# Playwright + PractiTest API Example

This project shows how to run Playwright tests and report the results to PractiTest using the `auto_create` API endpoint.

## What this example does

- Runs Playwright tests from the command line
- Reports each test result to PractiTest
- Uses the PractiTest `auto_create` endpoint
- Automatically creates the test in PractiTest if it does not exist
- Automatically creates the instance in the Test Set if needed
- Creates the run in that instance
- Attaches failure screenshots to failed runs

## Installation

```bash
npm install
npx playwright install
```

## Environment setup

Create a `.env` file from the provided example:

```bash
cp .env.example .env
```

Then update it with your PractiTest details:

```env
PT_BASE_URL=https://api.practitest.com
PT_EMAIL=your@email.com
PT_TOKEN=your_api_token
PT_PROJECT_ID=12345
PT_SET_ID=67890
```

## Running the example

```bash
npm test
```

To run only the demo spec:

```bash
npm run test:demo
```

## How it works

When Playwright finishes a test, the custom reporter receives `onTestEnd`, builds a PractiTest `auto_create` payload, and posts the result to PractiTest.

PractiTest then:

- Creates the test if it does not exist
- Creates an instance of that test in the configured Test Set
- Creates a new run in that instance

If the test failed, Playwright's failure screenshot attachments are sent with the run.

## Key files

**`practitestClient.ts`**
Handles authenticated API calls to PractiTest and wraps the `auto_create` endpoint.

**`practitestReporter.ts`**
Builds the payload, collects failed-test screenshots, and reports results through Playwright's custom reporter API.

**`tests/example.spec.ts`**
A sample Playwright spec with passing and intentionally failing coverage.

## Custom fields

This integration sets the following custom field on every test it creates via `auto_create`:

| Field name | Field ID | Value |
|---|---|---|
| Automation Status | 278185 | `Automated` |

The field is applied in `practitestReporter.ts` inside `test-attributes`:

```ts
"custom-fields": {
  "---f-278185": "Automated",
}
```

Custom field keys follow the PractiTest API format `---f-{field_id}`. The value must match exactly one of the field's configured possible values.

## Test naming

Test names are built from Playwright's title path so they include surrounding `describe` blocks when present. This helps avoid name collisions and keeps tests traceable.

## References

- [PractiTest API v2 - auto_create endpoint](https://www.practitest.com/api-v2/#auto-create-a-run)
- [Playwright custom reporters](https://playwright.dev/docs/test-reporters)
