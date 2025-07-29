#!/bin/bash
# Kill processes on port 3002 before starting
PORT=${1:-3002}
echo "Killing processes on port $PORT..."
lsof -ti:$PORT | xargs -r kill -9
echo "Port $PORT cleared"