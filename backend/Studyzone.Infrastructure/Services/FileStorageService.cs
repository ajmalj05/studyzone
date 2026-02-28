using System.IO;
using Microsoft.Extensions.Configuration;
using Studyzone.Application.Common.Interfaces;

namespace Studyzone.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public FileStorageService(IConfiguration config)
    {
        _basePath = config["FileStorage:BasePath"] ?? Path.Combine(Path.GetTempPath(), "Studyzone", "uploads");
        if (!Directory.Exists(_basePath))
            Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveAsync(Stream content, string fileName, string contentType, string subFolder, CancellationToken ct = default)
    {
        var dir = Path.Combine(_basePath, subFolder);
        if (!Directory.Exists(dir))
            Directory.CreateDirectory(dir);
        var safeName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(dir, safeName);
        await using var fs = File.Create(fullPath);
        await content.CopyToAsync(fs, ct);
        return Path.Combine(subFolder, safeName).Replace(Path.DirectorySeparatorChar, '/');
    }

    public Task<Stream?> GetAsync(string path, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, path.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(fullPath))
            return Task.FromResult<Stream?>(null);
        return Task.FromResult<Stream?>(File.OpenRead(fullPath));
    }

    public Task<bool> DeleteAsync(string path, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, path.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(fullPath))
            return Task.FromResult(false);
        try
        {
            File.Delete(fullPath);
            return Task.FromResult(true);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }
}
