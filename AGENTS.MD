## git commit messages
- use convential commmits:
    - feat: a new feature for the user, not a new feature for build script
    - fix: a bug fix for the user, not a fix to a build script
    - docs: changes to the documentation
    - style: formatting, missing semi colons, etc; no production code change
    - refactor: refactoring production code, eg. renaming a variable
    - test: adding missing tests, refactoring tests; no production code change
    - chore: updating grunt tasks etc; no production code change

    ## security guidelines
    never commit secrets, passwords, or other sensitive information to the repository. Use environment variables or a secure vault for managing sensitive data.