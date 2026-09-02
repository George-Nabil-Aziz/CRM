namespace CrmApi.Models;

public enum ArticleType
{
    Faq,
    Article,
    Guide
}

public enum ArticleCategory
{
    GettingStarted,
    Billing,
    Technical,
    Account,
    General
}

public class Article
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public ArticleCategory Category { get; set; }
    public ArticleType Type { get; set; }
    public Guid? AuthorId { get; set; }
    public bool Published { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int ViewCount { get; set; }
}
