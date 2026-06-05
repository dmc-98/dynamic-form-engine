# Claude Code integration for DFE

An installable [Claude Code](https://docs.claude.com/en/docs/claude-code) **plugin** (published via a marketplace — no copy-paste) that lets Claude Code scaffold Dynamic Form Engine projects: `dfe init`, starter templates, backend wiring, validation, and migrations.

## Install

```
/plugin marketplace add dmc-98/dynamic-form-engine
/plugin install dfe-scaffold@dfe
```

Then `/reload-plugins`. Confirm with `/plugin list` → **dfe-scaffold**.

Direct install (no marketplace):

```
/plugin install https://github.com/dmc-98/dynamic-form-engine
```

## Layout

```
integrations/claude-code/
├── .claude-plugin/
│   └── marketplace.json          # marketplace manifest (name: "dfe")
└── plugin/                        # the dfe-scaffold plugin
    ├── .claude-plugin/
    │   └── plugin.json            # plugin manifest (name, version, ...)
    ├── README.md
    └── skills/
        └── dfe-scaffold/
            ├── SKILL.md           # the skill Claude Code reads
            └── references/        # commands, templates, integration
```

## Use

Ask Claude Code: *"build a multi-step onboarding form with a Postgres backend"* — it drives the DFE CLI and wires it up.

## Try the CLI yourself

The runnable walkthrough at [`examples/cli-demo/`](../../examples/cli-demo/README.md) shows the same commands the plugin runs.
