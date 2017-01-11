#! /bin/bash
echo 'stop ppmsv1:'
forever stop ppmsv1
echo 'start ppmsv1:'
forever start ./forever/start.json

