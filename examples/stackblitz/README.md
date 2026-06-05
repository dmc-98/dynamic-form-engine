# DFE — In-Browser Live Demo (StackBlitz / CodeSandbox)

A self-contained Vite + React app that runs Dynamic Form Engine entirely in the browser using the published npm packages. It's the fastest way to *try* DFE without cloning anything — and it's embeddable in the landing page and docs.

## Run it online

This folder is a standard Vite project, so it opens directly in browser IDEs:

- **StackBlitz:** `https://stackblitz.com/github/dmc-98/dynamic-form-engine/tree/main/examples/stackblitz`
- **CodeSandbox:** `https://codesandbox.io/s/github/dmc-98/dynamic-form-engine/tree/main/examples/stackblitz`

(Replace `dmc-98/dynamic-form-engine` if your repo path differs. The links work once the repo is public and the packages are published to npm.)

## Run it locally

```bash
cd examples/stackblitz
npm install
npm run dev
```

## What it shows

- A multi-step onboarding form from the built-in `user-onboarding` starter template.
- Conditional fields: set **Account Type → Business** and watch company fields appear.
- Live step navigation with progress.
- Generated validation gating the submit button.
- A live, updating submission payload (`collectSubmissionValues()`), proving the "one config → everything" model.

## Embedding in the landing page

StackBlitz supports an `embed=1` iframe parameter:

```html
<iframe
  src="https://stackblitz.com/github/dmc-98/dynamic-form-engine/tree/main/examples/stackblitz?embed=1&file=src/App.tsx&hideNavigation=1"
  style="width:100%;height:600px;border:0;border-radius:12px;overflow:hidden"
  title="Dynamic Form Engine live demo">
</iframe>
```

## Note on versions

`package.json` pins the DFE packages to `latest`. Pin to a specific version (e.g. `^0.2.0`) once you've published, so the demo can't break from a future release.
