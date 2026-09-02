using CrmApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace CrmApi.Data;

public class CrmDbContext(DbContextOptions<CrmDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketEvent> TicketEvents => Set<TicketEvent>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<QuickReply> QuickReplies => Set<QuickReply>();
    public DbSet<InternalNote> InternalNotes => Set<InternalNote>();
    public DbSet<SlaRule> SlaRules => Set<SlaRule>();
    public DbSet<AssignmentRule> AssignmentRules => Set<AssignmentRule>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<ErpSyncLog> ErpSyncLogs => Set<ErpSyncLog>();
    public DbSet<ChannelConfig> ChannelConfigs => Set<ChannelConfig>();
    public DbSet<Webhook> Webhooks => Set<Webhook>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<BrandingConfig> BrandingConfigs => Set<BrandingConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>()
            .HasIndex(c => c.Email)
            .IsUnique();

        modelBuilder.Entity<Ticket>()
            .HasIndex(t => t.TicketNumber)
            .IsUnique();

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Customer)
            .WithMany(c => c.Tickets)
            .HasForeignKey(t => t.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Note>()
            .HasOne(n => n.Customer)
            .WithMany(c => c.Notes)
            .HasForeignKey(n => n.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TicketEvent>()
            .HasOne(e => e.Ticket)
            .WithMany(t => t.Events)
            .HasForeignKey(e => e.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Message>()
            .HasOne(m => m.Ticket)
            .WithMany(t => t.Messages)
            .HasForeignKey(m => m.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Reminder>()
            .HasOne(r => r.Ticket)
            .WithMany()
            .HasForeignKey(r => r.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InternalNote>()
            .HasOne(n => n.Ticket)
            .WithMany()
            .HasForeignKey(n => n.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Feedback>()
            .HasOne(f => f.Ticket)
            .WithMany()
            .HasForeignKey(f => f.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Feedback>()
            .HasIndex(f => f.TicketId)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany()
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ApiKey>()
            .HasIndex(a => a.Key)
            .IsUnique();

        var stringListComparer = new ValueComparer<List<string>>(
            (a, b) => (a ?? new()).SequenceEqual(b ?? new()),
            v => v.Aggregate(0, (hash, s) => HashCode.Combine(hash, s.GetHashCode())),
            v => v.ToList());

        var guidListComparer = new ValueComparer<List<Guid>>(
            (a, b) => (a ?? new()).SequenceEqual(b ?? new()),
            v => v.Aggregate(0, (hash, g) => HashCode.Combine(hash, g.GetHashCode())),
            v => v.ToList());

        modelBuilder.Entity<Role>()
            .Property(r => r.Permissions)
            .HasConversion(
                v => string.Join(',', v),
                v => v.Length == 0 ? new List<string>() : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
            .Metadata.SetValueComparer(stringListComparer);

        modelBuilder.Entity<InternalNote>()
            .Property(n => n.Mentions)
            .HasConversion(
                v => string.Join(',', v),
                v => v.Length == 0 ? new List<Guid>() : v.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Guid.Parse).ToList())
            .Metadata.SetValueComparer(guidListComparer);

        modelBuilder.Entity<ApiKey>()
            .Property(a => a.Scopes)
            .HasConversion(
                v => string.Join(',', v),
                v => v.Length == 0 ? new List<string>() : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
            .Metadata.SetValueComparer(stringListComparer);

        modelBuilder.Entity<SystemSetting>()
            .HasKey(s => s.Key);

        // BrandingConfig is a singleton row (always Id=1), not an auto-incrementing identity.
        modelBuilder.Entity<BrandingConfig>()
            .Property(b => b.Id)
            .ValueGeneratedNever();

        modelBuilder.Entity<Webhook>()
            .Property(w => w.Events)
            .HasConversion(
                v => string.Join(',', v),
                v => v.Length == 0 ? new List<string>() : v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList())
            .Metadata.SetValueComparer(stringListComparer);
    }
}
