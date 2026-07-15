# Zyphron Dashboard — Pterodactyl API Documentation

This document covers the Pterodactyl Panel API integration used by the Zyphron hosting dashboard.

## Overview

Zyphron uses the **Pterodactyl Application API** (server-side only, never exposed to the client) to manage servers, users, eggs, nests, nodes, and allocations.

- **Panel URL**: `https://console.zyphron.cloud`
- **API Base**: `https://console.zyphron.cloud/api/application`
- **Auth**: Bearer token (Application API key starting with `ptla_`)
- **Required Header**: `Accept: application/vnd.pterodactyl.v1+json`

## Authentication

All requests must include:
```
Authorization: Bearer ptla_XXXXXXXXXXXXXXXXXXXXXXXX
Content-Type: application/json
Accept: application/vnd.pterodactyl.v1+json
```

> **Important**: The `Accept` header must be `application/vnd.pterodactyl.v1+json`, NOT `application/json`. Without this, Pterodactyl will return unexpected responses or errors.

## Response Format

All list endpoints return data in this format:
```json
{
 "data": [
 {
 "object": "nest",
 "attributes": {
 "id": 1,
 "name": "Minecraft",
 ...
 }
 }
 ],
 "meta": { ... }
}
```

Single resource endpoints:
```json
{
 "object": "egg",
 "attributes": {
 "id": 1,
 "name": "Paper",
 ...
 }
}
```

## Endpoints Used by Zyphron

### Nests (Game Types)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/application/nests` | List all nests |
| GET | `/api/application/nests/{id}` | Get a specific nest |
| GET | `/api/application/nests/{id}?include=eggs` | Get nest with eggs |

**Zyphron routes**:
- `GET /api/admin/pterodactyl/nests` → lists all nests for admin product create/edit
- `GET /api/products/nests` → lists all nests (public)

### Eggs (Server Types)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/application/nests/{nestId}/eggs` | List eggs for a nest |
| GET | `/api/application/nests/{nestId}/eggs/{eggId}` | Get a specific egg |
| GET | `/api/application/nests/{nestId}/eggs/{eggId}?include=variables` | Get egg with variables |

**Zyphron routes**:
- `GET /api/admin/pterodactyl/nests/:id/eggs` → list eggs for nest (admin)
- `GET /api/products/nests/:nestId/eggs` → list eggs for nest (public, auth required)

### Nodes (Servers)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/application/nodes` | List all nodes |
| GET | `/api/application/nodes/{id}` | Get a specific node |

**Zyphron routes**:
- `GET /api/admin/pterodactyl/nodes` → list all nodes

### Allocations (IP:Port mappings)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/application/nodes/{id}/allocations` | List allocations for a node |

**Zyphron usage**: Called internally when creating a server to find a free allocation.

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/application/users` | List all users |
| GET | `/api/application/users/{id}` | Get a specific user |
| POST | `/api/application/users` | Create a new user |
| PATCH | `/api/application/users/{id}` | Update a user |
| DELETE | `/api/application/users/{id}` | Delete a user |

**Zyphron usage**: User auto-registration during dashboard signup; admin user management.

### Servers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/application/servers` | List all servers |
| GET | `/api/application/servers/{id}` | Get a specific server |
| POST | `/api/application/servers` | Create a new server |
| PATCH | `/api/application/servers/{id}/build` | Update server build settings |
| POST | `/api/application/servers/{id}/suspend` | Suspend a server |
| POST | `/api/application/servers/{id}/unsuspend` | Unsuspend a server |
| DELETE | `/api/application/servers/{id}` | Delete a server |
| POST | `/api/application/servers/{id}/transfer` | Transfer server to another user |
| GET | `/api/application/servers/{id}/utilization` | Get server resource utilization |

### Locations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/application/locations` | List all locations |

**Zyphron routes**:
- `GET /api/admin/pterodactyl/locations` → list all locations

## Zyphron Admin API Routes

All admin routes require JWT authentication + AdminGuard.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/pterodactyl/config` | Get panel configuration |
| PUT | `/api/admin/pterodactyl/config` | Update panel URL and API key |
| POST | `/api/admin/pterodactyl/test` | Test panel connection |
| GET | `/api/admin/pterodactyl/nests` | List all nests |
| GET | `/api/admin/pterodactyl/nests/:id/eggs` | List eggs for a nest |
| GET | `/api/admin/pterodactyl/nodes` | List all nodes |
| GET | `/api/admin/pterodactyl/locations` | List all locations |
| GET | `/api/admin/pterodactyl/users` | List Pterodactyl users |
| GET | `/api/admin/pterodactyl/users/:id` | Get Pterodactyl user detail |
| PUT | `/api/admin/pterodactyl/users/:id` | Update Pterodactyl user |
| GET | `/api/admin/pterodactyl/servers/:id/utilization` | Get server utilization |
| POST | `/api/admin/pterodactyl/servers/:id/transfer` | Transfer server to user |

## Zyphron Products API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/nests` | List all nests |
| GET | `/api/products/nests/:nestId/eggs` | List eggs for a nest |
| GET | `/api/products/nodes` | List all nodes |
| GET | `/api/products/:id` | Get a product |
| POST | `/api/products` | Create a product (admin) |
| PUT | `/api/products/:id` | Update a product (admin) |
| DELETE | `/api/products/:id` | Delete a product (admin) |

## Error Handling

Pterodactyl returns errors in this format:
```json
{
 "errors": [
 {
 "code": "AuthenticationException",
 "status": "401",
 "detail": "Unauthenticated."
 }
 ]
}
```

Common errors:
- **401 Unauthorized**: Invalid or expired API key
- **404 Not Found**: Resource doesn't exist
- **422 Unprocessable Entity**: Validation error in request body

## Technical Notes

1. **Accept Header**: Must be `application/vnd.pterodactyl.v1+json`. Using `application/json` will cause authentication failures or unexpected response formats.

2. **Response Wrapping**: All list responses are wrapped in `{ "data": [...] }`. Access with `res.data`.

3. **Egg Variables**: When creating servers, eggs must be fetched with `?include=variables` to get startup command and environment variables.

4. **Allocations**: Servers require a free allocation (IP:Port). Unassigned allocations can be found by filtering `assigned === false`.

5. **Docker Images**: Each egg has a default Docker image. It can be overridden when creating a server.