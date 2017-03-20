use Mix.Config

defmodule OpenPantry.Ownership do
  def timeout do
    try do
      String.to_integer(System.get_env("DB_TIMEOUT"))
    rescue
      ArgumentError -> 25_000
    end
  end
end


defmodule OpenPantry.WallabyConfig do
  @ci "CI"
  @circle_artifacts "CIRCLE_ARTIFACTS"

  def timeout() do
    cond do
      ci?() -> 30_000
      true -> 5_000
    end
  end

  def screenshot_dir() do
    cond do
      ci?() -> System.get_env(@circle_artifacts)
      true -> "priv/wallaby/screenshots"
    end
  end

  def ci?() do
    !!System.get_env(@ci)
  end
end


config :wallaby,
  screenshot_on_failure: true,
  js_errors: true,
  js_logger: :stdio,
  screenshot_dir: OpenPantry.WallabyConfig.screenshot_dir(),
  max_wait_time: OpenPantry.WallabyConfig.timeout()

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :open_pantry, OpenPantry.Endpoint,
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
  ownership_timeout: OpenPantry.Ownership.timeout,
  pool: Ecto.Adapters.SQL.Sandbox

config :wallaby,
  max_wait_time: 5_000,
  screenshot_on_failure: true,
  js_errors: true,
  js_logger: :stdio
