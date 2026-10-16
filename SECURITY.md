# Security model

Observatory is for one owner or a trusted household. Every authenticated visitor can read all collected profiles and traffic. Profile selection is not authorization.

Keep upstream admin credentials in server-side secret files. Protect the data volume and backups; they contain viewing history. Use a unique dashboard password and HTTPS for remote use. Do not expose the raw HTTP port to the internet. The public health endpoint reveals only process availability, not upstream status or history.

Do not paste credentials, real logs, databases, or private screenshots into public issues. Use GitHub private vulnerability reporting if enabled; otherwise ask the maintainer for a private reporting channel without disclosing exploit details publicly.

The collectors are read-only except for normal upstream sign-in. Host allowlisting, CSP, and sanitized errors supplement authentication. No claim is made that arbitrary upstream versions or third-party reverse-proxy configurations have been security audited.
