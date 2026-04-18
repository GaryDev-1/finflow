#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<-EOSQL
  CREATE DATABASE accounts_db;
  CREATE DATABASE transactions_db;
  CREATE DATABASE loans_db;
EOSQL
