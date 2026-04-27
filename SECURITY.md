# Security Policy

## Reporting a vulnerability

If you've found a security issue in this repository — for example a token leak in an example, an injection vector in a dataset generator, or a misconfiguration that would lead users into an insecure setup — please email **vikas@duckviz.com** rather than opening a public issue.

Include:

- Which example and file the issue is in
- Steps to reproduce
- What an attacker could do with it

We aim to acknowledge reports within 72 hours and to publish a fix or mitigation within 14 days for confirmed issues.

## Scope

**In scope**

- Code in this repository (any example app, build config, GitHub Actions workflow).
- Footgun patterns. If an example would steer a user toward an insecure setup in their own app — committed tokens, missing input validation, unsafe SQL handling — that's worth reporting.

**Out of scope**

- Vulnerabilities in `@duckviz/*` packages themselves. Report those at the main project's security channel.
- Vulnerabilities in third-party dependencies. Report those upstream and we'll bump the dependency once a fix is released.
- Self-hosted misconfiguration of an app forked from one of these examples.

## Disclosure

We coordinate disclosure with reporters. Once a fix is in `main` and tagged, we publish a brief advisory crediting the reporter (unless they prefer to remain anonymous).
