# Example usage: bash watchman-simple.sh node src/videoAPI.js

watchman-add() {
  watchman watch .
  watchman watch-list
  
  watchman -- trigger . "$WATCHNAME" '**/*.js' -- $@
  watchman trigger-list .
  
  trap watchman-del EXIT

  # Look for a more trigger-specific log
  tail -f /usr/local/var/run/watchman/${USER}-state/log
}

watchman-del() {
  watchman trigger-del . "$WATCHNAME"

  # only remove when all triggers are deleted
  # /usr/local/var/run/watchman/${USER}-state/state
  #watchman watch-del .
}


WATCHNAME="$(basename "$PWD") $@"
watchman-add "$@"
