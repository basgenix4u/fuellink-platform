#!/usr/bin/env bash
# Provision a local PostgreSQL for development and integration tests.
#
# Idempotent: installs PostgreSQL if absent, initialises the data directory if
# absent, starts the server if not running, and ensures the app roles and
# databases exist. Safe to run at the start of every session.
#
#   ./scripts/dev-db.sh            # provision + start
#   ./scripts/dev-db.sh status     # report state
#   ./scripts/dev-db.sh stop
#
# The data directory lives under $PGDATA_DIR (default /home/user/.pgdata) so it
# survives in environments where only the home directory is persisted.

set -euo pipefail

PGDATA_DIR="${PGDATA_DIR:-$HOME/.pgdata}"
PGPORT="${PGPORT:-5432}"
PGUSER_APP="${PGUSER_APP:-fuellink}"
PGPASSWORD_APP="${PGPASSWORD_APP:-fuellink}"
PGDB="${PGDB:-fuellink}"
PGDB_TEST="${PGDB_TEST:-fuellink_test}"
LOGFILE="${LOGFILE:-$HOME/.pgdata.log}"

find_pgbin() {
  local candidate
  candidate=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)
  if [ -n "$candidate" ] && [ -x "$candidate/pg_ctl" ]; then
    echo "$candidate"
    return 0
  fi
  if command -v pg_ctl >/dev/null 2>&1; then
    dirname "$(command -v pg_ctl)"
    return 0
  fi
  return 1
}

install_postgres() {
  echo "==> Installing PostgreSQL"
  export DEBIAN_FRONTEND=noninteractive
  if command -v sudo >/dev/null 2>&1; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq postgresql postgresql-contrib
  else
    apt-get update -qq
    apt-get install -y -qq postgresql postgresql-contrib
  fi
}

# Run a command as the postgres superuser when we are root, otherwise directly.
as_pg() {
  if [ "$(id -u)" = "0" ] && id postgres >/dev/null 2>&1; then
    sudo -u postgres "$@"
  elif id postgres >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    sudo -u postgres "$@"
  else
    "$@"
  fi
}

cmd_status() {
  local pgbin
  if ! pgbin=$(find_pgbin); then
    echo "postgres: not installed"
    return 1
  fi
  if "$pgbin/pg_ctl" -D "$PGDATA_DIR" status >/dev/null 2>&1; then
    echo "postgres: running on port $PGPORT (data: $PGDATA_DIR)"
    return 0
  fi
  echo "postgres: installed but not running"
  return 1
}

cmd_stop() {
  local pgbin
  pgbin=$(find_pgbin) || { echo "postgres not installed"; return 0; }
  "$pgbin/pg_ctl" -D "$PGDATA_DIR" -m fast stop 2>/dev/null || true
  echo "stopped"
}

cmd_up() {
  local pgbin
  if ! pgbin=$(find_pgbin); then
    install_postgres
    pgbin=$(find_pgbin) || { echo "ERROR: PostgreSQL install failed"; exit 1; }
  fi
  echo "==> Using $pgbin"

  # The data directory must be owned by the user running the server.
  if [ ! -s "$PGDATA_DIR/PG_VERSION" ]; then
    echo "==> Initialising data directory at $PGDATA_DIR"
    mkdir -p "$PGDATA_DIR"
    chmod 700 "$PGDATA_DIR"
    "$pgbin/initdb" -D "$PGDATA_DIR" -U postgres --auth-local=trust --auth-host=md5 >/dev/null
  fi

  if ! "$pgbin/pg_ctl" -D "$PGDATA_DIR" status >/dev/null 2>&1; then
    echo "==> Starting PostgreSQL on port $PGPORT"
    # unix_socket_directories must be writable by the current user.
    "$pgbin/pg_ctl" -D "$PGDATA_DIR" -l "$LOGFILE" \
      -o "-c listen_addresses=127.0.0.1 -p $PGPORT -c unix_socket_directories=$PGDATA_DIR" \
      -w start
  else
    echo "==> PostgreSQL already running"
  fi

  echo "==> Ensuring role and databases"
  local psql="$pgbin/psql -h $PGDATA_DIR -p $PGPORT -U postgres -d postgres -tAc"

  if [ -z "$($psql "SELECT 1 FROM pg_roles WHERE rolname='$PGUSER_APP'")" ]; then
    $psql "CREATE ROLE $PGUSER_APP LOGIN PASSWORD '$PGPASSWORD_APP' SUPERUSER" >/dev/null
    echo "    role $PGUSER_APP created"
  fi

  for db in "$PGDB" "$PGDB_TEST"; do
    if [ -z "$($psql "SELECT 1 FROM pg_database WHERE datname='$db'")" ]; then
      $psql "CREATE DATABASE $db OWNER $PGUSER_APP" >/dev/null
      echo "    database $db created"
    fi
  done

  echo
  echo "Ready:"
  echo "  DATABASE_URL=postgresql://$PGUSER_APP:$PGPASSWORD_APP@127.0.0.1:$PGPORT/$PGDB?schema=public"
  echo "  TEST_DATABASE_URL=postgresql://$PGUSER_APP:$PGPASSWORD_APP@127.0.0.1:$PGPORT/$PGDB_TEST?schema=public"
}

case "${1:-up}" in
  up) cmd_up ;;
  status) cmd_status ;;
  stop) cmd_stop ;;
  *) echo "usage: $0 [up|status|stop]" >&2; exit 2 ;;
esac
