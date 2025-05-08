[![CI](https://github.com/jkroepke/setup-vals/actions/workflows/ci.yml/badge.svg)](https://github.com/jkroepke/setup-vals/actions/workflows/ci.yml)
[![GitHub license](https://img.shields.io/github/license/jkroepke/setup-vals)](https://github.com/jkroepke/setup-vals/blob/master/LICENSE)
[![Current Release](https://img.shields.io/github/release/jkroepke/setup-vals.svg?logo=github)](https://github.com/jkroepke/setup-vals/releases/latest)
[![GitHub Repo stars](https://img.shields.io/github/stars/jkroepke/setup-vals?style=flat&logo=github)](https://github.com/jkroepke/setup-vals/stargazers)

# Setup vals

⭐ Don't forget to star this repository! ⭐

## About

GitHub Action for installing
[variantdev/vals](https://github.com/variantdev/vals)

Install a specific version of vals binary on the runner. Acceptable values are
latest or any semantic version string like v2.16.7. Use this action in workflow
to define which version of vals will be used.

```yaml
- name: Stackit Binary Installer
  uses: jkroepke/setup-vals@v1
  with:
    version: '<version>' # default is latest stable
  id: install
```

The cached binary path is prepended to the PATH environment variable as well as
stored in the path output variable. Refer to the action metadata file for
details about all the inputs
[here](https://github.com/jkroepke/setup-vals/blob/main/action.yml).
