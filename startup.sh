#! /bin/bash
echo 'stop insv1:'
forever stop insv1
echo 'start insv1:'
forever start ./forever/start.json

