# ============================================
# Build stage
# ============================================

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copy the backend project file first
# This allows Docker to cache the NuGet restore layer.
COPY SmartHR/SmartHR.csproj SmartHR/

# Restore NuGet packages
RUN dotnet restore SmartHR/SmartHR.csproj

# Copy the complete backend source
COPY SmartHR/ SmartHR/

# Publish the application
WORKDIR /src/SmartHR

RUN dotnet publish SmartHR.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false


# ============================================
# Runtime stage
# ============================================

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

# Copy published application from build stage
COPY --from=build /app/publish .

# Render will provide traffic on port 10000
ENV ASPNETCORE_HTTP_PORTS=10000

EXPOSE 10000

# Start SmartHR
ENTRYPOINT ["dotnet", "SmartHR.dll"]