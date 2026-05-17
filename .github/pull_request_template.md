# Summary

<!-- What changed and why. 1-3 sentences. -->

## Checklist

### Making changes

- [ ] Follows Inkdex's [Contributing Guidelines](https://github.com/inkdex/extensions/blob/master/.github/CONTRIBUTING.md).

#### For updates to existing extensions

- [ ] Bumped the `version` value in `pbconfig.ts` for each modified extension.

#### For new extensions

- [ ] Generated tests with `npx paperback-cli test --generate EXTENSION_NAME`.

### Testing changes

- [ ] `npm run conformance` passes.
- [ ] `npm test -- EXTENSION_NAME` passes.
- [ ] Bundled the extension and verified it works in the Paperback app.

### Committing changes

- [ ] Commit messages follow the existing convention (`type(Scope): summary`, e.g. `fix(EXTENSION_NAME): ...`).

### AI assistance

Pick one:

- [ ] This PR contains no AI-assisted changes.
- [ ] This PR is AI-assisted. I manually reviewed every change and added an `Assisted-by: AGENT_NAME:MODEL_VERSION` trailer to each AI-assisted commit.
