#!/bin/bash

rm -Rf ../db/*
mongod --dbpath ../db 2> /dev/null &
python ../server.py
