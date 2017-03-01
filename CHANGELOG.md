# Change log

## v2.0.0 - 2017-01-26

* Removes default controller code, and loads from hof-controllers instead in order to simplify the dependency tree
* Incorporates breaking change from controllers to use dynamic controller config
* Update code to ES6

## v2.0.1 - 2017-01-27

* Fix bug with constant values being assigned

## v3.2.1 - 2017-03-01

* Fixes bugs with forking steps that fork to a preceding step (creating a closed loop) invalidating themselves on submission.
* Adds some functional tests to test this behaviour.

## v3.2.2 - 2017-03-01

* Fixes bug that caused looping steps to invalidate themselves when submitted as part of an edit journey
