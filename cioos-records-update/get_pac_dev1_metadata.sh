#!/bin/bash

wget -r -l1 -H -nd -A xml,yaml -P ./metadata "https://pac-dev1.cioos.org/dev/metadata/"

