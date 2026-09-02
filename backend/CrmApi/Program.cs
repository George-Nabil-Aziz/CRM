using System.Text.Json.Serialization;
using CrmApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddDbContext<CrmDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CrmDb")));
builder.Services.AddScoped<CrmApi.Services.AuditLogger>();
builder.Services.AddScoped<CrmApi.Services.TicketAutomationService>();
builder.Services.AddScoped<CrmApi.Services.ChannelIngestionService>();
builder.Services.AddScoped<CrmApi.Services.AiService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<CrmApi.Services.WebhookDispatcher>();
builder.Services.AddHostedService<CrmApi.Services.SlaMonitorService>();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

const string DevCorsPolicy = "DevCors";
builder.Services.AddCors(options =>
    options.AddPolicy(DevCorsPolicy, policy =>
        policy.WithOrigins("http://localhost:4200", "http://localhost:4300")
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(DevCorsPolicy);

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
