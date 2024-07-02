# Introduction

This folder is meant to be used for [ADRs](https://adr.github.io/), so that future engineers onboarding to isomer have context over why certain decisions were made.

In order to use this folder, copy the file `TEMPLATE.md` and rename it to something relevant to the decision being made. Thereafter, just follow the template and fill up on the details

# Pre-requisites

In order to start writing ADRs, first install `adr-tools` using `brew install adr-tools`.

# Contributing

To write a new adr that has no relation to any previous ones, use the command `adr new <title>`. If your current ADR instead builds on or supercedes an old one, use the command `adr new -s <old> <title>`

# Useful links

- [ADR tools](https://github.com/npryce/adr-tools?tab=readme-ov-file)
- ADR template [repository](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/locales/en/templates/decision-record-template-by-michael-nygard/index.md)
