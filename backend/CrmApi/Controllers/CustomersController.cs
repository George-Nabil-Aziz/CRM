using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController(CrmDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CustomerResponse>>> List([FromQuery] string? q)
    {
        var query = db.Customers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            query = query.Where(c => EF.Functions.Like(c.Name, $"%{q}%") || EF.Functions.Like(c.Email, $"%{q}%"));
        }

        var customers = await query.OrderByDescending(c => c.CreatedAt).Take(200).ToListAsync();
        return Ok(customers.Select(Mappers.ToResponse).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerResponse>> Get(Guid id)
    {
        var customer = await db.Customers.FindAsync(id);
        return customer is null ? NotFound() : Ok(Mappers.ToResponse(customer));
    }

    // Story 01: Create customer profile
    [HttpPost]
    public async Task<ActionResult<CustomerResponse>> Create(CreateCustomerRequest request)
    {
        var emailTaken = await db.Customers.AnyAsync(c => c.Email == request.Email);
        if (emailTaken)
        {
            return Conflict(new { message = "A customer with this email already exists." });
        }

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            CreatedAt = DateTime.UtcNow
        };

        db.Customers.Add(customer);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHistory), new { id = customer.Id }, Mappers.ToResponse(customer));
    }

    // Story 02: Manage contact details
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<CustomerResponse>> UpdateContactDetails(Guid id, UpdateCustomerContactRequest request)
    {
        var customer = await db.Customers.FindAsync(id);
        if (customer is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != customer.Email)
        {
            var emailTaken = await db.Customers.AnyAsync(c => c.Email == request.Email && c.Id != id);
            if (emailTaken)
            {
                return Conflict(new { message = "A customer with this email already exists." });
            }
            customer.Email = request.Email;
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            customer.Phone = request.Phone;
        }

        if (request.Address is not null)
        {
            customer.Address = request.Address;
        }

        await db.SaveChangesAsync();
        return Ok(Mappers.ToResponse(customer));
    }

    // Story 03: View interaction history
    [HttpGet("{id:guid}/history")]
    public async Task<ActionResult<List<InteractionEntry>>> GetHistory(Guid id)
    {
        var customerExists = await db.Customers.AnyAsync(c => c.Id == id);
        if (!customerExists)
        {
            return NotFound();
        }

        var ticketEntries = await db.Tickets
            .Where(t => t.CustomerId == id)
            .Select(t => new InteractionEntry(t.Id, "ticket", t.Id, t.CreatedAt, $"Ticket {t.TicketNumber}: {t.Subject}"))
            .ToListAsync();

        var noteEntries = await db.Notes
            .Where(n => n.CustomerId == id)
            .Select(n => new InteractionEntry(n.Id, "note", null, n.CreatedAt, n.Text))
            .ToListAsync();

        var timeline = ticketEntries.Concat(noteEntries)
            .OrderByDescending(e => e.Timestamp)
            .ToList();

        return Ok(timeline);
    }

    // Story 04: Add notes and attachments
    [HttpPost("{id:guid}/notes")]
    public async Task<ActionResult<NoteResponse>> AddNote(Guid id, AddNoteRequest request)
    {
        var customerExists = await db.Customers.AnyAsync(c => c.Id == id);
        if (!customerExists)
        {
            return NotFound();
        }

        var note = new Note
        {
            Id = Guid.NewGuid(),
            CustomerId = id,
            Text = request.Text,
            AttachmentUrl = request.AttachmentUrl,
            CreatedAt = DateTime.UtcNow
        };

        db.Notes.Add(note);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHistory), new { id }, Mappers.ToResponse(note));
    }
}
