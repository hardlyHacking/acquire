#!/bin/bash

ps -ef | grep mongod | awk '{print $2}' | xargs kill
