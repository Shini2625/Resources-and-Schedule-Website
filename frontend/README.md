# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules. It uses JavaScript with JSX.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the ESLint rules and parser options to match your chosen stack (JSX or TypeScript).

For JSX (this template): ensure `files` patterns target `*.js`/`*.jsx` and use `@eslint/js` and React plugins.

For TypeScript, re-add `tsconfig` files and TypeScript-specific ESLint configs if you opt back into TypeScript.
