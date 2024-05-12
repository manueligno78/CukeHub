# Contributing to Cukehub

First off, thank you for considering contributing to CukeHub. It's people like you that make CukeHub such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make one! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

If you have a general question, creating an issue is okay but you can also [contact us](mailto:manuelpintaldigmail.com) directly.

## Fork & create a branch

If this is something you think you can fix, then fork and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```bash
git checkout -b 325-add-japanese-translations
```

## Get the test suite running 
Make sure you're testing your changes. It's important to ensure your changes don't break existing functionality and ensure that your new features are working as expected.

Implement your fix or feature
At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first 😸

## Make a Pull Request
At this point, you should switch back to your master branch and make sure it's up to date with the latest changes from the official repository:

Then update your feature branch from your local copy of master, and push it!

Finally, go to GitHub and make a Pull Request 😃

## Keeping your Pull Request updated
If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

To learn more about rebasing in Git, there are a lot of good resources but here's the suggested workflow:

## Merging a PR (maintainers only)
A PR can only be merged into master by a maintainer if:

It is passing CI.
It has been approved by at least two maintainers. If it was a maintainer who opened the PR, only one extra approval is needed.
It has no requested changes.
It is up to date with current master.
Any maintainer is allowed to merge a PR if all of these conditions are met.
