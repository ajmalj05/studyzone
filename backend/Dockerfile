# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files (preserve directory structure for project references)
COPY Studyzone.Api/Studyzone.Api.csproj Studyzone.Api/
COPY Studyzone.Application/Studyzone.Application.csproj Studyzone.Application/
COPY Studyzone.Infrastructure/Studyzone.Infrastructure.csproj Studyzone.Infrastructure/
COPY Studyzone.Domain/Studyzone.Domain.csproj Studyzone.Domain/

RUN dotnet restore Studyzone.Api/Studyzone.Api.csproj

COPY . .
RUN dotnet publish Studyzone.Api/Studyzone.Api.csproj -c Release -o /app/publish --no-restore

# Run stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS run
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Studyzone.Api.dll"]
