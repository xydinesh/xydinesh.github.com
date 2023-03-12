# Improvements on CI/CD process
I have looked into possible improvements to our CI/CD process and release workflow. I borrowed ideas from [Software Configuration Management Patterns][scm-patterns] by Stephen Berczuk. In this post, I document suggestions and action items for improved CI/CD process.

At Pearson, my team's (CEET) current test suit takes over 2 hours to run. Since it is taking long time, we have a risk of not using the full test suite frequent. It is important to define most critical functionality and implement smoke tests. Smoke tests are not exhaustive tests, it guarantees that most critical functionality is working after development. In addition, during daily testing we can execute our full test suite.

## Test suite

* Pre-checkin test suite
	1. unit/integration tests
	1. smoke tests

* Full test suite
	1. unit/integration tests
	1. smoke tests
	1. regression tests
	1. end-to-end tests
   
### Active development and continous integration

We use 'development' branch for active development. Therefore it make sense for us to integrate automated tests configured on that branch. I'm envisioning following workflow the 'development' branch.

When a developer done with a task, he/she go through pre-checkin workflow and submit a pull request. Then reviewer, review and merge the pull request for the 'development' branch. Then jenkins (or other tool) kicks off automated tests on the development branch. In addition, everyday around 7am (subject to change) jenkins kicks off daily testing process. We go through our full test suite during daily testing cycle. Furthermore, jenkins notifies developers on failure in automated testing or daily testing process.

### Release Workflow

We need to maintain active development during busy BTS (Back to school) season. Therefore we do our minor releases on a different release branch as shown in following diagram. We keep development on 'development' branch until we are ready for the release.  When we are ready for the release, we create a release branch. Anything related to release happens on the this branch where as we can keep active development on the 'development' branch. On a later date, if we decide changes we did on the release branch is important for the next release, we merge them back to the ‘development’ branch.

We use separate branch for each minor release, trivial releases on minor release branch.

![Release branch](https://s3.amazonaws.com/knox-makers/release_branch.png)

After running all of our testing at staging, will merge release branch with master so that master is always production ready.

# Workflows

As developers, it is our responsibility to make sure all our pull requests are conflicts free with the 'development' branch and pass all tests.

### Pre-Pull Request Workflow

1. Make sure all unit tests, integration tests and smoke tests passes
1. Merge with development branch, resolve merge conflicts (if there is any)
1. Run test suite (unit, integration and smoke) and make sure everything is passing.
1. Submit the pull request.

### Reviewer workflow

1. Review, approve and merge pull request.
1. Jenkins kicks off automated tests for changes on the development branch.


# Action items

1. We need create 'master' branch so that we can make sure 'master' is always production ready.
1. Develop smoke tests to guarantee functionality of most critical functions. (Finish in ~10 min)
1. Develop regression tests and add more regression tests as we go forward.
1. Make sure all of functional tests passes.
1. Create release branches for releases.

# References

1. [Berczuk, Stephen P., and Brad Appleton. Software configuration management patterns: effective teamwork, practical integration. Addison-Wesley Longman Publishing Co., Inc., 2002.][scm-patterns]
1. [Appleton, Brad, Steve Berczuk, Ralph Cabrera, and Robert Orenstein. "Streamed lines: Branching patterns for parallel software development." In Proceedings of PloP, vol. 98. 1998][stream-lines]


[scm-patterns]: https://www.amazon.com/Software-Configuration-Management-Patterns-Integration/dp/0201741172
[stream-lines]: www.hillside.net/plop/plop98/final_submissions/P37.pdf
