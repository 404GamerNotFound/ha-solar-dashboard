# Security Policy

## Supported Versions

This project is maintained as the current version of the HA Solar Dashboard Card. Security fixes are made on the default branch unless a release branch is explicitly created.

## Reporting a Vulnerability

Please do not open a public issue for security vulnerabilities.

If GitHub private vulnerability reporting is enabled for this repository, use it. Otherwise, contact the maintainer privately through an available profile or repository contact method.

Include as much detail as possible:

- Affected version or commit
- Reproduction steps
- Impact
- Relevant logs or screenshots with secrets removed
- Suggested fix, if known

## Scope

Security-sensitive issues may include:

- Cross-site scripting or unsafe rendering of Home Assistant state, entity names, labels, or configuration values
- Leakage of Home Assistant URLs, tokens, entity data, or user-specific information
- Supply-chain risks in build, release, or distribution files
- HACS installation or update behavior that could expose users to unexpected code

General bugs, layout problems, missing features, or configuration questions should use the normal issue templates.

## Expectations

The maintainer will review vulnerability reports as time allows and may ask for more information. Public disclosure should wait until a fix or mitigation is available.
