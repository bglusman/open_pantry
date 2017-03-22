ExUnit.configure(exclude: [pending: true])
ExUnit.start

Ecto.Adapters.SQL.Sandbox.mode(OpenPantry.Repo, :manual)
Application.put_env(:wallaby, :base_url, OpenPantry.Endpoint.url)

{:ok, _} = Application.ensure_all_started(:wallaby)
{:ok, _} = Application.ensure_all_started(:ex_machina)