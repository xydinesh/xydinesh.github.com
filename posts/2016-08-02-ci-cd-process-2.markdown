# Improvements on CI/CD process - take 2

Using suggestions in [previos post]({% post_url 2016-07-18-ci-cd-process %}) as a starting point, we iterated on improvements to our continous integration and deployment process. I have captured main points we discussed and came up with action items. Feel free to suggest any modifications or improvements.

![Feature branch]({{site.base_url}}/assets/release_branch_2.png)

## Feature & User branches

We run different level of tests on our development branches. As shown in above diagram, we create branches (feature branches) from active development branch , `/development`. Then developers create branches from these feature branches for individual development (user branches).

### Development workflow

Developers work from individual development branches (user branches). Every change push to user branch triggers a build (test cycle) in jenkins. On user branches jenkins run unit, integration and smoke tests. In addition, at end of the tests cycles jenkins reports back and mark commit as green (successful) or red (failed).

Developers can create pull requests only from a branch where last commit is marked as green. After reviewing pull request, reviewer can approve and merge pull request to feature branch. When a merge happens on feature branch, jenkins kicks off full tests suite. Our full test suite defined as follows

1. Unit test
2. Integration test
3. Smoke test
4. End to end tests

For feature branches, jenkins reports back and marks commits as either green or red.

Feature branches merges into active development branch. When feature development is done, developer creates a pull request to developer branch. After peer reviewing, pull request get merged into development branch. On changes on `/development` branch, jenkins runs full test suit and reports back status of the latest commit.

## Release workflow

![Release workflow]({{site.base_url}}/assets/release_branch_3.png)

We maintain active development in `/development` branch. For release, development branch merged into `/master` and tag for the release. Then `/master` branch is tests and prepared for production deployment.

# Handling hotfixes

When there is a need for hot fixes, we create a branch from release tag and apply hot fix into that branch.  This patch release again merge into `/master` branch before pushing into production systems. In addition, this patch release get merged into `/development` branch.

# Concerns

One issues I had with this process is, builds on feature branches and development branches taking too long. This is essentially a side effect of functional (end-to-end) tests taking longer (2-3 hours) to run. However we decided to start with full test suite and make changes if necessary.

## Action items

* **Mark commit as green or red depending on results of tests.** On a commit in a branch, jenkins kicks off tests and reports back to bitbucket.
* **Pull request check.** We can create pull requests from both user branches and feature branches, only if following conditions are met
	* Last commit on the branch is green
	* Last commit has test coverage more than 90%
* **Jenkins jobs for tests.** We need jenkins jobs to detect commits on following branches and run tests.
	* User branch
	* Feature branch
	* `/developer` branch



 


