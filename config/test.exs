use Mix.Config

defmodule Ownership do
  def timeout do
    try do
      String.to_integer(System.get_env("DB_TIMEOUT"))
    rescue
      ArgumentError -> 25_000
    end
  end
end

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :open_pantry, OpenPantry.Web.Endpoint,
  http: [port: 4001],
  server: true

config :open_pantry, :sql_sandbox, true

# Print only warnings and errors during test
config :logger, level: :warn

# Configure your database
config :open_pantry, OpenPantry.Repo,
  adapter: Ecto.Adapters.Postgres,
  types: OpenPantry.PostgresTypes,
  username: "postgres",
  password: "postgres",
  database: "open_pantry_test",
  hostname: "localhost",
  ownership_timeout: Ownership.timeout,
  pool: Ecto.Adapters.SQL.Sandbox
