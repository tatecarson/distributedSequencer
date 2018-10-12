#!/bin/bash

docker build . -t tatecarson/distributed-sequencer
docker push tatecarson/distributed-sequencer
hyper rm -f distributed-sequencer
hyper rmi tatecarson/distributed-sequencer
hyper pull tatecarson/distributed-sequencer
hyper run -d --name distributed-sequencer -p 8001:8000 tatecarson/distributed-sequencer
hyper fip attach 209.177.88.70 distributed-sequencer