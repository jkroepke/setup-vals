# Contributing

This project uses GitHub to manage reviews of pull requests.

- If you are a new contributor see: [Steps to Contribute](#steps-to-contribute)

- If you have a trivial fix or improvement, go ahead and create a pull request,
  addressing (with `@...`) a suitable maintainer of this repository in the
  description of the pull request.

- If you plan to do something more involved, first discuss your ideas as
  [GitHub issue](https://github.com/jkroepke/setup-vals/issues). This will avoid
  unnecessary work and surely give you and us a good deal of inspirations.

- Be sure to sign off on the [DCO](https://github.com/probot/dco#how-it-works).

## Steps to Contribute

Should you wish to work on an issue, please claim it first by commenting on the
GitHub issue that you want to work on it. This is to prevent duplicated efforts
from contributors on the same issue. For quickly compiling and testing your
changes do:

```bash
# For building.
npm run package

# For testing.
npm run all         # Make sure all the tests pass before you commit and push :)
```

## Pull Request Checklist

- Branch from the main branch and, if needed, rebase to the current main branch
  before submitting your pull request. If it doesn't merge cleanly with main you
  may be asked to rebase your changes.

- Commits should be as small as possible, while ensuring that each commit is
  correct independently (i.e., each commit should compile and pass tests).

- The PR title should be of the format: `prefix: what this PR does` (for
  example, `feat: Add support for thing` or `fix: fix typo`). Valid prefixes are
  `feat`, `fix`, `docs` and `chore`. The prefix should be followed by a colon
  and a space.

- If your patch is not getting reviewed or you need a specific person to review
  it, you can @-reply a reviewer asking for a review in the pull request or a
  comment.

- Add tests relevant to the fixed bug or new feature.

## Dependency management

This project uses npm to manage dependencies on external packages.
