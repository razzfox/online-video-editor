# Example usage: bash watchman-simple.sh node src/videoAPI.js

__watchman-add() {
  watchman watch .
  watchman watch-list

  # clear the log so the last run do not cause confusion
  printf '\n%.0s' {1..10} >> /usr/local/var/run/watchman/${USER}-state/log

  # '**/*' results in argument list too long, so this must be restarted after updating node_modules
  #watchman -- trigger . "$WATCHNAME" '**/*.js' -- $@
  # this only seems to work when globbing
  #watchman -- trigger . "$WATCHNAME" '**[^node_modules]/*.js' -- $@
  # so being super specific
  watchman -- trigger . "$WATCHNAME" 'src/*.js' 'src/*/*.js' -- $@

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


WATCHNAME="$(basename "$PWD")"
__watchman-add "$@"
