using Mizan.Mcp.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddHttpClient<IBackendClient, BackendClient>();
builder.Services.AddScoped<McpToolHandler>();

// Add logging
builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
});

var app = builder.Build();

app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }
