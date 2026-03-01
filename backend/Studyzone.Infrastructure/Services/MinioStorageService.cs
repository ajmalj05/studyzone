using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;
using Studyzone.Application.Common.Interfaces;

namespace Studyzone.Infrastructure.Services;

public class MinioStorageService : IFileStorageService
{
    private readonly IMinioClient _client;
    private readonly string _bucket;
    private readonly TimeSpan _defaultUrlExpiry;
    private bool _bucketEnsured;

    public MinioStorageService(IConfiguration config)
    {
        var endpoint = config["MinIO:Endpoint"] ?? "";
        var bucket = config["MinIO:Bucket"] ?? "studyzone";
        var accessKey = config["MinIO:AccessKey"] ?? "";
        var secretKey = config["MinIO:SecretKey"] ?? "";

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(accessKey) || string.IsNullOrWhiteSpace(secretKey))
            throw new InvalidOperationException("MinIO configuration is incomplete. Set MinIO__Endpoint, MinIO__Bucket, MinIO__AccessKey, MinIO__SecretKey.");

        _bucket = bucket;
        _defaultUrlExpiry = TimeSpan.FromHours(1);

        var uri = new Uri(endpoint.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? endpoint : "https://" + endpoint);
        var hostPort = string.IsNullOrEmpty(uri.Authority) ? uri.Host : uri.Authority;
        if (uri.Port > 0 && uri.Port != 80 && uri.Port != 443)
            hostPort = $"{uri.Host}:{uri.Port}";
        else if (uri.Port <= 0 && !uri.Host.Contains(':'))
            hostPort = uri.Host;
        var builder = new MinioClient()
            .WithEndpoint(hostPort)
            .WithCredentials(accessKey, secretKey);
        if (uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase))
            builder = builder.WithSSL();
        _client = builder.Build();
    }

    private async Task EnsureBucketExistsAsync(CancellationToken ct)
    {
        if (_bucketEnsured) return;
        var exists = await _client.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucket), ct).ConfigureAwait(false);
        if (!exists)
            await _client.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucket), ct).ConfigureAwait(false);
        _bucketEnsured = true;
    }

    public async Task<string> SaveAsync(Stream content, string fileName, string contentType, string subFolder, CancellationToken ct = default)
    {
        await EnsureBucketExistsAsync(ct).ConfigureAwait(false);
        var safeName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var objectKey = $"{subFolder.Replace('\\', '/').TrimEnd('/')}/{safeName}";

        var args = new PutObjectArgs()
            .WithBucket(_bucket)
            .WithObject(objectKey)
            .WithStreamData(content)
            .WithObjectSize(content.Length)
            .WithContentType(contentType);
        await _client.PutObjectAsync(args, ct).ConfigureAwait(false);
        return objectKey;
    }

    public async Task<Stream?> GetAsync(string path, CancellationToken ct = default)
    {
        try
        {
            var stream = new MemoryStream();
            var args = new GetObjectArgs()
                .WithBucket(_bucket)
                .WithObject(path)
                .WithCallbackStream(s =>
                {
                    s.CopyTo(stream);
                });
            await _client.GetObjectAsync(args, ct).ConfigureAwait(false);
            stream.Position = 0;
            return stream;
        }
        catch (Minio.Exceptions.ObjectNotFoundException)
        {
            return null;
        }
    }

    public async Task<bool> DeleteAsync(string path, CancellationToken ct = default)
    {
        try
        {
            await _client.RemoveObjectAsync(new RemoveObjectArgs().WithBucket(_bucket).WithObject(path), ct).ConfigureAwait(false);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<string?> GetAccessUrlAsync(string path, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;
        try
        {
            var exp = expiry ?? _defaultUrlExpiry;
            var seconds = (int)Math.Clamp(exp.TotalSeconds, 1, 604800); // MinIO allows 1s to 7 days
            var args = new PresignedGetObjectArgs()
                .WithBucket(_bucket)
                .WithObject(path)
                .WithExpiry(seconds);
            var url = await _client.PresignedGetObjectAsync(args).ConfigureAwait(false);
            return !string.IsNullOrWhiteSpace(url) ? url : null;
        }
        catch
        {
            return null;
        }
    }
}
