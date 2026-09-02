using System.ComponentModel.DataAnnotations;
using CrmApi.Models;

namespace CrmApi.Dtos;

public record CreateArticleRequest(
    [Required, MinLength(1)] string Title,
    [Required, MinLength(1)] string Body,
    [Required] ArticleCategory Category,
    [Required] ArticleType Type
);

public record ArticleSummaryResponse(Guid Id, string Title, ArticleCategory Category, ArticleType Type);

public record ArticleResponse(Guid Id, string Title, string Body, ArticleCategory Category, ArticleType Type, bool Published, int ViewCount);
