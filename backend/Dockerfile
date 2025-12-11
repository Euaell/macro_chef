# Backend Development Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0

WORKDIR /src

ENV DOTNET_USE_POLLING_FILE_WATCHER=true
ENV ASPNETCORE_ENVIRONMENT=Development

# Copy solution and project files for restore
COPY ["Mizan.sln", "./"]
COPY ["Mizan.Api/Mizan.Api.csproj", "Mizan.Api/"]
COPY ["Mizan.Application/Mizan.Application.csproj", "Mizan.Application/"]
COPY ["Mizan.Domain/Mizan.Domain.csproj", "Mizan.Domain/"]
COPY ["Mizan.Infrastructure/Mizan.Infrastructure.csproj", "Mizan.Infrastructure/"]
COPY ["Mizan.Tests/Mizan.Tests.csproj", "Mizan.Tests/"]

RUN dotnet restore "Mizan.Api/Mizan.Api.csproj"

EXPOSE 8080

CMD ["dotnet", "watch", "run", "--project", "Mizan.Api/Mizan.Api.csproj", "--urls", "http://0.0.0.0:8080"]
