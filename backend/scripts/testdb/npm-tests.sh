#!/usr/bin/env bash
set -e

# no-output on pushd and popd
pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}

set_locations() {
    # location of this script, scripts, backend
    DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
}

do_all() {
    pushd $DIR
    # normally use 'unit'; use 'dev' to run tests in dev environment
    if [ -z "$SERVERTYPE" ]; then
        export SERVERTYPE=unit
    fi
    ./setup-and-start-test-db.sh -c $1
    # use this TEST_PATTHEN for running short tests of this script
    # export TEST_PATTERN="tests/mcapi/Database-Level/specs/projects-spec.js"
    # Note - temporarily restricting test to only /tests/mcapi/Database-level
    # when broken tests are fixed this restriction can be lifted -
    # then use default TEST_PATTERN
    export TEST_PATTERN="tests/mcapi/Database-Level/specs/*-spec.js"
    ./run-given-tests.sh
    popd
}

echo "Running npm-tests.sh with SERVERTYPE = ${SERVERTYPE}"

# NOTE: This command gets passed, eventually, to setup-and-start-test-db.sh as the -c option
#     see the function 'print_clear_option', therein, regarding '-c all' and '-c lite'
CMD=$1

if [ "$1" = "" ]; then
    CMD="all"
fi
set_locations
do_all "$CMD"
