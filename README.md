# jurni-trial

A TypeScript-based mobile app prototype / trial built with Expo (React Native).
This repository contains an app scaffold with `app/`, `components/`, `assets/`, and TypeScript configuration.

## Table of contents

* [About](#about)
* [Tech stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Getting started](#getting-started)
* [Project structure](#project-structure)
* [Contributing](#contributing)
* [Troubleshooting](#troubleshooting)
* [License](#license)

## About

`jurni-trial` is a lightweight TypeScript mobile app project. It was built as a trial task for Jurni Ride, a Birmingham-based ride-hailing start up.

## Tech stack

* React Native (Expo)
* TypeScript (100% TypeScript language in repo). 
* Node.js / npm for package management

## Prerequisites

* Node.js (LTS recommended)
* npm 
* Expo

## Getting started (local development)

1. Clone the repo

```bash
git clone https://github.com/nobelsu/jurni-trial.git
cd jurni-trial
```

2. Install dependencies

```bash
npx expo install
```

3. Start the app

```bash
npx expo start
```

This opens the Expo Dev Tools — run on an emulator or scan the QR code with the Expo Go app on your phone.

## Project structure

```
jurni-trial/
├─ app/                # Main app logic & screens 
├─ assets/             # Images & static resources
├─ components/         # Reusable UI components (Btn)
├─ constants/          # Shared values / config (Colors, DefaultStyles)
├─ app.json            # Expo app configuration
├─ package.json        # Dependencies & scripts
├─ package-lock.json   # Locked dependency tree
├─ tsconfig.json       # TypeScript settings
├─ README.md           # Docs for the project
├─ LICENSE             # MIT license file
├─ .gitignore          # Files ignored by Git
```

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add some feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Tips:

* Keep components small and focused.
* Add TypeScript types and prefer `readonly` for immutable structures.
* Include unit tests for business logic where feasible.

## Troubleshooting
* Use `npx expo-doctor`

## License

This project is licensed under the MIT License
