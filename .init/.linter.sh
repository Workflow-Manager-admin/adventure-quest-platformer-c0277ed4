#!/bin/bash
cd /home/kavia/workspace/code-generation/adventure-quest-platformer-c0277ed4/game_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

