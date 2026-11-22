# Security Policy

## Supported Versions

Security updates cover the current hosted build and the highest stable major/minor series published on GitHub. Older release series, prereleases, and development branches do not receive routine backports. A stable version comes from a published GitHub Release with a tag such as `v1.2.3`.

<!-- supported-versions:start -->
| Version | Security support |
| --- | --- |
| Current hosted build | Supported |
| 1.0.x | Supported |
| Older release series | Routine security backports are unavailable |
<!-- supported-versions:end -->

The [Supported Versions Bot](.github/workflows/supported-versions.yml) checks the table when a release is published and every week. If the table needs updating, it opens one issue with the replacement text for a maintainer to review.

## Reporting a Vulnerability

Use [GitHub private vulnerability reporting](https://github.com/ahesh001/labor/security/advisories/new). Include the affected version or URL, a short description of the impact, and steps using test data. Use GitHub’s private advisory to coordinate the fix. Keep passwords, tokens, customer records, and payment information out of reports.

The maintainer will use the private report to acknowledge it, ask follow-up questions, and coordinate any advisory or fix.
