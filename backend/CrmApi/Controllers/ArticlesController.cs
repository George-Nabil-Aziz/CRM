using CrmApi.Data;
using CrmApi.Dtos;
using CrmApi.Models;
using CrmApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/kb")]
public class ArticlesController(CrmDbContext db, AuditLogger audit) : ControllerBase
{
    // Story 26: Browse FAQs
    [HttpGet("faqs")]
    public async Task<ActionResult<List<ArticleSummaryResponse>>> BrowseFaqs([FromQuery] ArticleCategory? category)
    {
        var query = db.Articles.Where(a => a.Published && a.Type == ArticleType.Faq);
        if (category is not null)
        {
            query = query.Where(a => a.Category == category);
        }

        var faqs = await query
            .Select(a => new ArticleSummaryResponse(a.Id, a.Title, a.Category, a.Type))
            .ToListAsync();

        return Ok(faqs);
    }

    // Story 27: Read help articles and guides
    [HttpGet("articles/{id:guid}")]
    public async Task<ActionResult<ArticleResponse>> Get(Guid id)
    {
        var article = await db.Articles.FindAsync(id);
        if (article is null || !article.Published)
        {
            return NotFound();
        }

        article.ViewCount++;
        await db.SaveChangesAsync();

        return Ok(ToResponse(article));
    }

    // Story 28: Search knowledge base
    [HttpGet("search")]
    public async Task<ActionResult<List<ArticleSummaryResponse>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new List<ArticleSummaryResponse>());
        }

        var results = await db.Articles
            .Where(a => a.Published && (EF.Functions.Like(a.Title, $"%{q}%") || EF.Functions.Like(a.Body, $"%{q}%")))
            .Select(a => new ArticleSummaryResponse(a.Id, a.Title, a.Category, a.Type))
            .ToListAsync();

        return Ok(results);
    }

    // Story 29: Manage knowledge base content
    [HttpPost("articles")]
    public async Task<ActionResult<ArticleResponse>> Create(CreateArticleRequest request)
    {
        var article = new Article
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Body = request.Body,
            Category = request.Category,
            Type = request.Type,
            Published = false
        };

        db.Articles.Add(article);
        await db.SaveChangesAsync();
        await audit.LogAsync("create", "article", article.Id);

        return CreatedAtAction(nameof(Get), new { id = article.Id }, ToResponse(article));
    }

    [HttpPost("articles/{id:guid}/publish")]
    public async Task<ActionResult<ArticleResponse>> Publish(Guid id)
    {
        var article = await db.Articles.FindAsync(id);
        if (article is null)
        {
            return NotFound();
        }

        article.Published = true;
        article.PublishedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await audit.LogAsync("update", "article", article.Id);

        return Ok(ToResponse(article));
    }

    private static ArticleResponse ToResponse(Article a) =>
        new(a.Id, a.Title, a.Body, a.Category, a.Type, a.Published, a.ViewCount);
}
