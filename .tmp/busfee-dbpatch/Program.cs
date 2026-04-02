using Npgsql;

var envPath = Path.Combine(Directory.GetCurrentDirectory(), "backend", ".env");
if (!File.Exists(envPath))
    throw new FileNotFoundException("Could not find backend/.env", envPath);

var connLine = File.ReadLines(envPath)
    .FirstOrDefault(line => line.StartsWith("ConnectionStrings__DefaultConnection=", StringComparison.Ordinal));

if (string.IsNullOrWhiteSpace(connLine))
    throw new InvalidOperationException("ConnectionStrings__DefaultConnection not found in backend/.env");

var connectionString = connLine["ConnectionStrings__DefaultConnection=".Length..];

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

await using var cmd = conn.CreateCommand();
cmd.CommandText = """
    ALTER TABLE "StudentEnrollments"
    ADD COLUMN IF NOT EXISTS "BusFeeAmount" numeric NULL;
    """;

await cmd.ExecuteNonQueryAsync();
Console.WriteLine("BusFeeAmount column ensured.");
