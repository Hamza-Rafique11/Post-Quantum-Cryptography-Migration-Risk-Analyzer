### Post-Quantum Cryptography Migration & Risk Analyzer

Q-FORGE is a **Linux-native cybersecurity platform** for discovering cryptographic usage, assessing quantum-related risk, mapping cryptographic dependencies, and planning migration toward **Post-Quantum Cryptography (PQC)**.

Built for **Kali Linux, Debian, Ubuntu, and other Linux environments**.

---

## Features

* 🔍 **Cryptographic Discovery** — Detect cryptographic algorithms and APIs in source code.
* 🔐 **Certificate Analysis** — Analyze X.509 certificates, keys, signatures, and validity.
* 🌐 **TLS Analysis** — Inspect authorized TLS services and cryptographic configurations.
* 📊 **Crypto Inventory** — Centralized inventory of discovered cryptographic assets.
* ⚠️ **Quantum Risk Assessment** — Identify cryptographic mechanisms requiring migration consideration.
* 🕸️ **Dependency Mapping** — Visualize relationships between assets, applications, services, and cryptography.
* 🚀 **PQC Migration Planning** — Generate migration strategies and priorities.
* 🧪 **Validation & Rescanning** — Compare cryptographic posture before and after changes.
* 💻 **Linux CLI** — Perform scans directly from the terminal.
* 📄 **Security Reports** — Generate structured analysis and migration reports.

---

## Architecture

```text
Source / Certificate / TLS
           │
           ▼
   Cryptographic Scanner
           │
           ▼
    Crypto Inventory
           │
           ▼
     Risk Assessment
           │
           ▼
   Dependency Analysis
           │
           ▼
   PQC Migration Plan
           │
           ▼
      Validation
```

---

## Tech Stack

**Backend:** Python, FastAPI, SQLite
**Frontend:** React, TypeScript
**Security Tools:** OpenSSL, Nmap, TShark, GnuTLS
**Graph Analysis:** NetworkX
**Optional AI:** Ollama / Local LLMs

---

## Linux CLI

```bash
qforge status

qforge scan source ~/project

qforge scan certificate certificate.pem

qforge scan tls 127.0.0.1:8443

qforge risk summary

qforge migration plan

qforge report generate
```

---

## Installation

```bash
git clone https://github.com/Hamza-Rafique11/q-forge.git
cd q-forge

chmod +x scripts/install.sh
./scripts/install.sh

./scripts/start.sh
```

---

## Security

Q-FORGE follows a **local-first and least-privilege architecture**.

* Authorized scanning only
* Scope-controlled network analysis
* Safe subprocess execution
* No unnecessary root privileges
* Sensitive-data redaction
* Offline-capable core functionality

---

## Project Status

**Active Development**

Q-FORGE is being developed as a practical research and security engineering platform for **cryptographic inventory, quantum-risk analysis, and PQC migration planning**.

---

## License

MIT License

---

> **Discover Cryptography. Assess Quantum Risk. Plan the Migration.**
